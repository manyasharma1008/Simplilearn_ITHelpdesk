# HelpDesk AI

React + Vite + Supabase, with Gemini running inside a Supabase Edge Function (the Gemini key never touches the browser).

## One-time setup

1. **Database**: in the Supabase SQL editor run `db/ps4_it_helpdesk.sql` (schema, seed data, demo RLS).
   Then run `db/patch_attachments.sql` (screenshot uploads).
2. **Frontend env**: `.env` is already filled with your Supabase URL and publishable key. (`.env.example` shows the format.)
3. **Gemini (server side)**, from this folder:
   ```bash
   npx supabase login
   npx supabase link --project-ref shfrnxdkcrnfjeigadzw
   npx supabase secrets set GEMINI_API_KEY=PASTE_YOUR_KEY_HERE
   npx supabase functions deploy ai --no-verify-jwt
   ```
   `--no-verify-jwt` is required: the publishable key is not a JWT, so JWT checking would reject every call.
   No CLI? Supabase dashboard → Edge Functions → Deploy new function → name `ai` → paste `supabase/functions/ai/index.ts`,
   turn **Verify JWT off**, then Edge Functions → Secrets → add `GEMINI_API_KEY`.
4. **Run**: `npm install && npm run dev` → http://localhost:5173
5. Open **Admin → Settings → Test AI connection**. It should say “Working. Gemini replied …”.

## What uses Gemini
Employee chat assistant, ticket scoring (category, priority, 0-100 score, sentiment), ticket summaries, chat transcript analysis
(saved to Conversations), and “Ask your IT data” on the AI Intelligence page.
If the function is not deployed or Gemini is unreachable, the app falls back to the built-in rules in `src/services/mockAIService.js`
and says so on screen (“Offline mode”), so nothing breaks.

## Notes
- Default model is `gemini-3.5-flash` (then `gemini-3.1-flash-lite`, then `gemini-2.5-flash`). `gemini-2.5-flash` was scheduled to shut down on 16 Oct 2026.
  Force one with `npx supabase secrets set GEMINI_MODEL=model-name`.
- The RLS policies are demo-grade (anon can read/write everything) and the `ai` function is public. Add Supabase Auth and
  per-user policies before real use, otherwise anyone who finds the function URL can spend your Gemini quota.
