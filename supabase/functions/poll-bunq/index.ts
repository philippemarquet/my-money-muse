import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUNQ_API = "https://api.bunq.com/v1";

// ── Crypto helpers ──────────────────────────────────────────

async function generateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyPem: string;
  privateKeyPem: string;
}> {
  const kp = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
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
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", buf, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
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

  const json = await res.json();
  if (!res.ok) {
    console.error("bunq error:", JSON.stringify(json));
    throw new Error(`bunq ${path} failed: ${res.status}`);
  }
  return json.Response;
}

async function createInstallation(publicKeyPem: string, privateKey: CryptoKey) {
  const resp = await bunqFetch("POST", "/installation", { client_public_key: publicKeyPem }, null, privateKey);
  const tokenObj = resp.find((r: any) => r.Token);
  const serverKeyObj = resp.find((r: any) => r.ServerPublicKey);
  return {
    installationToken: tokenObj.Token.token as string,
    serverPublicKey: serverKeyObj.ServerPublicKey.server_public_key as string,
  };
}

async function createDeviceServer(installationToken: string, apiKey: string, privateKey: CryptoKey) {
  const resp = await bunqFetch(
    "POST",
    "/device-server",
    { description: "BudgetFlow Lovable", secret: apiKey, permitted_ips: ["*"] },
    installationToken,
    privateKey,
  );
  return resp[0].Id.id as number;
}

async function createSession(installationToken: string, apiKey: string, privateKey: CryptoKey) {
  const resp = await bunqFetch("POST", "/session-server", { secret: apiKey }, installationToken, privateKey);
  const tokenObj = resp.find((r: any) => r.Token);
  const userObj = resp.find((r: any) => r.UserPerson || r.UserCompany || r.UserLight);
  const user = userObj.UserPerson ?? userObj.UserCompany ?? userObj.UserLight;
  return {
    sessionToken: tokenObj.Token.token as string,
    userId: user.id as number,
  };
}

async function listMonetaryAccounts(sessionToken: string, userId: number, privateKey: CryptoKey) {
  const resp = await bunqFetch("GET", `/user/${userId}/monetary-account`, null, sessionToken, privateKey);
  return resp
    .filter((r: any) => r.MonetaryAccountBank || r.MonetaryAccountSavings || r.MonetaryAccountJoint)
    .map((r: any) => {
      const acc = r.MonetaryAccountBank ?? r.MonetaryAccountSavings ?? r.MonetaryAccountJoint;
      return {
        id: acc.id as number,
        description: acc.description as string,
        iban: acc.alias?.find((a: any) => a.type === "IBAN")?.value ?? null,
        balance: parseFloat(acc.balance?.value ?? "0"),
      };
    });
}

async function listPayments(
  sessionToken: string,
  userId: number,
  accountId: number,
  privateKey: CryptoKey,
  count = 50,
  olderThanId?: number,
) {
  let path = `/user/${userId}/monetary-account/${accountId}/payment?count=${count}`;
  if (olderThanId) path += `&older_id=${olderThanId}`;
  const resp = await bunqFetch("GET", path, null, sessionToken, privateKey);
  return resp.filter((r: any) => r.Payment).map((r: any) => r.Payment);
}

// ── Main handler ────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BUNQ_API_KEY = Deno.env.get("BUNQ_API_KEY");
    if (!BUNQ_API_KEY) throw new Error("BUNQ_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Parse optional body for setup mode
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      /* empty */
    }

    const mode = body.mode ?? "poll"; // "setup" | "list-accounts" | "poll"
    const householdId = body.household_id;

    // ── SETUP: create installation + device + session ──
    if (mode === "setup") {
      if (!householdId) throw new Error("household_id required for setup");

      const { privateKey, publicKeyPem, privateKeyPem } = await generateKeyPair();
      console.log("Creating bunq installation...");
      const { installationToken, serverPublicKey } = await createInstallation(publicKeyPem, privateKey);
      console.log("Creating device server...");
      const deviceId = await createDeviceServer(installationToken, BUNQ_API_KEY, privateKey);
      console.log("Creating session...");
      const { sessionToken, userId } = await createSession(installationToken, BUNQ_API_KEY, privateKey);

      // Upsert connection
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

      return new Response(JSON.stringify({ ok: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LIST-ACCOUNTS: show available bunq accounts ──
    if (mode === "list-accounts") {
      if (!householdId) throw new Error("household_id required");
      const conn = await getConnection(supabase, householdId);
      const privateKey = await importPrivateKey(conn.private_key_pem);

      // Try existing session, re-create if expired
      let accounts;
      try {
        accounts = await listMonetaryAccounts(conn.session_token!, conn.session_user_id!, privateKey);
      } catch {
        console.log("Session expired, creating new session...");
        const { sessionToken, userId } = await createSession(conn.installation_token!, BUNQ_API_KEY, privateKey);
        await supabase
          .from("bunq_connections")
          .update({
            session_token: sessionToken,
            session_user_id: userId,
          })
          .eq("id", conn.id);
        accounts = await listMonetaryAccounts(sessionToken, userId, privateKey);
      }

      return new Response(JSON.stringify({ ok: true, accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POLL: fetch new payments for all mapped accounts ──
    // Get all connections (when called by cron, poll all)
    const { data: connections, error: connErr } = await supabase
      .from("bunq_connections")
      .select("*, bunq_account_mappings(*, accounts(household_id, rekeningnummer))");

    if (connErr) throw connErr;
    if (!connections?.length) {
      return new Response(JSON.stringify({ ok: true, message: "No connections configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalImported = 0;

    for (const conn of connections) {
      const mappings = (conn as any).bunq_account_mappings ?? [];
      if (!mappings.length) continue;

      const privateKey = await importPrivateKey(conn.private_key_pem);
      let sessionToken = conn.session_token!;
      let userId = conn.session_user_id!;

      // Try a test call; if session expired, renew
      try {
        await listMonetaryAccounts(sessionToken, userId, privateKey);
      } catch {
        console.log(`Session expired for connection ${conn.id}, renewing...`);
        try {
          const session = await createSession(conn.installation_token!, BUNQ_API_KEY, privateKey);
          sessionToken = session.sessionToken;
          userId = session.userId;
          await supabase
            .from("bunq_connections")
            .update({
              session_token: sessionToken,
              session_user_id: userId,
            })
            .eq("id", conn.id);
        } catch (sessionErr) {
          console.error(`Failed to renew session for ${conn.id}:`, sessionErr);
          continue;
        }
      }

      for (const mapping of mappings) {
        try {
          const payments = await listPayments(sessionToken, userId, mapping.bunq_monetary_account_id, privateKey, 100);

          // Filter only new payments (id > last_payment_id)
          const lastId = mapping.last_payment_id ?? 0;
          const newPayments = payments.filter((p: any) => p.id > lastId);

          if (!newPayments.length) continue;

          // Map to transactions
          const txRows = newPayments.map((p: any) => ({
            household_id: conn.household_id,
            account_id: mapping.account_id,
            datum: p.created?.split(" ")[0] ?? new Date().toISOString().split("T")[0],
            omschrijving: p.description ?? "bunq betaling",
            bedrag: parseFloat(p.amount?.value ?? "0"),
            iban_tegenrekening: p.counterparty_alias?.iban ?? null,
            alias_tegenrekening: p.counterparty_alias?.display_name ?? null,
          }));

          const { error: insErr } = await supabase.from("transactions").insert(txRows);
          if (insErr) {
            console.error(`Insert error for mapping ${mapping.id}:`, insErr);
            continue;
          }

          // Update last_payment_id to highest imported
          const maxId = Math.max(...newPayments.map((p: any) => p.id));
          await supabase.from("bunq_account_mappings").update({ last_payment_id: maxId }).eq("id", mapping.id);

          totalImported += newPayments.length;
          console.log(`Imported ${newPayments.length} payments for account ${mapping.bunq_monetary_account_id}`);
        } catch (err) {
          console.error(`Error polling account ${mapping.bunq_monetary_account_id}:`, err);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, imported: totalImported }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("poll-bunq error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper: get connection for a household
async function getConnection(supabase: any, householdId: string) {
  const { data, error } = await supabase.from("bunq_connections").select("*").eq("household_id", householdId).single();
  if (error || !data) throw new Error("No bunq connection found for this household. Run setup first.");
  return data;
}
