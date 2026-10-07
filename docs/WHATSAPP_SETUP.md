# WhatsApp appointment confirmation setup

The booking backend integrates with the official Meta WhatsApp Business Cloud API. Bookings remain successful and permanently stored when WhatsApp is disabled, unconfigured, or temporarily unavailable.

## 1. Create the approved template

In WhatsApp Manager, create and approve a Utility template named `appointment_confirmation` with language `en` and exactly four body variables:

```text
Hi {{1}},

Your appointment has been confirmed.

Booking ID: {{2}}
Date: {{3}}
Time: {{4}}

Thank you for booking with us.
Please keep your Booking ID for future reference.
```

The server maps the variables to patient name, booking ID, appointment date, and appointment time.

## 2. Configure server-side environment variables

Set these in the Hostinger/PHP runtime configuration. Never place real values in JavaScript or commit them to Git.

```env
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=your_permanent_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_sender_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_API_VERSION=v23.0
WHATSAPP_TEMPLATE_NAME=appointment_confirmation
WHATSAPP_TEMPLATE_LANGUAGE=en
WHATSAPP_APP_SECRET=your_meta_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=a_long_random_value_you_choose
```

Use a permanent system-user token with only the required WhatsApp permissions. Leave `WHATSAPP_ENABLED=false` until the template and sender are ready.

## 3. Configure delivery webhooks

Set the Meta callback URL to:

```text
https://YOUR-DOMAIN/api/booking/whatsapp-webhook
```

Use the same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, subscribe to message status events, and keep `WHATSAPP_APP_SECRET` configured so POST signatures can be verified.

## 4. Smoke test

1. Create a booking using a WhatsApp-enabled test recipient.
2. Confirm the booking remains present in Admin even if messaging fails.
3. Check the Admin WhatsApp status and use **Resend WhatsApp** after correcting configuration.
4. Export all bookings and verify the WhatsApp status/history columns.

Server requirements: PHP 8+, cURL, and outbound HTTPS access to `graph.facebook.com`. Excel export additionally requires PHP ZipArchive.
