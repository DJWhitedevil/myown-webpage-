// Supabase project URL and browser-safe publishable key.
// Find these in Supabase Dashboard -> Project Settings -> API.
// Never put an `sb_secret_...`, `service_role`, or other secret key in this file.
window.CodeMintSupabase = {
    url: 'https://rpejrfnjhnayidzcvdcr.supabase.co',
    publishableKey: 'sb_publishable_nimgpRBlUB3nwacQtaADww_sGzNsNfc'
};

if (window.supabase &&
    !window.CodeMintSupabase.url.includes('YOUR_PROJECT_REF') &&
    !window.CodeMintSupabase.publishableKey.includes('YOUR_PUBLISHABLE_KEY')) {
    window.CodeMintAuth = window.supabase.createClient(
        window.CodeMintSupabase.url,
        window.CodeMintSupabase.publishableKey,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
}
