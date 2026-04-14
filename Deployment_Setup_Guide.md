<!-- Campus Pace - Ultimate Force Update - 2026-04-11 -->
<!-- Campus Pace - Global Synchronization & Stabilization Update - 2026-04-11 -->
# Deployment Setup Guide - Campus pace

To get your app working perfectly on the live Vercel link, you need to configure two things: **Vercel Settings** and **Supabase Authentication**.

## 1. Configure Vercel Environment Variables
You must add your project secrets to the Vercel Dashboard.

1.  Go to your project on [Vercel](https://vercel.com/dashboard).
2.  Navigate to **Settings** > **Environment Variables**.
3.  Add the following keys and their values from your local `.env` file:
    *   `VITE_SUPABASE_URL`: Your Supabase Project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.
    *   `MONGO_URI`: Your MongoDB Atlas connection string.
    *   `JWT_SECRET`: A long random string for session security.
    *   `GEMINI_API_KEY`: Your Google AI SDK key.
4.  **Redeploy**: Go to the **Deployments** tab and click "Redeploy" on your latest push to apply these variables.

## 2. Configure Supabase Redirects (CRITICAL)
If you are using Google or GitHub login, Supabase needs to know that your Vercel URL is safe.

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project and go to **Authentication** > **URL Configuration**.
3.  Add your Vercel URL (e.g., `https://campus-pace.vercel.app`) to the **Additional Redirect URIs** list.
4.  Ensure **Site URL** is also set to your Vercel URL.

## 3. Database Permissions
Ensure your MongoDB Atlas network whitelist allows "0.0.0.0/0" (all IPs) since Vercel's IP addresses change dynamically.

---

> [!TIP]
> Once you've added these, the **"Configuration Warning"** banner on your login page will automatically disappear!
