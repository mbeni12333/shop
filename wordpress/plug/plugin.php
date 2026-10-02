<?php
/**
 * Plugin Name: Headless Login Configuration
 * Description: Enables the password provider without the broken Headless Login settings screen.
 */

defined('ABSPATH') || exit();

add_filter('graphql_login_provider_settings', function ($settings, $slug) {
    if ($slug !== 'password') {
        return is_array($settings) ? $settings : [];
    }

    $settings = is_array($settings) ? $settings : [];
    $login = isset($settings['loginOptions']) && is_array($settings['loginOptions'])
        ? $settings['loginOptions']
        : [];

    $settings['name'] = 'EDoctor';
    $settings['slug'] = 'password';
    $settings['order'] = 0;
    $settings['isEnabled'] = true;
    $settings['clientOptions'] = [];
    $settings['loginOptions'] = array_merge($login, [
        'useAuthenticationCookie' => false,
    ]);

    return $settings;
}, 10, 2);

add_filter('graphql_login_access_control_settings', function ($settings) {
    $settings = is_array($settings) ? $settings : [];
    $domains = isset($settings['additionalAuthorizedDomains']) && is_array($settings['additionalAuthorizedDomains'])
        ? $settings['additionalAuthorizedDomains']
        : [];

    $domains[] = 'http://localhost:3000';
    $settings['additionalAuthorizedDomains'] = array_values(array_unique($domains));
    $settings['shouldBlockUnauthorizedDomains'] = false;

    return $settings;
});