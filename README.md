# My Own Webpage

This repository contains a static personal website with Vercel serverless lead handling.

## Overview

- Static HTML, CSS, JavaScript, images, and videos.
- Supabase Auth for login, signup, and password reset.
- Vercel API function for lead email notifications and MongoDB Atlas persistence.

## Project Structure

- `my own webpage/` - main website sources
  - `index.html` - main page
  - `style.css`, `style-neobrutalism.css` - styles
  - `script.js` - client scripts
  - `privacy-policy.html`, `terms-of-service.html` - legal pages
- `images/` - image assets used by the site

## Preview locally

Use VS Code Live Server with `my own webpage` as the workspace root, or run:

```bash
cd "my own webpage"
python -m http.server 8000
```

## Vercel deployment

Set the Vercel Root Directory to `my own webpage`. Vercel will serve the static pages and the `api/lead.js` serverless function.

Configure these Vercel environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_TO`
- `EMAIL_FROM`
- `MONGODB_URI`
- `MONGODB_DB` (for example, `codemint`)

Never commit database or SMTP credentials. If SMTP credentials were ever shared, rotate them immediately and store only the replacement values in Vercel Environment Variables.

Test the deployed lead endpoint with:

```bash
curl -X POST https://<your-vercel-domain>/api/lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"123","projectType":"Website","message":"Hello"}'
```

Lead submissions are stored in the `codemint.leads` MongoDB collection. Public forms should also use CAPTCHA protection such as Cloudflare Turnstile.

## Supabase Authentication

The login, signup, forgot-password, and reset-password pages use Supabase Auth.

1. Create a Supabase project.
2. In **Authentication > URL Configuration**, set the Site URL to your deployed HTTPS URL.
3. Add this redirect URL:
   `https://your-domain.vercel.app/reset-password.html`
4. Enable the Email provider in **Authentication > Providers > Email**.
5. Put the Supabase project URL and publishable anon key in `my own webpage/supabase-config.js`.
6. Never put the Supabase service-role key in frontend code.

The Supabase publishable anon key is safe for browser use; the service-role key is not.

## MongoDB Atlas

Create a MongoDB Atlas cluster and database user. Add the Atlas connection string to Vercel as `MONGODB_URI`; never put it in frontend code. Vercel serverless functions may require an Atlas network access rule of `0.0.0.0/0`, protected with a long random database password and a least-privilege database user.
