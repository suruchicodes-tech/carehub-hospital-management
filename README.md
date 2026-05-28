# CareHub Real OTP Backend

This backend serves the browser website and provides real OTP APIs.

## Setup

1. Copy `.env.example` to `.env`.
2. Add your MSG91 values:
   - `MSG91_AUTH_KEY`
   - `MSG91_TEMPLATE_ID`
   - optional `MSG91_SENDER_ID`
3. Start the server:

```powershell
node "C:\hms project\hospital management system\backend\server.js"
```

4. Open:

```text
http://127.0.0.1:8090
```

## Provider Choice

`OTP_PROVIDER=msg91` is the default and recommended option. If MSG91 fails and `FAST2SMS_API_KEY` is set, the server can try Fast2SMS as a fallback.

## Important

Do not commit or share `.env`. Keep API keys secret.
