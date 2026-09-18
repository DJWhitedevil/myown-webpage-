// Supabase project URL and publishable anon key.
// Never put the Supabase service-role key in this file or in frontend code.
window.CodeMintSupabase = {
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: 'YOUR_SUPABASE_PUBLISHABLE_ANON_KEY'
};

if (window.supabase && !window.CodeMintSupabase.url.includes('YOUR_PROJECT_REF')) {
    window.CodeMintAuth = window.supabase.createClient(
        window.CodeMintSupabase.url,
        window.CodeMintSupabase.anonKey,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
}
