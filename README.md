# Setup Manager HUD

A real-time webhook dashboard for [Setup Manager](https://github.com/nicknameislink/setupmanager) - monitor macOS device enrollments as they happen.

Built with React, shadcn/ui, and Cloudflare Workers. Deploys in minutes. Secured with Cloudflare Access.

| Dark Mode | Light Mode |
|-----------|------------|
| ![Setup Manager HUD - Dark Mode](./docs/setupmanagerhud-dark.png) | ![Setup Manager HUD - Light Mode](./docs/setupmanagerhud-light.png) |

## What It Does

Setup Manager sends webhook events during macOS device provisioning. This dashboard:

- **Shows enrollments in real-time** via WebSocket - no refresh needed
- **Tracks KPIs** - total enrollments, completion rate, average duration, failed actions
- **Displays event details** - device info, macOS version, enrollment actions, timing
- **Charts trends** - events over time, actions breakdown
- **Filters and searches** - by event type, model, macOS version, text search
- **Works in light and dark mode**
- **Can be secured by Cloudflare Access** - only authorized users can view the dashboard; the webhook endpoint stays open for devices

## Quick Start

**You do not have to fork this repo!** You can deploy it directly to your Cloudflare account.

### Option 1: Deploy Button (Fastest)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/motionbug/setupmanagerhud)

Click the deploy button above. It will:
1. Fork this repo to your GitHub account
2. Set up a GitHub Actions workflow
3. Deploy to your Cloudflare account

> **Tip:** During setup, you'll be asked for a project name. This becomes your Worker URL (`<project-name>.<your-subdomain>.workers.dev`). You can name it anything you like — `setupmanagerhud`, `enrollment-dashboard`, or even something obscure like `x7k9-internal`. A less obvious name makes the URL harder to guess, which is fine as long as it's a valid URL (lowercase letters, numbers, and hyphens).

After clicking Deploy, you'll need to:
- Create a KV namespace and bind it to your Worker (see [KV Namespace](#kv-namespace-required)) — no CLI needed, this is done entirely in the Cloudflare dashboard
- Set a `WEBHOOK_TOKEN` secret on your Worker (see [Webhook Token](#webhook-token-required))
- Optionally [secure the dashboard](#security-setup) with Cloudflare Access

### Option 2: Manual Deploy

**Prerequisites:**
- [Node.js](https://nodejs.org/) 20 or later
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)

```bash
# 1. Clone the repo
git clone https://github.com/motionbug/setupmanagerhud.git
cd setupmanagerhud

# 2. Install dependencies
npm install

# 3. Log in to Cloudflare
npx wrangler login

# 4. Create the KV namespace for event storage
npx wrangler kv namespace create WEBHOOKS
# -> Copy the ID from the output

# 5. Paste the KV namespace ID into wrangler.toml:
#    Uncomment the [[kv_namespaces]] section and set:
#    id = "your-namespace-id-here"

# 6. Set the webhook token secret
npx wrangler secret put WEBHOOK_TOKEN

# 7. Deploy
npm run deploy
```

Your dashboard is now live at `https://setupmanagerhud.<your-subdomain>.workers.dev`

**Next step:** [Secure the dashboard](#security-setup) so only you can access it.

### Option 3: GitHub Actions

> **Note:** If you used the Deploy Button (Option 1), this is already set up for you. This section is for manual forks or if you need to reconfigure the workflow.

This repo includes a GitHub Actions workflow that builds and deploys to Cloudflare Workers. It runs manually from the Actions tab — useful if you prefer deploying from GitHub instead of the command line.

GitHub Actions needs permission to deploy to your Cloudflare account. This is done through two repository secrets:

1. Fork this repo
2. **Create a Cloudflare API token** — this is what allows GitHub to deploy on your behalf:
   - Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click **Create Token**
   - Use the **Edit Cloudflare Workers** template
   - Save the generated token
3. **Find your Cloudflare Account ID:**
   - Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
   - Your Account ID is shown in the right sidebar on the overview page
4. **Add both as repository secrets** in your fork:
   - Go to **Settings → Secrets and variables → Actions**
   - Add `CLOUDFLARE_API_TOKEN` with the token from step 2
   - Add `CLOUDFLARE_ACCOUNT_ID` with the ID from step 3
5. Create your KV namespace and bind it to your Worker (see [KV Namespace](#kv-namespace-required) — use Option B for CLI)
6. Set `WEBHOOK_TOKEN` as a Worker secret with Wrangler or in the Cloudflare dashboard
7. Go to the **Actions** tab in your fork, select **Deploy to Cloudflare Workers**, and click **Run workflow**

## Security Setup

Setup Manager HUD supports authentication to protect the dashboard and webhook token validation to ensure only your devices can send enrollment events.

> [!TIP]
> **Full security setup guide:** [Security](https://github.com/motionbug/setupmanagerhud/wiki/Security) covers webhook token configuration, Cloudflare Access setup, and rate limiting.

- **Cloudflare Access** protects the dashboard — [setup guide](https://github.com/motionbug/setupmanagerhud/wiki/Security#cloudflare-access-setup)
- **Webhook tokens** validate device requests — [configuration guide](https://github.com/motionbug/setupmanagerhud/wiki/Security#webhook-token-setup-required-for-production)
- **Rate limiting** prevents abuse — [WAF rules guide](https://github.com/motionbug/setupmanagerhud/wiki/Security#rate-limiting-the-webhook-endpoint)

### Cloudflare Access JWT Validation

Cloudflare Access protects the dashboard at the edge. You can also have the Worker verify Cloudflare Access JWTs before serving dashboard, API, and WebSocket requests. This is a production hardening step and is separate from `WEBHOOK_TOKEN`; `/webhook` must bypass Access so Setup Manager devices can post events.

To enable Worker-side JWT validation, create your Access application, find its audience tag and team domain, then add these values to `wrangler.toml`:

```toml
[vars]
CF_ACCESS_AUD = "paste-your-audience-tag-here"
CF_ACCESS_TEAM_DOMAIN = "your-team.cloudflareaccess.com"
```

If you used the Deploy Button, Cloudflare created a copy of this repository in your GitHub account and deployed from that copy. Update `wrangler.toml` in that copied repo, then redeploy in one of two ways:

- Clone your copied repo locally, run `npm install`, edit `wrangler.toml`, then run `npx wrangler login` and `npm run deploy`.
- Edit `wrangler.toml` in GitHub, make sure Actions are enabled and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets exist, then run the deploy workflow.

See the wiki’s [JWT validation section](https://github.com/motionbug/setupmanagerhud/wiki/Security#optional-verify-cloudflare-access-jwts-in-the-worker) for the full walkthrough.

## Configuration

### Webhook Token (Required)

Setup Manager HUD requires a shared token for `POST /webhook`. Generate a long random value, set it as the Worker secret `WEBHOOK_TOKEN`, and configure Setup Manager to send the same value.

With Wrangler:

```bash
npx wrangler secret put WEBHOOK_TOKEN
```

Or in the Cloudflare dashboard, open your Worker, go to **Settings → Variables and Secrets**, add a secret named `WEBHOOK_TOKEN`, and redeploy if prompted.

Setup Manager sends this value in the `Authorization` header without the `Bearer` prefix. The Worker accepts both raw tokens and standard `Bearer` tokens so curl and other tools are easy to use.

### KV Namespace (Required)

Setup Manager HUD stores webhook events in [Cloudflare Workers KV](https://developers.cloudflare.com/kv/). You need to create a namespace and connect it to your Worker. Without this, the Worker will return a 500 error when receiving webhooks.

For Deploy Button users, the easiest path is the Cloudflare dashboard: create a KV namespace, then bind it to your Worker with the variable name `WEBHOOKS`.

For CLI or GitHub Actions deployments, create a namespace and add its ID to `wrangler.toml`:

```bash
npx wrangler kv namespace create WEBHOOKS
```

```toml
[[kv_namespaces]]
binding = "WEBHOOKS"
id = "paste-your-id-here"
```

See the wiki’s [KV configuration guide](https://github.com/motionbug/setupmanagerhud/wiki/Configuration#kv-namespace-required) for dashboard steps, CLI steps, and how redeploys affect bindings.

### Connecting Setup Manager

In your Setup Manager configuration, set the webhook URL to:

```
<key>webhooks</key>
<dict>
  <key>started</key>
  <string>https://setupmanagerhud.<your-subdomain>.workers.dev/webhook</string>
  <key>finished</key>
  <string>https://setupmanagerhud.<your-subdomain>.workers.dev/webhook</string>
</dict>
```

If either the `started` or `finished` key is missing, no webhook will be sent for that event.

Setup Manager will POST enrollment events to this endpoint. They'll appear on the dashboard in real-time.

> [!NOTE]
> Webhook requests require `WEBHOOK_TOKEN`. See [Webhook Token Setup](https://github.com/motionbug/setupmanagerhud/wiki/Security#webhook-token-setup-required-for-production) in the wiki.

### Test with a Sample Webhook

You can test without Setup Manager by sending a sample webhook:

```bash
curl -X POST https://setupmanagerhud.<your-subdomain>.workers.dev/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: your-webhook-token" \
  -d '{
    "name": "Started",
    "event": "com.jamf.setupmanager.started",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "started": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "modelName": "MacBook Pro",
    "modelIdentifier": "Mac15,3",
    "macOSBuild": "24A335",
    "macOSVersion": "15.0",
    "serialNumber": "TESTSERIAL01",
    "setupManagerVersion": "2.0.0"
  }'
```

> [!TIP]
> **Advanced configuration:** See the [Configuration](https://github.com/motionbug/setupmanagerhud/wiki/Configuration) wiki page for environment variables, wrangler.toml reference, and health check endpoints.

## Local Development

```bash
# Start the Vite dev server (frontend only, hot reload)
npm run dev

# Start the full Worker locally (with KV, Durable Objects, WebSocket)
npm run dev:worker
```

For local Worker development, create a `.dev.vars` file (see `.dev.vars.example`).

> **Note:** Cloudflare Access is not active during local development. The dashboard is unprotected when running locally, but `/webhook` still requires `WEBHOOK_TOKEN`.

## Testing the Dashboard

After deploying, you can populate the dashboard with dummy data to verify everything is working.

### Send Dummy Events

The included test script generates 140 realistic webhook events (70 started + 70 finished) across 10 simulated devices, spread over the past 3 days. This gives the dashboard enough data to display KPIs, charts, and event details.

```bash
# Replace with your actual Worker URL
WORKER_URL=https://setupmanagerhud.<your-subdomain>.workers.dev \
  WEBHOOK_TOKEN=your-token-here \
  node scripts/send-dummy-events.js
```

The script sends the token as `Authorization: Bearer <token>`. Setup Manager sends the same token as a raw `Authorization` header; both formats are accepted.

Once the script finishes, open the dashboard in your browser. You should see events appearing with device details, enrollment actions, and charts populated with data.

### Cleaning Up Test Data from KV

Dummy events use serial numbers starting with `DUMMY` and expire automatically after 90 days. You can remove them sooner from the Cloudflare KV dashboard by filtering for `DUMMY` in your `WEBHOOKS` namespace.

## Architecture

```
                    ┌─── Cloudflare Access ───┐
                    │   (authentication gate)  │
                    └──────────┬───────────────┘
                               │
                    Authenticated requests only
                               │
                               ▼
┌─────────────────────────────────────────────────┐
│              Cloudflare Worker                 │
│                                                │
│  POST /webhook ──→ Validate ──→ Store in KV    │
│  (bypasses Access)       └──→ Broadcast via DO │
│                                                │
│  GET /ws ──→ Durable Object (WebSocket hub)    │
│                  ├── Send history on connect   │
│                  └── Broadcast new events live │
│                                                │
│  GET /api/events ──→ Read from KV              │
│  GET /api/stats  ──→ Aggregate from KV         │
│  GET /api/health ──→ Check KV + DO status      │
│                                                │
│  GET /* ──→ Serve React dashboard (static)     │
└─────────────────────────────────────────────────┘
```

- **Cloudflare Access** - Authentication gate at the edge. Protects the dashboard, bypasses the webhook. Free for up to 50 users.
- **Cloudflare Workers** - Serverless edge runtime, handles all HTTP and WebSocket traffic
- **Durable Objects** - WebSocket hub with hibernation for real-time event broadcasting
- **Workers KV** - Event storage with 90-day TTL
- **React + shadcn/ui** - Dashboard UI, built with Vite, served as static assets

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| Worker returns 500 error | KV namespace not bound | See [KV setup](https://github.com/motionbug/setupmanagerhud/wiki/Configuration#kv-namespace-required) |
| Dashboard shows no events | WebSocket not connecting | Check browser console for errors |
| Webhook returns 401 | Token mismatch | Verify `WEBHOOK_TOKEN` matches your Setup Manager config |
| Can't access dashboard | Cloudflare Access misconfigured | Check `CF_ACCESS_AUD` and `CF_ACCESS_TEAM_DOMAIN` |

For detailed fixes, see the [Troubleshooting wiki](https://github.com/motionbug/setupmanagerhud/wiki/Troubleshooting). For token behavior, see [Webhook Authentication Format](https://github.com/motionbug/setupmanagerhud/wiki/Troubleshooting#webhooks-return-401-unauthorized).

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
