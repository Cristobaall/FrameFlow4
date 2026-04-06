# FrameFlow4

Plateforme de partage video avec commentaires lies au timecode.

## Stack
- Next.js 15 + TypeScript
- Supabase (Auth Google + PostgreSQL + Realtime)
- Cloudflare R2 (stockage videos)
- Vercel (hebergement)

## Setup
1. `npm install`
2. Remplis `.env.local` avec tes clés
3. Execute `supabase/schema.sql` dans Supabase SQL Editor
4. `npm run dev`