import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const BUNQ_API = "https://api.bunq.com/v1";

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isoDateOnly(input?: string): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function parseBunqDate(dateTime?: string): string {
  if (!dateTime) return new Date().toISOString().slice(0, 10);
  const m = dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : new Date().toISOString().slice(0, 10);
}

// ── Crypto helpers ──────────────────────────────────────────

async function generateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyPem: string;
  privateKeyPem: string;
}> {
  const kp = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const pubBuf = await crypto.subtle.exportKey("spki", kp.publicKey);
  const prvBuf = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return {
    privateKey: kp.privateKey,
    publicKeyPem: toPem(pubBuf, "PUBLIC KEY"),
    privateKeyPem: toPem(prvBuf, "PRIVATE KEY"),
  };
}

function toPem(buf: ArrayBuffer, label: string): string {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const lines = b64.match(/.{1,64}/g)!.join("\n");
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    bytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(privateKey: CryptoKey, body: string): Promise<string> {
  const enc = new TextEncoder().encode(body);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, enc);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// ── bunq API helpers ────────────────────────────────────────

async function bunqFetch(
  method: string,
  path: string,
  body: unknown | null,
  token: string | null,
  privateKey: CryptoKey,
) {
  const bodyStr = body ? JSON.stringify(body) : "";
  const signature = await sign(privateKey, bodyStr);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "BudgetFlow Supabase Edge/1.0",
    "X-Bunq-Client-Signature": signature,
    "X-Bunq-Client-Request-Id": crypto.randomUUID(),
    "Cache-Control": "no-cache",
    "X-Bunq-Language": "nl_NL",
    "X-Bunq-Region": "nl_NL",
    "X-Bunq-Geolocation": "0 0 0 0 000",
  };
  if (token) headers["X-Bunq-Client-Authentication"] = token;

  const res = await fetch(`${BUNQ_API}${path}`, {
    method,
    headers,
    body: body ? bodyStr : undefined,
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    console.error("bunq error:", path, JSON.stringify(json));
    throw new Error(`bunq ${path} failed: ${res.status} ${res.statusText}`);
  }

  return json.Response ?? json;
}

async function createInstallation(publicKeyPem: string, privateKey: CryptoKey) {
  const resp = await bunqFetch("POST", "/installation", { client_public_key: publicKeyPem }, null, privateKey);
  const tokenObj = resp.find((r: any) => r.Token);
  const serverKeyObj = resp.find((r: any) => r.ServerPublicKey);
  return {
    installationToken: tokenObj?.Token?.token as string,
    serverPublicKey: serverKeyObj?.ServerPublicKey?.server_public_key as string,
  };
}

async function createDeviceServer(installationToken: string, apiKey: string, privateKey: CryptoKey) {
  const resp = await bunqFetch(
    "POST",
    "/device-server",
    { description: "BudgetFlow", secret: apiKey, permitted_ips: ["*"] },
    installationToken,
    privateKey,
  );
  return resp?.[0]?.Id?.id as number;
}

async function createSession(installationToken: string, apiKey: string, privateKey: CryptoKey) {
  const resp = await bunqFetch("POST", "/session-server", { secret: apiKey }, installationToken, privateKey);
  const tokenObj = resp.find((r: any) => r.Token);
  const userObj = resp.find((r: any) => r.UserPerson || r.UserCompany || r.UserLight);
  const user = userObj?.UserPerson ?? userObj?.UserCompany ?? userObj?.UserLight;
  return {
    sessionToken: tokenObj?.Token?.token as string,
    userId: user?.id as number,
  };
}

async function fetchMonetaryAccountsRaw(sessionToken: string, userId: number, privateKey: CryptoKey) {
  return await bunqFetch("GET", `/user/${userId}/monetary-account`, null, sessionToken, privateKey);
}

function parseMonetaryAccounts(raw: any[]) {
  return raw.map((r: any) => {
    const acc =
      r.MonetaryAccountBank ??
      r.MonetaryAccountSavings ??
      r.MonetaryAccountJoint ??
      r.MonetaryAccountCard ??
      r.MonetaryAccountSavingsExternal ??
      r.MonetaryAccountInvestment ??
      r.MonetaryAccountExternal ??
      null;

    const type = r.MonetaryAccountBank
      ? "MonetaryAccountBank"
      : r.MonetaryAccountSavings
      ? "MonetaryAccountSavings"
      : r.MonetaryAccountJoint
      ? "MonetaryAccountJoint"
      : r.MonetaryAccountCard
      ? "MonetaryAccountCard"
      : r.MonetaryAccountSavingsExternal
      ? "MonetaryAccountSavingsExternal"
      : r.MonetaryAccountInvestment
      ? "MonetaryAccountInvestment"
      : r.MonetaryAccountExternal
      ? "MonetaryAccountExternal"
      : "Unknown";

    if (!acc) {
      return {
        type: "Unknown",
        id: null,
        status: null,
        description: null,
        iban: null,
        balance: null,
        currency: null,
      };
    }

    const iban = acc.alias?.find((a: any) => a.type === "IBAN")?.value ?? null;

    return {
      type,
      id: acc.id ?? null,
      status: acc.status ?? null,
      description: acc.description ?? null,
      iban,
      balance: acc.balance?.value ?? null,
      currency: acc.balance?.currency ?? null,
    };
  });
}

async function listPaymentsPage(
  sessionToken: string,
  userId: number,
  accountId: number,
  privateKey: CryptoKey,
  count = 200,
  olderThanId?: number,
) {
  let path = `/user/${userId}/monetary-account/${accountId}/payment?count=${count}`;
  if (olderThanId) path += `&older_id=${olderThanId}`;
  const resp = await bunqFetch("GET", path, null, sessionToken, privateKey);
  return (resp ?? []).filter((r: any) => r.Payment).map((r: any) => r.Payment);
}

// ── Supabase helpers ─────────────────────────────────────────

async function getConnection(supabase: any, householdId: string) {
  const { data, error } = await supabase
    .from("bunq_connections")
    .select("*")
    .eq("household_id", householdId)
    .single();
  if (error || !data) throw new Error("No bunq connection found for this household. Run setup first.");
  return data;
}

async function ensureValidSession(supabase: any, conn: any, apiKey: string, privateKey: CryptoKey) {
  let sessionToken = conn.session_token as string;
  let userId = conn.session_user_id as number;

  try {
    await fetchMonetaryAccountsRaw(sessionToken, userId, privateKey);
  } catch {
    const session = await createSession(conn.installation_token, apiKey, privateKey);
    sessionToken = session.sessionToken;
    userId = session.userId;

    await supabase
      .from("bunq_connections")
      .update({
        session_token: sessionToken,
        session_user_id: userId,
      })
      .eq("id", conn.id);
  }

  return { sessionToken, userId };
}

async function resolveDefaultSubcategories(supabase: any, householdId: string) {
  const tryGet = async (catName: string, subName: string) => {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("household_id", householdId)
      .eq("naam", catName)
      .maybeSingle();

    if (!cat?.id) return null;

    const { data: sub } = await supabase
      .from("subcategories")
      .select("id")
      .eq("category_id", cat.id)
      .eq("naam", subName)
      .maybeSingle();

    return sub?.id ?? null;
  };

  const preferredExpense = await tryGet("Boodschappen", "Supermarkt");
  const preferredIncome = await tryGet("Salaris", "Salaris");

  const pickAny = async (kind: "expense" | "income") => {
    const { data: rows } = await supabase
      .from("subcategories")
      .select("id, categories!inner(type, household_id)")
      .eq("categories.household_id", householdId)
      .limit(500);

    const list = (rows ?? []).map((r: any) => ({
      id: r.id,
      type: String(r.categories?.type ?? "").toLowerCase(),
    }));

    const isIncome = (t: string) => t.includes("inko") || t.includes("inc") || t.includes("income");
    const isExpense = (t: string) => t.includes("uitg") || t.includes("exp") || t.includes("expense");

    const filtered = list.filter((x) => (kind === "income" ? isIncome(x.type) : isExpense(x.type)));
    if (filtered.length) return filtered[0].id;
    if (list.length) return list[0].id;
    return null;
  };

  const expense = preferredExpense ?? (await pickAny("expense"));
  const income = preferredIncome ?? (await pickAny("income"));

  if (!expense || !income) {
    throw new Error(
      "Cannot import transactions: no subcategories found. Create at least one category+subcategory for income and expense.",
    );
  }

  return { expense_subcategory_id: expense, income_subcategory_id: income };
}

async function insertTransactionsDedupe(supabase: any, rows: any[]) {
  if (!rows.length) return { inserted: 0, skipped: 0 };

  const dates = rows.map((r) => r.datum).sort();
  const dateMin = dates[0];
  const dateMax = dates[dates.length - 1];

  const { data: existing, error: exErr } = await supabase
    .from("transactions")
    .select("account_id, datum, bedrag, omschrijving, alias_tegenrekening")
    .gte("datum", dateMin)
    .lte("datum", dateMax);

  if (exErr) throw exErr;

  const set = new Set(
    (existing ?? []).map((t: any) =>
      [t.account_id, t.datum, String(t.bedrag), t.omschrijving, t.alias_tegenrekening ?? ""].join("|"),
    ),
  );

  const toInsert = rows.filter((r) => {
    const k = [r.account_id, r.datum, String(r.bedrag), r.omschrijving, r.alias_tegenrekening ?? ""].join("|");
    return !set.has(k);
  });

  if (!toInsert.length) return { inserted: 0, skipped: rows.length };

  const { error: insErr } = await supabase.from("transactions").insert(toInsert);
  if (insErr) throw insErr;

  return { inserted: toInsert.length, skipped: rows.length - toInsert.length };
}

// ─────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BUNQ_API_KEY = Deno.env.get("BUNQ_API_KEY");
    if (!BUNQ_API_KEY) throw new Error("BUNQ_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL/SERVICE_ROLE_KEY missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);

    let body: any = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const householdId = body.household_id ?? url.searchParams.get("household_id") ?? null;
    const mode = body.mode ?? url.searchParams.get("mode") ?? "auto"; // <— default auto

    if (!householdId) return jsonResponse({ ok: false, error: "household_id required" }, 400);

    // setup (optioneel)
    if (mode === "setup") {
      const { privateKey, publicKeyPem, privateKeyPem } = await generateKeyPair();
      const { installationToken, serverPublicKey } = await createInstallation(publicKeyPem, privateKey);
      const deviceId = await createDeviceServer(installationToken, BUNQ_API_KEY, privateKey);
      const { sessionToken, userId } = await createSession(installationToken, BUNQ_API_KEY, privateKey);

      const { error } = await supabase.from("bunq_connections").upsert(
        {
          household_id: householdId,
          private_key_pem: privateKeyPem,
          public_key_pem: publicKeyPem,
          installation_token: installationToken,
          server_public_key: serverPublicKey,
          device_server_id: deviceId,
          session_token: sessionToken,
          session_user_id: userId,
        },
        { onConflict: "household_id" },
      );

      if (error) throw error;
      return jsonResponse({ ok: true, message: "setup complete", bunq_user_id: userId });
    }

    // connection + session
    const conn = await getConnection(supabase, householdId);
    const privateKey = await importPrivateKey(conn.private_key_pem);
    const { sessionToken, userId } = await ensureValidSession(supabase, conn, BUNQ_API_KEY, privateKey);

    // ── AUTO MODE ──
    // Als er nog geen mappings zijn: geef accounts terug (zodat jij het bunq id kunt pakken)
    if (mode === "auto") {
      const { data: mappings } = await supabase
        .from("bunq_account_mappings")
        .select("id")
        .eq("bunq_connection_id", conn.id)
        .limit(1);

      if (!mappings || mappings.length === 0) {
        const raw = await fetchMonetaryAccountsRaw(sessionToken, userId, privateKey);
        const accounts = parseMonetaryAccounts(raw);
        return jsonResponse({
          ok: true,
          message: "No mappings found yet. Here are your bunq accounts so you can map by id/iban.",
          household_id: householdId,
          bunq_connection_id: conn.id,
          bunq_user_id: userId,
          accounts,
        });
      }

      // als mappings wél bestaan: doe sync-since standaard
      const dateFrom = isoDateOnly(body.date_from ?? url.searchParams.get("date_from") ?? "2026-01-01");
      const defaults = await resolveDefaultSubcategories(supabase, householdId);

      const { data: allMappings, error: mapErr } = await supabase
        .from("bunq_account_mappings")
        .select("id, account_id, bunq_monetary_account_id")
        .eq("bunq_connection_id", conn.id);

      if (mapErr) throw mapErr;

      const mapped = (allMappings ?? []).filter((m: any) => m.account_id && m.bunq_monetary_account_id);
      if (!mapped.length) {
        return jsonResponse({ ok: true, imported: 0, message: "No usable mappings found." });
      }

      let imported = 0;
      for (const m of mapped) {
        const bunqAccId = Number(m.bunq_monetary_account_id);
        const internalAccountId = m.account_id as string;

        let all: any[] = [];
        let olderId: number | undefined = undefined;

        while (true) {
          const page = await listPaymentsPage(sessionToken, userId, bunqAccId, privateKey, 200, olderId);
          if (!page.length) break;

          all.push(...page);
          const last = page[page.length - 1];
          olderId = last?.id;

          const oldestDate = parseBunqDate(last?.created);
          if (oldestDate < dateFrom) break;
          if (all.length >= 1_000_000) break;
        }

        const filtered = all.filter((p: any) => parseBunqDate(p.created) >= dateFrom);

        const txRows = filtered.map((p: any) => {
          const amount = parseFloat(p.amount?.value ?? "0");
          const isIncome = amount >= 0;
          const cp = p.counterparty_alias ?? p.alias ?? null;

          return {
            household_id: householdId,
            account_id: internalAccountId,
            datum: parseBunqDate(p.created),
            omschrijving: p.description ?? "bunq payment",
            bedrag: amount,
            iban_tegenrekening: cp?.iban ?? null,
            alias_tegenrekening: cp?.display_name ?? cp?.name ?? null,
            notitie: null,
            category_id: null,
            subcategory_id: isIncome ? defaults.income_subcategory_id : defaults.expense_subcategory_id,
          };
        });

        const result = await insertTransactionsDedupe(supabase, txRows);
        imported += result.inserted;
      }

      return jsonResponse({ ok: true, imported, date_from: dateFrom });
    }

    // expliciet accounts mode (als je dat tóch wil)
    if (mode === "accounts") {
      const raw = await fetchMonetaryAccountsRaw(sessionToken, userId, privateKey);
      const accounts = parseMonetaryAccounts(raw);
      return jsonResponse({
        ok: true,
        household_id: householdId,
        bunq_connection_id: conn.id,
        bunq_user_id: userId,
        accounts,
      });
    }

    return jsonResponse({ ok: false, error: `Unknown mode ${mode}` }, 400);
  } catch (err) {
    console.error("poll-bunq error:", err);
    return jsonResponse({ ok: false, error: (err as Error).message }, 500);
  }
});
