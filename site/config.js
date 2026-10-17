/* =========================================================
   🔑  CONFIG.JS — les clés de ton service en ligne (Supabase)
   ---------------------------------------------------------
   Tant que ces deux lignes sont vides, le site marche en
   "mode démo" : le devis part par ta messagerie, les comptes
   sont désactivés et le tableau de bord montre des exemples.

   Où trouver ces valeurs : Supabase > ton projet >
   Project Settings > API  (voir GUIDE.md, partie 6).

   ⚠️ Ne mets JAMAIS ici la clé "service_role" (secrète) :
   seulement l'URL et la clé "anon public", faites pour
   être visibles dans un site web.
   ========================================================= */

const CONFIG_NOVIMO = {
  supabaseUrl: 'https://aplsqmpkxbbjmtcdikqs.supabase.co',        // ex. 'https://abcdefgh.supabase.co'
  supabaseCleAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbHNxbXBreGJiam10Y2Rpa3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODM0MDgsImV4cCI6MjEwNzc1OTQwOH0.4JrqgvifG82GszMsrbJpoL6yk8ZWgmC9qSPBMtJjwkA',    // ex. 'eyJhbGciOi...' (clé "anon public")

  // Le seul compte qui peut ouvrir le tableau de bord
  // (la vraie protection est aussi dans la base, voir supabase/schema.sql)
  emailAdmin: 'bouletpro45@gmail.com'
};
