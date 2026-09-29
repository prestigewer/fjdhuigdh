# Prestige Wear (Vite + Supabase)

## Local par chalana
```
npm install
npm run dev
```
Browser mein http://localhost:5173 khulega.

## GitHub par upload
Zip extract karo. Folder ke ANDAR ki files (package.json, index.html, src, public ...) repo ke
root mein upload karo. Folder ko as-it-is upload mat karo, warna Vercel ko package.json nahi milegi.

## Vercel par live karna
1. vercel.com par GitHub se login, Add New > Project, apna repo import karo.
2. Framework: Vite, Build Command: `npm run build`, Output Directory: `dist`.
3. Deploy dabao. Environment variables ki zaroorat nahi hai (Supabase values code mein default hain).
Repo mein kuch badlo to Vercel apne aap naya deploy kar deta hai.

## Note
- Admin panel par abhi koi password nahi hai.
- Supabase URL/key badalni ho to `src/main.js` ke shuru mein badlo, ya Vercel mein
  `VITE_SUPABASE_URL` aur `VITE_SUPABASE_ANON_KEY` set karo.
