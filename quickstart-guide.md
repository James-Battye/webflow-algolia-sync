# Webflow → Algolia Sync

### Simple Setup Guide (No Code Knowledge Required)

This repository lets you sync Webflow CMS content into Algolia using
Cloudflare Workers.

The goal of this guide is to walk you through setup **without needing to
understand the internals of the code**.

## 1. Required Accounts

You need four accounts:

- **Cloudflare**
- **GitHub**
- **Algolia**
- **Webflow**

## 2. Required Tools on Your Computer

Install:

- **Node.js** (required)
- **Bun** (optional but recommended)

Check installation:

    node -v
    bun -v

## 3. Clone This Repository

    git clone https://github.com/James-Battye/webflow-algolia-sync.git
    cd webflow-algolia-sync

## 4. Configure Your Environment File

Rename:

    .dev.vars.example → .dev.vars

## 5. Fill in Your Settings

    WEBFLOW_API_TOKEN=
    WEBFLOW_SITE_ID=
    ALGOLIA_APP_ID=
    ALGOLIA_ADMIN_KEY=
    COLLECTIONS_TO_SYNC=blog,articles,products
    STATUS_FIELD=include-in-search

## 6. Test Locally

    npm run test

or

    bun run test

and visit http://localhost:8787/cdn-cgi/handler/scheduled to fire the workflow

Confirm the data is in Algolia

## 7. Deploy to Cloudflare

    bun run deploy

Wrangler will guide you through the authorisation process

## 8. Verify Deployment

Check Cloudflare → Workers & Pages → Your Worker.

## 9. Add Webflow Webhook

Add webhook in Site Settings > Apps & Integrations > Webhooks:

    https://your-worker.cloudflareworkers.net/webhook

Trigger: **Site Publish**

## 10. Upgrade Cloudflare Worker

Upgrade to the **\$5/mo Workers plan** for 30s CPU time.
