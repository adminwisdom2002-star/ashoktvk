<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6819a122-a4f7-4765-8081-22378e3a1209

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Admin Dashboard

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a long random `ADMIN_SESSION_SECRET` in `.env.local` (see [.env.example](.env.example)). Keep `.env.local` private and use a strong, unique password before deploying publicly. Admin sessions expire after eight hours.

The admin dashboard is available from the **நிர்வாகம்** navigation tab. Ward/street edits and complaint changes are saved in the ignored `data/app-state.json` file so they persist across server restarts.

## GitHub Pages Preview

The GitHub Pages workflow publishes a read-only frontend preview at `https://adminwisdom2002-star.github.io/ashoktvk/`. It uses sample data from the app; petition submissions, AI generation, admin tools, and live server updates require the Express backend and are not available in this preview. Pushes to `main` trigger a new deployment.
