import { getOrder, saveOrder, verifyBill, logToSheet } from "../../lib/orders.js";

// ToyyibPay POST ke sini selepas pelanggan bayar (form-urlencoded)
export async function onRequestPost({ request, env }) {
  const form = await request.formData().catch(() => null);
  const id = String(form?.get("order_id") || "");
  const billCode = String(form?.get("billcode") || "");
  if (!id || !billCode) return new Response("bad request", { status: 400 });

  const status = await verifyBill(env, billCode);
  const order = (await getOrder(env, id)) || { id };
  if (order.billCode && order.billCode !== billCode) return new Response("mismatch", { status: 400 });
  if (order.status !== status) {
    Object.assign(order, { billCode, status, refNo: String(form?.get("refno") || ""), updatedAt: new Date().toISOString() });
    await saveOrder(env, order);
    await logToSheet(env, order);
  }
  return new Response("OK");
}
