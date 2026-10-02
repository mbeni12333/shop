<?php
/**
 * Plugin Name: EDoctor Storefront Bridge
 * Description: WooGraphQL HT metadata, signed basket handoff, advice requests and export checkout.
 * Version: 1.0.0
 * License: AGPL-3.0-or-later
 */
defined('ABSPATH') || exit();

function ed_secret()
{
    return defined('EDOCTOR_CHECKOUT_SECRET') ? EDOCTOR_CHECKOUT_SECRET : '';
}
function ed_ready()
{
    return defined('EDOCTOR_COMMERCE_READY') && EDOCTOR_COMMERCE_READY;
}
function ed_export_ready()
{
    return defined('EDOCTOR_EXPORT_READY') && EDOCTOR_EXPORT_READY;
}
function ed_price($p)
{
    return $p->get_price() === ''
        ? null
        : (float) wc_get_price_excluding_tax($p);
}
function ed_details($id)
{
    $p = wc_get_product($id);
    if (!$p || $p->get_status() !== 'publish') {
        return null;
    }
    $attrs = [];
    foreach ($p->get_attributes() as $attr) {
        $values = $attr->is_taxonomy()
            ? wc_get_product_terms($id, $attr->get_name(), [
                'fields' => 'names',
            ])
            : $attr->get_options();
        if (!is_wp_error($values)) {
            $attrs[wc_attribute_label($attr->get_name())] = implode(
                ', ',
                $values,
            );
        }
    }
    $cats = wp_get_post_terms($id, 'product_cat', ['fields' => 'slugs']);
    $variants = [];
    if ($p->is_type('variable')) {
        foreach ($p->get_children() as $vid) {
            $v = wc_get_product($vid);
            if (
                !$v ||
                $v->get_status() !== 'publish' ||
                !$v->variation_is_visible()
            ) {
                continue;
            }
            $variants[] = [
                'id' => $vid,
                'name' => wp_strip_all_tags(
                    wc_get_formatted_variation($v, true, true, false),
                ),
                'price' => ed_price($v),
                'stock' => $v->is_in_stock() && $v->is_purchasable(),
            ];
        }
    }
    // WooCommerce owns the taxonomy: no storefront-side whitelist, every
    // published product_cat slug is returned so facets stay in sync with the
    // back office. The storefront only maps slugs to presentation metadata.
    $categories = !is_wp_error($cats) ? array_values($cats) : [];
    return wp_json_encode([
        'categories' => $categories,
        'brand' =>
            $p->get_attribute('pa_marque') ?: $p->get_attribute('Marque'),
        'tier' => $p->get_attribute('pa_gamme') ?: $p->get_attribute('Gamme'),
        'attributes' => (object) $attrs,
        'uses' => array_values(
            array_filter(
                array_map(
                    'trim',
                    explode(
                        ',',
                        $p->get_attribute('pa_usage') ?:
                        $p->get_attribute('Usage'),
                    ),
                ),
            ),
        ),
        'price' => $p->is_type('variable') ? null : ed_price($p),
        'onSale' => $p->is_on_sale(),
        'publishedAt' => $p->get_date_created()
            ? $p->get_date_created()->date(DATE_ATOM)
            : '',
        'stock' => $p->is_in_stock(),
        'purchasable' =>
            $p->is_purchasable() && $p->is_type(['simple', 'variable']),
        'variations' => $variants,
    ]);
}

add_action('graphql_register_types', function () {
    register_graphql_field('Product', 'edoctorDetails', [
        'type' => 'String',
        'description' =>
            'EDoctor normalized HT prices, attributes and published variations',
        'resolve' => function ($source) {
            return ed_details($source->databaseId);
        },
    ]);
});

function ed_decode_token($token)
{
    if (strlen($token) > 16000 || strlen(ed_secret()) < 32) {
        throw new Exception('Paiement non configuré.');
    }
    $parts = explode('.', $token);
    if (
        count($parts) !== 2 ||
        !hash_equals(hash_hmac('sha256', $parts[0], ed_secret()), $parts[1])
    ) {
        throw new Exception('Lien de panier invalide.');
    }
    $raw = base64_decode(strtr($parts[0], '-_', '+/'), true);
    $data = json_decode($raw ?: '', true);
    if (
        !is_array($data) ||
        !isset($data['exp'], $data['jti'], $data['lines']) ||
        !is_int($data['exp']) ||
        $data['exp'] < time() ||
        $data['exp'] > time() + 180 ||
        !preg_match('/^[a-f0-9]{48}$/', $data['jti'])
    ) {
        throw new Exception('Ce panier a expiré. Revenez à la boutique.');
    }
    if (
        !is_array($data['lines']) ||
        count($data['lines']) < 1 ||
        count($data['lines']) > 50
    ) {
        throw new Exception('Panier invalide.');
    }
    $seen = [];
    $stock = [];
    foreach ($data['lines'] as $line) {
        foreach (['productId', 'variationId', 'quantity'] as $key) {
            if (!isset($line[$key]) || !is_int($line[$key])) {
                throw new Exception('Ligne invalide.');
            }
        }
        if (
            $line['productId'] < 1 ||
            $line['variationId'] < 0 ||
            $line['quantity'] < 1 ||
            $line['quantity'] > 20
        ) {
            throw new Exception('Quantité invalide.');
        }
        $key = $line['productId'] . ':' . $line['variationId'];
        if (isset($seen[$key])) {
            throw new Exception('Ligne dupliquée.');
        }
        $seen[$key] = true;
        $parent = wc_get_product($line['productId']);
        $p = wc_get_product($line['variationId'] ?: $line['productId']);
        if (
            !$parent ||
            !$p ||
            $parent->get_status() !== 'publish' ||
            $p->get_status() !== 'publish' ||
            !$parent->is_type(['simple', 'variable']) ||
            !$p->is_purchasable() ||
            !$p->is_in_stock()
        ) {
            throw new Exception('Un produit n’est plus disponible.');
        }
        if (
            ($parent->is_type('variable') && !$line['variationId']) ||
            ($line['variationId'] &&
                (!$p->is_type('variation') ||
                    $p->get_parent_id() !== $parent->get_id()))
        ) {
            throw new Exception('Configuration invalide.');
        }
        if ($p->is_sold_individually() && $line['quantity'] !== 1) {
            throw new Exception('Ce produit est limité à une unité.');
        }
        $managed = $p->get_stock_managed_by_id();
        $stock[$managed] = ($stock[$managed] ?? 0) + $line['quantity'];
        $manager = wc_get_product($managed);
        if (!$manager || !$manager->has_enough_stock($stock[$managed])) {
            throw new Exception('Stock insuffisant.');
        }
    }
    return $data;
}
add_action('edoctor_expire_token', function ($key) {
    delete_option($key);
});
add_action('template_redirect', function () {
    if (!isset($_GET['edoctor_checkout'])) {
        return;
    }
    nocache_headers();
    header('Referrer-Policy: no-referrer');
    try {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !ed_ready()) {
            throw new Exception(
                'La boutique prépare son ouverture. Contactez EDoctor.',
            );
        }
        $data = ed_decode_token(
            isset($_POST['edoctor_token'])
                ? (string) wp_unslash($_POST['edoctor_token'])
                : '',
        );
        $key = 'ed_token_' . $data['jti'];
        if (!add_option($key, time(), '', 'no')) {
            throw new Exception(
                'Ce panier a déjà été transféré. Revenez à la boutique.',
            );
        }
        wp_schedule_single_event(time() + 600, 'edoctor_expire_token', [$key]);
        if (!WC()->cart) {
            wc_load_cart();
        }
        $previous = WC()->cart->get_cart();
        WC()->cart->empty_cart();
        try {
            foreach ($data['lines'] as $line) {
                $v = $line['variationId']
                    ? wc_get_product($line['variationId'])
                    : null;
                if (
                    !WC()->cart->add_to_cart(
                        $line['productId'],
                        $line['quantity'],
                        $line['variationId'],
                        $v ? $v->get_variation_attributes() : [],
                    )
                ) {
                    throw new Exception(
                        'Impossible d’ajouter un produit. Vérifiez le panier.',
                    );
                }
            }
            WC()->customer->set_shipping_country('DZ');
            WC()->customer->set_billing_country('DZ');
            WC()->customer->save();
            WC()->session->set_customer_session_cookie(true);
            WC()->cart->calculate_totals();
            WC()->cart->set_session();
        } catch (Exception $e) {
            WC()->cart->empty_cart();
            foreach ($previous as $item) {
                WC()->cart->add_to_cart(
                    $item['product_id'],
                    $item['quantity'],
                    $item['variation_id'],
                    $item['variation'],
                );
            }
            throw $e;
        }
        wp_safe_redirect(wc_get_checkout_url(), 303);
        exit();
    } catch (Exception $e) {
        wp_die(esc_html($e->getMessage()), 'EDoctor', [
            'response' => 400,
            'back_link' => true,
        ]);
    }
});

add_action('plugins_loaded', function () {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }
    class ED_Advice_Gateway extends WC_Payment_Gateway
    {
        public function __construct()
        {
            $this->id = 'edoctor_advice';
            $this->method_title = 'EDoctor — paiement accompagné';
            $this->title = 'Avec un conseiller — BaridiMob / BaridiWeb';
            $this->description =
                'Votre demande reste en attente. Un conseiller confirme le montant, l’expédition et les modalités de règlement. Ne payez pas avant cette confirmation.';
            $this->enabled = 'yes';
            $this->has_fields = false;
        }
        public function process_payment($order_id)
        {
            $order = wc_get_order($order_id);
            $order->update_meta_data('_edoctor_advice', 'yes');
            $order->update_status(
                'on-hold',
                'Demande accompagnée : règlement et export à confirmer.',
            );
            $order->save();
            WC()->cart->empty_cart();
            return [
                'result' => 'success',
                'redirect' => $this->get_return_url($order),
            ];
        }
    }
    add_filter('woocommerce_payment_gateways', function ($gateways) {
        $gateways[] = 'ED_Advice_Gateway';
        return $gateways;
    });
});
add_filter('woocommerce_available_payment_gateways', function ($gateways) {
    if (is_admin()) {
        return $gateways;
    }
    if (!ed_ready()) {
        return [];
    }
    unset($gateways['cod']);
    if (
        !ed_export_ready() ||
        (WC()->cart &&
            WC()->cart->needs_shipping() &&
            empty(WC()->session->get('chosen_shipping_methods')))
    ) {
        return isset($gateways['edoctor_advice'])
            ? ['edoctor_advice' => $gateways['edoctor_advice']]
            : [];
    }
    return $gateways;
});
add_filter(
    'woocommerce_package_rates',
    function ($rates, $package) {
        if (!ed_ready()) {
            return [];
        }
        if (empty($rates) || !ed_export_ready()) {
            return [
                'edoctor_quote' => new WC_Shipping_Rate(
                    'edoctor_quote',
                    'Expédition sur devis — montant à confirmer',
                    0,
                    [],
                    'edoctor_quote',
                ),
            ];
        }
        return $rates;
    },
    100,
    2,
);
add_filter(
    'woocommerce_available_payment_gateways',
    function ($gateways) {
        if (is_admin() || !WC()->session) {
            return $gateways;
        }
        if (
            in_array(
                'edoctor_quote',
                WC()->session->get('chosen_shipping_methods', []),
                true,
            )
        ) {
            return isset($gateways['edoctor_advice'])
                ? ['edoctor_advice' => $gateways['edoctor_advice']]
                : [];
        }
        return $gateways;
    },
    100,
);
add_action(
    'woocommerce_after_checkout_validation',
    function ($data, $errors) {
        if (!ed_ready()) {
            $errors->add('ed_closed', 'La boutique n’est pas encore ouverte.');
        }
        $country = !empty($data['ship_to_different_address'])
            ? $data['shipping_country'] ?? ''
            : $data['billing_country'] ?? '';
        if ($country !== 'DZ') {
            $errors->add(
                'ed_country',
                'Cette boutique accompagne les livraisons en Algérie. Contactez-nous pour une autre destination.',
            );
        }
        if (
            (!ed_export_ready() ||
                in_array(
                    'edoctor_quote',
                    WC()->session->get('chosen_shipping_methods', []),
                    true,
                )) &&
            ($data['payment_method'] ?? '') !== 'edoctor_advice'
        ) {
            $errors->add(
                'ed_advice',
                'Les modalités d’export doivent être confirmées par un conseiller.',
            );
        }
    },
    10,
    2,
);
add_action('wp_enqueue_scripts', function () {
    if (
        function_exists('is_checkout') &&
        (is_checkout() || is_account_page())
    ) {
        wp_enqueue_style(
            'edoctor-checkout',
            plugins_url('checkout.css', __FILE__),
            [],
            '1.0.0',
        );
    }
});

add_action('init', function () {
    register_post_type('edoctor_request', [
        'label' => 'Demandes EDoctor',
        'public' => false,
        'show_ui' => true,
        'supports' => ['title', 'editor'],
        'capability_type' => 'post',
        'capabilities' => ['create_posts' => 'do_not_allow'],
        'map_meta_cap' => true,
    ]);
});
add_action('rest_api_init', function () {
    register_rest_route('edoctor/v1', '/contact', [
        'methods' => 'POST',
        'permission_callback' => function ($request) {
            return strlen(ed_secret()) >= 32 &&
                hash_equals(
                    hash_hmac('sha256', $request->get_body(), ed_secret()),
                    (string) $request->get_header('x-ed-signature'),
                );
        },
        'callback' => function ($r) {
            $d = $r->get_json_params();
            if (
                abs(time() - (int) ($d['timestamp'] ?? 0)) > 120 ||
                !is_email($d['email'] ?? '') ||
                empty($d['name']) ||
                strlen($d['message'] ?? '') > 12000
            ) {
                return new WP_Error('invalid', 'Demande invalide', [
                    'status' => 400,
                ]);
            }
            $limit = 'ed_contact_' . hash('sha256', strtolower($d['email']));
            if (get_transient($limit)) {
                return new WP_Error(
                    'rate',
                    'Patientez avant de renouveler votre demande',
                    ['status' => 429],
                );
            }
            $id = wp_insert_post(
                [
                    'post_type' => 'edoctor_request',
                    'post_status' => 'private',
                    'post_title' => sanitize_text_field($d['name']),
                    'post_content' =>
                        sanitize_email($d['email']) .
                        "\n\n" .
                        sanitize_textarea_field($d['message']),
                ],
                true,
            );
            if (is_wp_error($id)) {
                return $id;
            }
            set_transient($limit, 1, 60);
            wp_mail(
                get_option('admin_email'),
                'Nouvelle demande EDoctor #' . $id,
                'Une demande vous attend dans l’administration WordPress.',
            );
            return ['ok' => true];
        },
    ]);
});

// Debounced invalidation; failed deliveries are retried by WordPress cron.
function ed_schedule_slug_refresh($slug)
{
    if ($slug && !wp_next_scheduled('edoctor_refresh', [$slug, 0])) {
        wp_schedule_single_event(time() + 5, 'edoctor_refresh', [$slug, 0]);
    }
}
function ed_schedule_refresh($id)
{
    $post = get_post($id);
    if (
        !$post ||
        !in_array(
            $post->post_type,
            ['product', 'product_variation', 'post'],
            true,
        )
    ) {
        return;
    }
    $slug =
        $post->post_type === 'product_variation'
            ? get_post_field('post_name', $post->post_parent)
            : $post->post_name;
    ed_schedule_slug_refresh($slug);
}
add_action('save_post', 'ed_schedule_refresh');
add_action('before_delete_post', 'ed_schedule_refresh');
add_action('woocommerce_product_set_stock', function ($p) {
    ed_schedule_refresh($p->get_id());
});
add_action('woocommerce_variation_set_stock', function ($p) {
    ed_schedule_refresh($p->get_id());
});
// Refresh the previous URL too, so a renamed product/article cannot retain stale content.
add_action(
    'post_updated',
    function ($id, $after, $before) {
        if (
            in_array($after->post_type, ['product', 'post'], true) &&
            $before->post_name !== $after->post_name
        ) {
            ed_schedule_slug_refresh($before->post_name);
        }
    },
    10,
    3,
);
add_action(
    'edoctor_refresh',
    function ($slug, $attempt) {
        if (
            !defined('EDOCTOR_STOREFRONT_URL') ||
            !defined('EDOCTOR_REVALIDATE_SECRET')
        ) {
            return;
        }
        $r = wp_remote_post(
            rtrim(EDOCTOR_STOREFRONT_URL, '/') . '/api/revalidate',
            [
                'timeout' => 30,
                'headers' => [
                    'Authorization' => 'Bearer ' . EDOCTOR_REVALIDATE_SECRET,
                    'Content-Type' => 'application/json',
                ],
                'body' => wp_json_encode(['slugs' => [$slug]]),
            ],
        );
        if (
            (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) &&
            $attempt < 5
        ) {
            wp_schedule_single_event(
                time() + 60 * 2 ** $attempt,
                'edoctor_refresh',
                [$slug, $attempt + 1],
            );
        }
    },
    10,
    2,
);
