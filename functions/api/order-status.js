import { getOrder, saveOrder, verifyBill } from "../../lib/orders.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  if (!/^ZT\d{6}-[A-F0-9]{6}$/.test(id)) return Response.json({ error: "ID tidak sah" }, { status: 400 });
  const o = await getOrder(env, id);
  // Tanpa KV: semak terus dengan ToyyibPay guna billcode dari URL pulangan
  const billCode = o?.billCode || url.searchParams.get("billcode") || "";
  if (!o && !billCode) return Response.json({ error: "Tidak ditemui" }, { status: 404 });

  let status = o?.status || "pending";
  if (status === "pending" && billCode) {
    status = await verifyBill(env, billCode).catch(() => "pending");
    if (o && status !== "pending") { o.status = status; o.updatedAt = new Date().toISOString(); await saveOrder(env, o); }
  }
  // Maklumat minimum sahaja (tiada alamat/telefon)
  return Response.json(o
    ? { id, firstName: String(o.name).split(" ")[0], item: o.item, qty: o.qty, total: o.total, status, mode: o.mode }
    : { id, status });
}
