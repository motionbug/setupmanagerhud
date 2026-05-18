# Setup Manager HUD

A real-time webhook dashboard for [Setup Manager](https://github.com/nicknameislink/setupmanager) that helps you monitor macOS device enrollments as they happen.

Built with React, shadcn/ui, and Cloudflare Workers. Webhooks are protected with a required secret token; the dashboard can optionally be protected with Cloudflare Access.

| Dark Mode | Light Mode |
|-----------|------------|
| ![Setup Manager HUD - Dark Mode](./docs/setupmanagerhud-dark.png) | ![Setup Manager HUD - Light Mode](./docs/setupmanagerhud-light.png) |

## What It Does

- Shows Setup Manager enrollment events in real time
- Tracks totals, completion rate, duration, and failed actions
- Displays device details, macOS versions, actions, and timing
- Filters and searches stored events
- Stores event history in Cloudflare D1
- Supports optional Cloudflare Access protection for the dashboard

## Quick Start

You do not have to fork this repo manually. The Cloudflare Deploy Button creates a copy in your GitHub account and deploys the Worker to your Cloudflare account.

You need:

- A GitHub account
- A Cloudflare account
- Access to Setup Manager, or you can test with the included dummy event script

### 1. Generate A Webhook Token

Before you click Deploy, generate a token:

```bash
openssl rand -hex 24
```

Save this value somewhere secure. You will need the exact same token in two places:

- Cloudflare, as the Worker secret named `WEBHOOK_TOKEN`
- Setup Manager, as the `token` value in your webhook configuration

> [!IMPORTANT]
> Do not leave `WEBHOOK_TOKEN` blank. Cloudflare hides Worker secrets after they are saved, so keep a copy of the token before continuing.

### 2. Deploy To Cloudflare

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/motionbug/setupmanagerhud)

The Deploy Button will:

- Copy this repo to your GitHub account
- Provision the Worker resources declared in `wrangler.toml`
- Create the D1 database binding named `DB`
- Build, apply D1 migrations, and deploy the dashboard

During setup, enter your saved token if Cloudflare asks for `WEBHOOK_TOKEN`.

### 3. Verify The Deployment

After deployment:

- Open your Worker URL, such as `https://setupmanagerhud.<your-subdomain>.workers.dev`
- Confirm the Worker has a D1 binding named `DB`
- Confirm `WEBHOOK_TOKEN` is set and non-empty
- Send a test webhook or dummy events
- Optionally protect the dashboard with Cloudflare Access

See the [Configuration wiki](https://github.com/motionbug/setupmanagerhud/wiki/Configuration) for detailed D1, GitHub Actions, manual Wrangler, and health-check steps.

## Connect Setup Manager

Add the webhook URL and token to your Setup Manager configuration:

```xml
<key>webhooks</key>
<dict>
  <key>started</key>
  <dict>
    <key>url</key>
    <string>https://setupmanagerhud.<your-subdomain>.workers.dev/webhook</string>
    <key>token</key>
    <string>your-webhook-token-here</string>
  </dict>
  <key>finished</key>
  <dict>
    <key>url</key>
    <string>https://setupmanagerhud.<your-subdomain>.workers.dev/webhook</string>
    <key>token</key>
    <string>your-webhook-token-here</string>
  </dict>
</dict>
```

Setup Manager sends the token as a raw `Authorization` header. The Worker also accepts `Bearer` tokens for curl and other manual testing.

## Test The Dashboard

From a local clone, you can send dummy events without a real enrollment:

```bash
WORKER_URL=https://setupmanagerhud.<your-subdomain>.workers.dev \
  WEBHOOK_TOKEN=your-token-here \
  node scripts/send-dummy-events.js
```

Open the dashboard after the script finishes. You should see devices, event details, KPIs, and charts populated with test data.

## Security

Setup Manager HUD has two separate security layers:

- `WEBHOOK_TOKEN` is required for `POST /webhook`
- Cloudflare Access is optional and can protect the dashboard, API, and WebSocket routes

The webhook endpoint must stay reachable for devices, but requests are rejected unless the token matches. For full setup instructions, see the [Security wiki](https://github.com/motionbug/setupmanagerhud/wiki/Security).

## Documentation

- [Configuration](https://github.com/motionbug/setupmanagerhud/wiki/Configuration) - D1, environment variables, health checks, manual deploys, and GitHub Actions
- [Security](https://github.com/motionbug/setupmanagerhud/wiki/Security) - webhook token setup, Cloudflare Access, JWT validation, and rate limiting
- [Troubleshooting](https://github.com/motionbug/setupmanagerhud/wiki/Troubleshooting) - common deploy, webhook, D1, WebSocket, and Access issues

## Local Development

```bash
npm install
npm run dev
npm run dev:worker
```

For local Worker development, create a `.dev.vars` file from `.dev.vars.example`.

## Architecture

- Cloudflare Workers handle HTTP, static assets, APIs, and webhook requests
- Durable Objects coordinate WebSocket clients and live fanout
- Cloudflare D1 stores webhook history, stats, and filters
- React and shadcn/ui power the dashboard

## Contributing

Contributions welcome. Please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
