# Webflow to Algolia Sync Worker

A production-ready Cloudflare Worker that syncs your Webflow CMS data to Algolia for search indexing. Built with a modular architecture for maintainability and scalability.

## Project Structure

```
src/
├── index.js              # Cloudflare Worker handlers (cron + webhook)
├── helpers/
    ├── webflow.js        # Webflow API integration
    ├── algolia.js        # Algolia API integration
    └── sync.js           # Main sync orchestration logic
```

**Key Files:**

- **index.js** - Entry point with `scheduled()` (cron) and `fetch()` (webhook) handlers
- **helpers/webflow.js** - Functions to fetch collections and items from Webflow
- **helpers/algolia.js** - Functions to transform and sync data to Algolia
- **helpers/sync.js** - Orchestrates the complete sync process

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and add your credentials:

- `WEBFLOW_API_TOKEN`: Your Webflow API token
- `WEBFLOW_SITE_ID`: The ID of your Webflow site
- `ALGOLIA_APP_ID`: Your Algolia application ID
- `ALGOLIA_ADMIN_KEY`: Your Algolia admin API key
- `COLLECTIONS_TO_SYNC`: Comma-separated list of collection slugs to sync (e.g., `blog-posts,products`). Leave empty to sync all collections.
- `STATUS_FIELD`: (Optional) Name of a switch field in Webflow to control which items are synced. See "Status Field Filtering" section below.

### 3. Get Your Credentials

**Webflow:**

- API Token: https://developers.webflow.com/docs/getting-started#generate-an-api-token
- Site ID: Available in your Webflow site settings or via the API

**Algolia:**

- App ID and Admin Key: https://www.algolia.com/account/api-keys/

### 4. Development

Test locally:

```bash
bunx wrangler dev
```

Trigger the cron manually for testing:

```bash
bunx wrangler dev --test-scheduled
```

### 5. Deploy to Cloudflare

First, set your production secrets:

```bash
bunx wrangler secret put WEBFLOW_API_TOKEN
bunx wrangler secret put WEBFLOW_SITE_ID
bunx wrangler secret put ALGOLIA_APP_ID
bunx wrangler secret put ALGOLIA_ADMIN_KEY
```

Then deploy:

```bash
bunx wrangler deploy
```

### 6. Set Up Webflow Webhook (Optional)

To trigger sync automatically when you publish in Webflow:

1. Go to your Webflow site settings → Integrations → Webhooks
2. Add a new webhook with:
   - **Trigger**: Site Publish
   - **URL**: `https://your-worker.workers.dev/webhook`
   - **Method**: POST

Now syncing happens automatically when you publish your Webflow site!

## How It Works

The worker syncs your Webflow CMS to Algolia in two ways:

### 1. Automatic Cron (Daily)

Runs every 24 hours (configurable in `wrangler.toml`) automatically.

### 2. Webhook Trigger (On-Demand)

POST to `/webhook` endpoint to trigger sync immediately (perfect for Webflow's site publish webhook).

**Sync Process:**

1. Fetches all collections from your Webflow site
2. Filters collections based on `COLLECTIONS_TO_SYNC` environment variable (if specified)
3. For each collection, fetches all items using Webflow's `listItemsLive` endpoint
4. Filters to only "Published" items (where `lastPublished` exists, `isDraft` is false, and `isArchived` is false)
5. Applies status field filtering (if `STATUS_FIELD` is configured) to include/exclude items based on switch field value
6. Transforms items into Algolia-compatible records
   - **Strips all HTML tags, scripts, and styling** to extract plain text for search
7. Atomically replaces all records in each Algolia index

Each Webflow collection maps to its own Algolia index. For example:

- Webflow collection "Blog Posts" → Algolia index "blog-posts"
- Webflow collection "Products" → Algolia index "products"

## Selective Collection Syncing

By default, the worker syncs all collections from your Webflow site. To sync only specific collections, set the `COLLECTIONS_TO_SYNC` environment variable:

```
COLLECTIONS_TO_SYNC=blog-posts,products,team-members
```

The worker will match collection slugs against this list. If a collection isn't in the list, it won't be synced.

## Status Field Filtering

You can control which individual items are synced to Algolia using a switch field in your Webflow CMS. This is useful for:

- Publishing drafts to Webflow without syncing to search
- Hiding specific items from search results
- A/B testing content visibility

**How it works:**

1. **Create a switch field** in your Webflow collection (e.g., "Publish to Search")
2. **Set the STATUS_FIELD environment variable** to match the field name (e.g., `STATUS_FIELD=publish-to-search`)
3. **Control sync behavior per item:**
   - **Switch ON (true)**: Item is synced to Algolia
   - **Switch OFF (false)**: Item is excluded from Algolia (removed if previously synced)
   - **Field blank/not set**: Item is synced to Algolia (default behavior)

**Example:**

```env
STATUS_FIELD=publish-to-search
```

With this configuration:

- Items with "Publish to Search" = ON → Synced to Algolia
- Items with "Publish to Search" = OFF → Excluded from Algolia
- Items without the field set → Synced to Algolia (backwards compatible)

If you don't set `STATUS_FIELD` or leave it empty, all published items will be synced (existing behavior).

## Cron Schedule

The cron is configured in `wrangler.toml` as `0 0 * * *` (runs every 24 hours). You can modify this to run at different times if needed. Common patterns:

- `0 0 * * *` - Daily at midnight UTC
- `0 */6 * * *` - Every 6 hours
- `*/30 * * * *` - Every 30 minutes

## Development

### Adding New Features

The modular structure makes it easy to extend:

**Add new Webflow functions:**
Edit `src/helpers/webflow.js` to add new API calls or data processing.

**Modify Algolia sync behavior:**
Edit `src/helpers/algolia.js` to change how data is transformed or synced.

**Change sync logic:**
Edit `src/helpers/sync.js` to modify the orchestration flow.

### Local Testing

```bash
# Test the cron trigger
bun run test

# Start local dev server
bun run dev

# Trigger webhook manually
curl -X POST http://localhost:8787/webhook
```
