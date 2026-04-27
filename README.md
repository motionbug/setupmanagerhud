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

# 5. Paste the KV namespace ID into wrangler.toml
#    Uncomment the [[kv_namespaces]] section and set:
#    id = "your-namespace-id-here"

# 6. Deploy
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
6. Go to the **Actions** tab in your fork, select **Deploy to Cloudflare Workers**, and click **Run workflow**

## Security Setup

Setup Manager HUD supports authentication to protect the dashboard and webhook token validation to ensure only your devices can send enrollment events.

> [!TIP]
> **Full security setup guide:** [Security](https://github.com/motionbug/setupmanagerhud/wiki/Security) covers webhook token configuration, Cloudflare Access setup, and rate limiting.

- **Cloudflare Access** protects the dashboard — [setup guide](https://github.com/motionbug/setupmanagerhud/wiki/Security#cloudflare-access-setup)
- **Webhook tokens** validate device requests — [configuration guide](https://github.com/motionbug/setupmanagerhud/wiki/Security#webhook-token-setup-required-for-production)
- **Rate limiting** prevents abuse — [WAF rules guide](https://github.com/motionbug/setupmanagerhud/wiki/Security#rate-limiting-the-webhook-endpoint)

## Configuration

### KV Namespace (Required)

Setup Manager HUD stores webhook events in [Cloudflare Workers KV](https://developers.cloudflare.com/kv/). You need to create a namespace and connect it to your Worker. Without this, the Worker will return a 500 error when receiving webhooks.

#### Option A: Cloudflare Dashboard (recommended for Deploy Button users)

No CLI or code changes needed — everything is done in the browser.

**1. Create the namespace:**

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Go to [**Workers & Pages → KV**](https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces) in the left sidebar
3. Click **Create a namespace**
4. Name it `WEBHOOKS` (or any name you prefer)
5. Click **Add**

**2. Bind it to your Worker:**

1. Go to [**Workers & Pages**](https://dash.cloudflare.com/?to=/:account/workers) and click on your Worker
2. Go to **Settings → Bindings**
3. Click **Add binding**
4. Select **KV Namespace**
5. Set the **variable name** to `WEBHOOKS` — this must be exactly `WEBHOOKS` as the code references `env.WEBHOOKS`
6. Select the namespace you just created from the dropdown
7. Click **Save** and **Deploy**

Your Worker now has access to KV. No redeploy from GitHub is needed — the binding takes effect immediately.

> **Note:** If you later redeploy from your fork (via GitHub Actions), the deploy will use `wrangler.toml` which has the KV binding commented out. This will **remove the dashboard-set binding**. To avoid this, either re-bind via the dashboard after each deploy, or switch to the CLI method below for a permanent setup.

#### Option B: CLI with Wrangler

If you prefer the command line, or want the binding to persist across redeploys:

**1. Create the namespace:**

```bash
npx wrangler kv namespace create WEBHOOKS
```

This outputs a namespace ID — copy it.

**2. Bind it to your Worker** by opening `wrangler.toml` and **uncommenting** the KV lines, then pasting your ID:

```toml
[[kv_namespaces]]
binding = "WEBHOOKS"
id = "paste-your-id-here"
```

These lines are commented out by default so that first-time deploys don't fail.

**3. Redeploy** so the Worker picks up the new binding:

```bash
npm run deploy
```

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
> To require authentication on webhook requests, see [Webhook Token Setup](https://github.com/motionbug/setupmanagerhud/wiki/Security#webhook-token-setup-required-for-production) in the wiki.

### Test with a Sample Webhook

You can test without Setup Manager by sending a sample webhook:

```bash
curl -X POST https://setupmanagerhud.<your-subdomain>.workers.dev/webhook \
  -H "Content-Type: application/json" \
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

> **Note:** Cloudflare Access is not active during local development. The dashboard is unprotected when running locally — this is expected and convenient for development.

## Testing the Dashboard

After deploying, you can populate the dashboard with dummy data to verify everything is working.

### Send Dummy Events

The included test script generates 140 realistic webhook events (70 started + 70 finished) across 10 simulated devices, spread over the past 3 days. This gives the dashboard enough data to display KPIs, charts, and event details.

```bash
# Replace with your actual Worker URL
WORKER_URL=https://setupmanagerhud.<your-subdomain>.workers.dev \
  node scripts/send-dummy-events.js
```

If you have a `WEBHOOK_SECRET` configured on your Worker, pass it along:

```bash
WORKER_URL=https://setupmanagerhud.<your-subdomain>.workers.dev \
  WEBHOOK_SECRET=your-secret-here \
  node scripts/send-dummy-events.js
```

Once the script finishes, open the dashboard in your browser. You should see events appearing with device details, enrollment actions, and charts populated with data.

### Cleaning Up Test Data from KV

After testing, you'll likely want to remove the dummy events. Cloudflare KV entries have a 90-day TTL so they will expire on their own, but you can remove them immediately through the Cloudflare dashboard:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages → KV** in the left sidebar
3. Click on your **WEBHOOKS** namespace
4. You'll see a list of stored keys — dummy events use serial numbers starting with `DUMMY` (e.g. `com.jamf.setupmanager.started:DUMMY000001:...`)
5. To delete individual entries: click the **three-dot menu** next to an entry and select **Delete**
6. To bulk delete all test data: select entries using the checkboxes, then click **Delete selected**

> **Tip:** You can use the search/filter field at the top of the KV viewer to filter keys containing `DUMMY` to quickly find and select all test entries.

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

## Tech Stack

| Component | Technology | License |
|-----------|-----------|---------|
| Auth | [Cloudflare Access](https://www.cloudflare.com/zero-trust/products/access/) | Free (50 users) |
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com/) | - |
| Real-time | [Durable Objects](https://developers.cloudflare.com/durable-objects/) | - |
| Storage | [Workers KV](https://developers.cloudflare.com/kv/) | - |
| UI | [React](https://react.dev/) + [shadcn/ui](https://ui.shadcn.com/) | MIT |
| Charts | [Recharts](https://recharts.org/) | MIT |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | MIT |
| Icons | [HugeIcons](https://hugeicons.com/) | MIT |
| Font | [Figtree](https://fonts.google.com/specimen/Figtree) | OFL |
| Build | [Vite](https://vite.dev/) | MIT |

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| Worker returns 500 error | KV namespace not bound | See [KV Namespace](#kv-namespace-required) setup |
| Dashboard shows no events | WebSocket not connecting | Check browser console for errors |
| Webhook returns 401 | Token mismatch | Verify `WEBHOOK_SECRET` matches your Setup Manager config |
| Can't access dashboard | Cloudflare Access misconfigured | Check `CF_ACCESS_AUD` and `CF_ACCESS_TEAM_DOMAIN` |

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
