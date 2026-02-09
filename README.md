# Setup Manager HUD

A real-time webhook dashboard for [Setup Manager](https://github.com/nicknameislink/setupmanager) - monitor macOS device enrollments as they happen.

Built with React, shadcn/ui, and Cloudflare Workers. Deploys in minutes. Secured with Cloudflare Access.

<!-- TODO: Add a screenshot here - light and dark mode side by side -->
<!-- ![Setup Manager HUD Dashboard](./docs/screenshot.png) -->

## What It Does

Setup Manager sends webhook events during macOS device provisioning. This dashboard:

- **Shows enrollments in real-time** via WebSocket - no refresh needed
- **Tracks KPIs** - total enrollments, completion rate, average duration, failed actions
- **Displays event details** - device info, macOS version, enrollment actions, timing
- **Charts trends** - events over time, actions breakdown
- **Filters and searches** - by event type, model, macOS version, text search
- **Works in light and dark mode**
- **Secured by Cloudflare Access** - only authorized users can view the dashboard; the webhook endpoint stays open for devices

## Quick Start

### Option 1: Deploy Button (Fastest)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/motionbug/setupmanagerhud)

Click the deploy button above. It will:
1. Fork this repo to your GitHub account
2. Set up a GitHub Actions workflow
3. Deploy to your Cloudflare account

After deployment, you'll need to:
- Create a KV namespace (see [Configuration](#kv-namespace-required))
- Secure the dashboard (see [Securing the Dashboard](#securing-the-dashboard))

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
#    Find the [[kv_namespaces]] section and set:
#    id = "your-namespace-id-here"

# 6. Deploy
npm run deploy
```

Your dashboard is now live at `https://setupmanagerhud.<your-subdomain>.workers.dev`

**Next step:** [Secure the dashboard](#securing-the-dashboard) so only you can access it.

### Option 3: GitHub Actions (Auto-Deploy on Push)

1. Fork this repo
2. In your fork, go to **Settings -> Secrets and variables -> Actions**
3. Add these repository secrets:
   - `CLOUDFLARE_API_TOKEN` - [Create an API token](https://dash.cloudflare.com/profile/api-tokens) with "Edit Cloudflare Workers" permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Found on your Cloudflare dashboard sidebar
4. Create your KV namespace and update `wrangler.toml` (see steps 4-5 above)
5. Push to `main` - the workflow deploys automatically

## Configuration

### KV Namespace (Required)

Setup Manager HUD stores webhook events in [Cloudflare Workers KV](https://developers.cloudflare.com/kv/). You must create a namespace:

```bash
npx wrangler kv namespace create WEBHOOKS
```

Copy the ID from the output and paste it into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "WEBHOOKS"
id = "paste-your-id-here"
```

### Connecting Setup Manager

In your Setup Manager configuration, set the webhook URL to:

```
<key>webhooks</key>
<dict>
  <key>finished</key>
  <string>https://setupmanagerhud.<your-subdomain>.workers.dev/webhook</string>
  <key>started</key>
  <string>https://setupmanagerhud.<your-subdomain>.workers.dev/webhook</string>
</dict>
```

Remember when either the started or finished key is missing, no webhook will be sent for that event.



Setup Manager will POST enrollment events to this endpoint. They'll appear on the dashboard in real-time.

> **Note:** The `/webhook` endpoint is excluded from authentication (see below) so devices can POST without credentials.

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

## Securing the Dashboard

The dashboard displays device enrollment data that you probably don't want public. **Cloudflare Access** lets you add authentication in front of the dashboard without changing any code.

Cloudflare Access is free for up to 50 users. It sits at Cloudflare's edge - before requests even reach your Worker - so there are zero code changes needed.

### How It Works

```
User -> Cloudflare Access (login gate) -> Dashboard (Worker)
Device -> POST /webhook (bypasses Access) -> Worker -> KV
```

- **Dashboard visitors** must authenticate before they can see anything
- **Setup Manager devices** POST to `/webhook` which bypasses authentication entirely
- **WebSocket connections** to `/ws` are also protected - only authenticated users can connect

### Step-by-Step Setup

#### 1. Enable Cloudflare Zero Trust (one time)

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Go to **Zero Trust** in the left sidebar (or visit [one.dash.cloudflare.com](https://one.dash.cloudflare.com))
3. If this is your first time, choose a team name and select the **Free plan** (up to 50 users)
4. Complete the onboarding - no payment is required for the free tier

#### 2. Add an Authentication Method

1. In Zero Trust, go to **Settings -> Authentication**
2. Under **Login methods**, the **One-time PIN** option is enabled by default - this sends a code to the user's email, no identity provider needed
3. *(Optional)* To use an identity provider instead, click **Add new** and configure one of:
   - **GitHub** - good for open source projects
   - **Google** - if you use Google Workspace
   - **Okta / Azure AD / SAML** - for enterprise environments
   - You can enable multiple methods and let users choose

#### 3. Create the Access Application (protect the dashboard)

1. In Zero Trust, go to **Access -> Applications**
2. Click **Add an application** -> select **Self-hosted**
3. Configure:
   - **Application name:** `Setup Manager HUD`
   - **Session duration:** `24 hours` (or your preference)
   - **Application domain:** `setup-manager-hud.<your-subdomain>.workers.dev`
     - If using a custom domain, enter that instead
4. Click **Next** to configure the access policy

#### 4. Create an Allow Policy (who can access the dashboard)

1. **Policy name:** `Allow authorized users`
2. **Action:** `Allow`
3. **Include rule - pick one:**

| Who should access it? | Include rule | Value |
|-----------------------|-------------|-------|
| Just you | Emails | `your@email.com` |
| Your team | Email domain | `yourcompany.com` |
| Specific people | Emails | `alice@example.com`, `bob@example.com` |
| GitHub org members | GitHub organization | `your-org-name` |

4. Click **Next**, then **Add application**

#### 5. Create a Bypass Policy for the Webhook Endpoint

This is critical - without this, Setup Manager devices won't be able to POST enrollment data.

1. In the application you just created, go to the **Policies** tab
2. Click **Add a policy**
3. Configure:
   - **Policy name:** `Bypass webhook`
   - **Action:** `Bypass`
   - **Include rule:** Select **Everyone**
4. Under **Assign policy to paths**, add:
   - Path: `/webhook`
5. Save the policy
6. **Make sure this Bypass policy is listed ABOVE the Allow policy** - drag to reorder if needed (Bypass and Service Auth policies are evaluated first)

#### 6. Verify It Works

**Dashboard (should require login):**
```bash
# This should redirect to a Cloudflare Access login page
curl -I https://setupmanagerhud.<your-subdomain>.workers.dev
# Expected: 302 redirect to <your-team>.cloudflareaccess.com
```

**Webhook (should pass through without auth):**
```bash
# This should return 200 - no login required
curl -X POST https://setupmanagerhud.<your-subdomain>.workers.dev/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"Started","event":"com.jamf.setupmanager.started","timestamp":"2025-01-01T00:00:00Z","started":"2025-01-01T00:00:00Z","modelName":"Test Mac","modelIdentifier":"Mac15,3","macOSBuild":"24A335","macOSVersion":"15.0","serialNumber":"TEST001","setupManagerVersion":"2.0.0"}'
# Expected: 200 OK
```

### Optional: Webhook Token Validation

For additional security on the webhook endpoint, you can add a shared secret so only your Setup Manager instances can POST events. This is **not required** but recommended for production.

Add a secret to your Worker:

```bash
npx wrangler secret put WEBHOOK_SECRET
# Enter a random string when prompted
```

Then configure Setup Manager to send this token in the `Authorization` header:
```
Authorization: Bearer <your-secret>
```

The Worker validates this header on `/webhook` requests if the `WEBHOOK_SECRET` environment variable is set. If it's not set, the webhook accepts all valid payloads (the default behavior).

### Optional: Rate Limiting the Webhook Endpoint

The `/webhook` endpoint is open to the internet so devices can POST enrollment events. To prevent abuse (flooding with fake events, exhausting KV storage), you can add a Cloudflare WAF rate limiting rule. This is configured entirely in the Cloudflare dashboard — no code changes required.

#### Setup

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), select your account and domain (or Workers route)
2. Go to **Security → WAF → Rate limiting rules**
3. Click **Create rule** and configure:
   - **Rule name:** `Rate limit webhook`
   - **If incoming requests match:** Field `URI Path` — Operator `equals` — Value `/webhook`
   - **Rate:** `30 requests` per `1 minute` (adjust based on your fleet size)
   - **With the same:** `IP Address`
   - **Then:** `Block` for `1 minute`
4. Deploy the rule

#### Choosing the Right Rate

The rate depends on how many devices enroll simultaneously from the same IP. Each device sends exactly two webhook requests per enrollment (one `started`, one `finished`), so:

| Fleet scenario | Concurrent enrollments from one IP | Suggested rate |
|---|---|---|
| Small office (1–10 devices) | 1–10 | 30 req/min |
| Medium site (10–50 devices) | 10–50 | 120 req/min |
| Large deployment (50+ from one NAT IP) | 50+ | 300 req/min |

If your devices enroll behind a shared NAT or VPN gateway, choose a higher limit to avoid blocking legitimate traffic. You can always start with a permissive limit and tighten it after observing real traffic patterns in **Security → Analytics**.

### Access Configuration Summary

| Route | Authentication | Who |
|-------|---------------|-----|
| `/` (dashboard) | ✅ Cloudflare Access | Only authorized users |
| `/ws` (WebSocket) | ✅ Cloudflare Access | Only authorized users |
| `/api/events` | ✅ Cloudflare Access | Only authorized users |
| `/api/stats` | ✅ Cloudflare Access | Only authorized users |
| `/api/health` | ✅ Cloudflare Access | Only authorized users |
| `/webhook` | ❌ Bypassed | Any device (Setup Manager) |

## Local Development

```bash
# Start the Vite dev server (frontend only, hot reload)
npm run dev

# Start the full Worker locally (with KV, Durable Objects, WebSocket)
npm run dev:worker
```

For local Worker development, create a `.dev.vars` file (see `.dev.vars.example`).

> **Note:** Cloudflare Access is not active during local development. The dashboard is unprotected when running locally - this is expected and convenient for development.

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

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
