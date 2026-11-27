import { quote } from "../../public/pricing.mjs";
import { saveOrder, toyyib, createBill, logToSheet } from "../../lib/orders.js";

const bad = (error, status = 400) => Response.json({ error }, { status });
const BORNEO = ["Sabah", "Sarawak", "W.P. Labuan"];

export async function onRequestPost({ request, env, waitUntil }) {
  let b;
  try { b = await request.json(); } catch { return bad("Data tidak sah"); }

  const str = (k, max = 200) => String(b?.[k] ?? "").trim().slice(0, max);
  const d = {
    name: str("name", 80), phone: str("phone", 15).replace(/[\s-]/g, ""), email: str("email", 120),
    address: str("address", 300), postcode: str("postcode", 5), city: str("city", 60),
    state: str("state", 40), notes: str("notes", 500),
  };
  if (!d.name || !d.address || !d.city || !d.state) return bad("Maklumat penghantaran tidak lengkap");
  if (!/^0\d{8,10}$/.test(d.phone)) return bad("No. telefon tidak sah");
  if (!/^\S+@\S+\.\S+$/.test(d.email)) return bad("E-mel tidak sah");
  if (!/^\d{5}$/.test(d.postcode)) return bad("Poskod tidak sah");

  // Harga dikira semula di server, bukan diambil dari pelayar
  const region = BORNEO.includes(d.state) ? "borneo" : "semenanjung";
  const q = quote({ product: b.product, variant: b.variant, width: b.width, height: b.height, qty: b.qty, region });
  if (!q) return bad("Produk, saiz atau kuantiti tidak sah");

  const now = new Date();
  const id = `ZT${now.toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const t = toyyib(env);
  const order = {
    id, createdAt: now.toISOString(), ...d, region,
    product: b.product, item: q.desc, qty: q.qty, unit: q.unit,
    subtotal: q.subtotal, shipping: q.shipping, total: q.total,
    mode: t.enabled ? (t.live ? "toyyibpay" : "toyyibpay-sandbox") : "demo",
    status: t.enabled ? "pending" : "demo",
  };

  const origin = new URL(request.url).origin;
  let redirect = `${origin}/terima-kasih.html?order_id=${id}`;
  if (t.enabled) {
    try {
      const bill = await createBill(env, order, origin);
      order.billCode = bill.billCode;
      redirect = bill.url;
    } catch (err) {
      console.error(err);
      return bad("Gerbang pembayaran tidak dapat dihubungi", 502);
    }
  }

  await saveOrder(env, order);
  waitUntil(logToSheet(env, order));
  return Response.json({ orderId: id, mode: order.mode, item: q.desc, qty: q.qty, total: q.total, redirect });
}
