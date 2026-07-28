<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'egov_sso' => [
        'base_url' => env('EGOV_SSO_BASE_URL', 'https://hackathon-sso.e.gov.ph'),
        'scope' => env('EGOV_SSO_SCOPE', 'SSO_AUTHENTICATION'),
        'partner_code' => env('EGOV_SSO_PARTNER_CODE', 'HACKATHON_SSO'),
        'partner_secret' => env('EGOV_SSO_PARTNER_SECRET'),
        'test_accounts' => [
            'josie@yopmail.com' => env('EGOV_SSO_JOSIE_EXCHANGE_CODE'),
            'josie01@yopmail.com' => env('EGOV_SSO_JOSIE01_EXCHANGE_CODE'),
            'josie02@yopmail.com' => env('EGOV_SSO_JOSIE02_EXCHANGE_CODE'),
            'josie03@yopmail.com' => env('EGOV_SSO_JOSIE03_EXCHANGE_CODE'),
            'josie04@yopmail.com' => env('EGOV_SSO_JOSIE04_EXCHANGE_CODE'),
        ],
    ],

    'egov_ai' => [
        'base_url' => env('EGOV_AI_BASE_URL', 'https://egov-ai-core-ws.oueg.info'),
        'token' => env('EGOV_AI_TOKEN'),
        'source_lang' => env('EGOV_AI_SOURCE_LANG', 'fi'),
        'target_lang' => env('EGOV_AI_TARGET_LANG', 'en'),
        'category' => env('EGOV_AI_CATEGORY', 'PH'),
    ],

    'egov_message' => [
        'enabled' => env('EGOV_MESSAGE_ENABLED', false),
        'endpoint' => env('EGOV_MESSAGE_ENDPOINT', 'https://ws-message.e.gov.ph/messaging/v1/sms/push'),
        'auth_token' => env('EGOV_MESSAGE_AUTH_TOKEN'),
        'recipient' => env('EGOV_MESSAGE_RECIPIENT', '+639683013603'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
