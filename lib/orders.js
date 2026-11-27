// Utiliti dikongsi oleh Cloudflare Pages Functions
const e = (env, k) => String(env[k] || "").trim();

export const toyyib = (env) => {
  const secret = e(env, "TOYYIBPAY_SECRET_KEY");
  const category = e(env, "TOYYIBPAY_CATEGORY_CODE");
  const live = e(env, "TOYYIBPAY_MODE") === "live";
  return { enabled: Boolean(secret && category), secret, category, live,
    base: live ? "https://toyyibpay.com" : "https://dev.toyyibpay.com" };
};

// Simpanan order: Cloudflare KV (binding ORDERS). Pilihan; tanpa KV order masih dihantar ke Google Sheets.
export const saveOrder = (env, o) => env.ORDERS ? env.ORDERS.put(o.id, JSON.stringify(o)) : Promise.resolve();
export const getOrder = async (env, id) => env.ORDERS ? env.ORDERS.get(id, "json") : null;

// ToyyibPay: billName/billDescription hanya huruf, nombor, ruang & underscore
export const clean = (s, max) => String(s).replace(/[^A-Za-z0-9 _]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export async function createBill(env, o, origin) {
  const t = toyyib(env);
  const body = new URLSearchParams({
    userSecretKey: t.secret, categoryCode: t.category,
    billName: clean(`Zurutech ${o.id}`, 30), billDescription: clean(o.item, 100),
    billPriceSetting: "1", billPayorInfo: "1", billAmount: String(Math.round(o.total * 100)),
    billReturnUrl: `${origin}/terima-kasih.html`, billCallbackUrl: `${origin}/api/toyyibpay-callback`,
    billExternalReferenceNo: o.id, billTo: clean(o.name, 50) || "Pelanggan",
    billEmail: o.email, billPhone: o.phone, billPaymentChannel: "2", billExpiryDays: "3",
  });
  const res = await fetch(`${t.base}/index.php/api/createBill`, { method: "POST", body });
  const text = await res.text();
  let code;
  try { code = JSON.parse(text)?.[0]?.BillCode; } catch {}
  if (!code) throw new Error(`ToyyibPay createBill gagal: ${text.slice(0, 200)}`);
  return { billCode: code, url: `${t.base}/${code}` };
}

// Sahkan status terus dengan ToyyibPay (jangan percaya parameter URL semata-mata)
export async function verifyBill(env, billCode) {
  const res = await fetch(`${toyyib(env).base}/index.php/api/getBillTransactions`, {
    method: "POST", body: new URLSearchParams({ billCode }),
  });
  let rows = [];
  try { rows = await res.json(); } catch {}
  if (!Array.isArray(rows) || !rows.length) return "pending";
  const st = rows.map((r) => String(r.billpaymentStatus));
  if (st.includes("1")) return "paid";
  if (st.includes("2") || st.includes("4")) return "pending";
  return "failed";
}

// Hantar salinan ke Google Sheets melalui Apps Script web app (lihat apps-script.gs)
export async function logToSheet(env, o) {
  const url = e(env, "SHEETS_WEBHOOK_URL");
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: e(env, "SHEETS_WEBHOOK_SECRET"), order: o }), redirect: "follow" });
  } catch (err) { console.error("Sheets webhook gagal", err); }
}
