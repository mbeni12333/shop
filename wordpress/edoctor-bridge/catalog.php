<?php
defined('ABSPATH') || exit();

/** Public catalog only: authentication must never make drafts visible. */
function ed_public_product($p)
{
    return $p &&
        $p->get_status() === 'publish' &&
        !$p->is_type('variation') &&
        get_post_field('post_password', $p->get_id()) === '' &&
        $p->get_catalog_visibility() !== 'hidden';
}
function ed_product_node($p)
{
    if (!ed_public_product($p)) {
        return null;
    }
    return [
        'databaseId' => $p->get_id(),
        'slug' => $p->get_slug(),
        'name' => $p->get_name(),
        'sku' => $p->get_sku(),
        'description' => $p->get_description(),
        'image' => [
            'sourceUrl' =>
                wp_get_attachment_image_url($p->get_image_id(), 'full') ?: '',
        ],
        'edoctorDetails' => ed_details($p->get_id()),
    ];
}
function ed_category_node($term)
{
    $parent = $term->parent ? get_term($term->parent, 'product_cat') : null;
    return [
        'slug' => $term->slug,
        'name' => $term->name,
        'description' => $term->description,
        'count' => (int) $term->count,
        'parent' =>
            $parent && !is_wp_error($parent)
                ? ['node' => ['slug' => $parent->slug]]
                : null,
        'image' => [
            'sourceUrl' =>
                wp_get_attachment_image_url(
                    get_term_meta($term->term_id, 'thumbnail_id', true),
                    'full',
                ) ?:
                '',
        ],
    ];
}
add_action('graphql_register_types', function () {
    register_graphql_object_type('EDImage', [
        'fields' => ['sourceUrl' => ['type' => 'String']],
    ]);
    register_graphql_object_type('EDCategoryParentNode', [
        'fields' => ['slug' => ['type' => 'String']],
    ]);
    register_graphql_object_type('EDCategoryParent', [
        'fields' => ['node' => ['type' => 'EDCategoryParentNode']],
    ]);
    register_graphql_object_type('EDStorefrontProduct', [
        'fields' => [
            'databaseId' => ['type' => 'Int'],
            'slug' => ['type' => 'String'],
            'name' => ['type' => 'String'],
            'sku' => ['type' => 'String'],
            'description' => ['type' => 'String'],
            'image' => ['type' => 'EDImage'],
            'edoctorDetails' => ['type' => 'String'],
        ],
    ]);
    register_graphql_object_type('EDStorefrontCategory', [
        'fields' => [
            'slug' => ['type' => 'String'],
            'name' => ['type' => 'String'],
            'description' => ['type' => 'String'],
            'count' => ['type' => 'Int'],
            'parent' => ['type' => 'EDCategoryParent'],
            'image' => ['type' => 'EDImage'],
        ],
    ]);
    register_graphql_object_type('EDPageInfo', [
        'fields' => [
            'hasNextPage' => ['type' => 'Boolean'],
            'endCursor' => ['type' => 'String'],
        ],
    ]);
    register_graphql_object_type('EDProductConnection', [
        'fields' => [
            'nodes' => ['type' => ['list_of' => 'EDStorefrontProduct']],
            'pageInfo' => ['type' => 'EDPageInfo'],
        ],
    ]);
    register_graphql_object_type('EDCategoryConnection', [
        'fields' => [
            'nodes' => ['type' => ['list_of' => 'EDStorefrontCategory']],
        ],
    ]);
    register_graphql_input_type('EDProductWhere', [
        'fields' => ['status' => ['type' => 'String']],
    ]);
    register_graphql_input_type('EDCategoryWhere', [
        'fields' => ['hideEmpty' => ['type' => 'Boolean']],
    ]);
    register_graphql_enum_type('EDProductIdType', [
        'values' => ['SLUG' => ['value' => 'slug']],
    ]);
    register_graphql_field('RootQuery', 'products', [
        'type' => 'EDProductConnection',
        'args' => [
            'first' => ['type' => 'Int'],
            'after' => ['type' => 'String'],
            'where' => ['type' => 'EDProductWhere'],
        ],
        'resolve' => function ($source, $args) {
            if (!function_exists('wc_get_products')) {
                throw new \GraphQL\Error\UserError('WooCommerce indisponible.');
            }
            $limit = max(1, min(100, (int) ($args['first'] ?? 100)));
            $offset = 0;
            if (!empty($args['after'])) {
                $cursor = base64_decode($args['after'], true);
                if (!$cursor || !preg_match('/^ed:(\d+)$/', $cursor, $match)) {
                    throw new \GraphQL\Error\UserError('Curseur invalide.');
                }
                $offset = (int) $match[1];
            }
            // Query public visibility explicitly; then reject password-protected nodes too.
            $items = wc_get_products([
                'status' => 'publish',
                'limit' => $limit + 1,
                'offset' => $offset,
                'orderby' => 'ID',
                'order' => 'ASC',
            ]);
            $more = count($items) > $limit;
            $items = array_slice($items, 0, $limit);
            return [
                'nodes' => array_values(
                    array_filter(array_map('ed_product_node', $items)),
                ),
                'pageInfo' => [
                    'hasNextPage' => $more,
                    'endCursor' => base64_encode(
                        'ed:' . ($offset + count($items)),
                    ),
                ],
            ];
        },
    ]);
    register_graphql_field('RootQuery', 'product', [
        'type' => 'EDStorefrontProduct',
        'args' => [
            'id' => ['type' => ['non_null' => 'ID']],
            'idType' => ['type' => 'EDProductIdType'],
        ],
        'resolve' => function ($source, $args) {
            if (!function_exists('wc_get_product')) {
                throw new \GraphQL\Error\UserError('WooCommerce indisponible.');
            }
            $post = get_page_by_path($args['id'], OBJECT, 'product');
            return $post ? ed_product_node(wc_get_product($post->ID)) : null;
        },
    ]);
    register_graphql_field('RootQuery', 'productCategories', [
        'type' => 'EDCategoryConnection',
        'args' => [
            'first' => ['type' => 'Int'],
            'where' => ['type' => 'EDCategoryWhere'],
        ],
        'resolve' => function ($source, $args) {
            $terms = get_terms([
                'taxonomy' => 'product_cat',
                'hide_empty' => $args['where']['hideEmpty'] ?? false,
                'number' => max(1, min(1000, (int) ($args['first'] ?? 100))),
                'orderby' => 'term_id',
                'order' => 'ASC',
            ]);
            if (is_wp_error($terms)) {
                throw new \GraphQL\Error\UserError('Catégories indisponibles.');
            }
            return ['nodes' => array_map('ed_category_node', $terms)];
        },
    ]);
});
