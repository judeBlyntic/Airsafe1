/* AirSafe — shared Client directory backed by Supabase.
   ONLY client contact details (name, address, contact, phone, email) are
   stored here so they can be reused across reports and devices.
   Report content and ALL photos stay local in IndexedDB and are never
   sent to Supabase. */

"use strict";

/* ---------------------------------------------------------------------------
   1) PASTE YOUR SUPABASE PROJECT DETAILS BELOW.
      - Project URL:  Supabase dashboard → Project Settings → Data API → Project URL
      - Anon key:     Supabase dashboard → Project Settings → API Keys → "anon" / "public"
      Use the ANON / PUBLIC key. NEVER paste the "service_role" secret key here —
      this file ships to the browser and anyone could read it.
   --------------------------------------------------------------------------- */
const SUPABASE_URL = "https://rtafyqieoytglupcrfnc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mbjiowqEKMYXBoJTRkgcrA_R-WgIxZ1";

/* report.fields key  ->  clients table column */
const CLIENT_FIELD_MAP = {
  companyName:    "company_name",
  companyAddress: "company_address",
  contactPerson:  "contact_person",
  clientPhone:    "client_phone",
  clientEmail:    "client_email"
};
const CLIENT_KEYS = Object.keys(CLIENT_FIELD_MAP);

let _sb = null;
function clientsEnabled() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
}
function sb() {
  if (!clientsEnabled()) return null;
  if (!_sb) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _sb;
}

/* Search one column by substring; returns up to 8 matching client rows. */
async function clientSearch(fieldKey, query) {
  const client = sb();
  if (!client) return [];
  const col = CLIENT_FIELD_MAP[fieldKey];
  if (!col) return [];
  const q = (query || "").trim();
  if (q.length < 2) return [];
  const { data, error } = await client
    .from("clients")
    .select("*")
    .ilike(col, `%${q}%`)
    .order("company_name", { ascending: true })
    .limit(8);
  if (error) { console.warn("Client search failed:", error.message); return []; }
  return data || [];
}

/* Upsert the current client. Dedupe by company_name (case-insensitive):
   updates the existing row if the name already exists, otherwise inserts.
   Returns "added" or "updated". */
async function clientSave(fields) {
  const client = sb();
  if (!client) throw new Error("Client directory is not configured.");

  const row = {};
  CLIENT_KEYS.forEach(k => { row[CLIENT_FIELD_MAP[k]] = (fields[k] || "").trim(); });
  if (!row.company_name) throw new Error("Enter a Company Name before saving.");

  const { data: existing, error: selErr } = await client
    .from("clients").select("id").ilike("company_name", row.company_name).limit(1);
  if (selErr) throw selErr;

  if (existing && existing.length) {
    const { error } = await client.from("clients")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", existing[0].id);
    if (error) throw error;
    return "updated";
  }
  const { error } = await client.from("clients").insert(row);
  if (error) throw error;
  return "added";
}
