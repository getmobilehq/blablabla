# Blablabla 2.0 - Deployment Guide

## Prerequisites

- Supabase account and project
- OpenAI API key
- Supabase CLI installed: `npm install -g supabase`

---

## 1. Database Setup

Run the migration in your Supabase SQL Editor:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy contents of `supabase/migrations/001_initial_schema.sql`
5. Run the migration

This creates:
- `recordings`, `collections`, `feedback` tables
- Row Level Security policies
- Storage bucket (private)
- Indexes and triggers

---

## 2. Deploy Edge Function

### Link your Supabase project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref is in your Supabase URL: `https://YOUR_PROJECT_REF.supabase.co`

### Deploy the function

```bash
supabase functions deploy analyze-audio
```

### Set Edge Function secrets

The Edge Function needs your OpenAI API key (kept secure server-side):

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here
```

**IMPORTANT**: Never commit your OpenAI API key to the client code. It's now securely stored in Supabase.

---

## 3. Update Storage Bucket (If Already Created)

If you already created the `recordings` bucket as public, update it to private:

1. Go to **Storage** in Supabase dashboard
2. Click on `recordings` bucket
3. Click **Settings**
4. Set **Public** to `false`
5. Save

---

## 4. Environment Variables

### Client (.env)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: **Settings → API**

### Deployment Platform (Netlify/Vercel)

Add the same environment variables to your deployment platform's dashboard.

---

## 5. Deploy Frontend

### Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### Vercel

```bash
npm install -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard.

---

## Security Features ✅

Your deployment now includes:

1. **✅ Secure API Key Storage** - OpenAI key is server-side only in Edge Function
2. **✅ File Size Limits** - 25MB max upload size
3. **✅ Rate Limiting** - 10 recordings per hour per user
4. **✅ Private Storage** - Audio files require authentication
5. **✅ File Type Validation** - Only valid audio formats accepted
6. **✅ User Authentication** - All API calls require valid session

---

## Testing the Deployment

1. Register a new account
2. Record audio
3. Verify transcription works
4. Check History page
5. Monitor Supabase logs for any errors

---

## Monitoring Costs

Monitor your OpenAI usage at: https://platform.openai.com/usage

Expected costs at 1000 recordings/day:
- Whisper: ~$6/day
- GPT-4o-mini: ~$5/day
- **Total: ~$330/month**

Rate limiting (10/hour/user) helps control costs.

---

## Troubleshooting

### Edge Function not working

Check logs:
```bash
supabase functions logs analyze-audio
```

### CORS errors

Edge Function includes CORS headers. If issues persist, check Supabase dashboard settings.

### Rate limit errors

Users see: "Rate limit exceeded. Please try again later."
Adjust `RATE_LIMIT_PER_HOUR` in Edge Function if needed.

---

## Next Steps

- Set up error monitoring (Sentry)
- Add analytics
- Monitor API costs
- Build admin dashboard
- Add user usage quotas

---

## Support

Report issues: https://github.com/getmobilehq/blablabla/issues
