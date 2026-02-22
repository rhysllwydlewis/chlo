# Chlo

A Next.js 15 (App Router) marketing / landing site for [chlo.co.uk](https://chlo.co.uk).

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Create a `.env.local` file (never committed) with the following keys:

### Required for contact form email delivery (Postmark)

| Variable | Description |
|---|---|
| `POSTMARK_SERVER_TOKEN` | Postmark Server API token |
| `CONTACT_TO_EMAIL` | Email address that receives enquiries |
| `CONTACT_FROM_EMAIL` | Verified sender address in your Postmark account |

When Postmark variables are not set the form still accepts submissions but only logs them server-side.

### Optional

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (used for OG tags, sitemap, robots.txt) | `https://chlo.co.uk` |

---

## Railway Deployment

The site is deployed on [Railway](https://railway.app).

1. Connect the GitHub repository to a Railway project.
2. Railway auto-detects Next.js and sets the build command to `npm run build` and start command to `npm run start`.
3. Add the environment variables above via the Railway **Variables** tab.
4. The site will be live on a temporary `*.railway.app` domain until a custom domain is configured.

### Custom domain

Set `NEXT_PUBLIC_SITE_URL` to your final domain (e.g. `https://chlo.co.uk`) in Railway variables once DNS is pointed.

---

## CI

GitHub Actions runs on every push and pull request:

- Installs dependencies (`npm ci`)
- Lints (`npm run lint`)
- Builds (`npm run build`)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## SEO

- Open Graph image is generated at `/opengraph-image` via `app/opengraph-image.tsx`.
- `robots.txt` is served at `/robots.txt` via `app/robots.ts`.
- `sitemap.xml` is served at `/sitemap.xml` via `app/sitemap.ts`.
