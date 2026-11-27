import { PRODUCTS, SHIPPING, quote } from "/pricing.mjs";

const f = document.getElementById("order");
const E = f.elements;
const $ = (id) => document.getElementById(id);
const rm = (n) => "RM" + n.toFixed(2);
const BORNEO = ["Sabah", "Sarawak", "W.P. Labuan"];

const custom = $("custom-size"), fixed = $("fixed-size");

function fillVariants(product) {
  const p = PRODUCTS[product];
  E.variant.innerHTML = "";
  if (p.type !== "fixed") return;
  for (const [k, v] of Object.entries(p.variants)) {
    E.variant.add(new Option(`${v.label} · RM${v.price}`, k));
  }
}

function current() {
  const product = E.product.value;
  const isCustom = PRODUCTS[product].type === "custom";
  return {
    product,
    variant: E.variant.value,
    width: E.width.value,
    height: E.height.value,
    qty: isCustom ? E.qty.value : E.qty2.value,
    region: BORNEO.includes(E.state.value) ? "borneo" : "semenanjung",
  };
}

function render() {
  const c = current();
  const isCustom = PRODUCTS[c.product].type === "custom";
  custom.hidden = !isCustom;
  fixed.hidden = isCustom;
  $("size-hint").textContent = isCustom
    ? `RM${PRODUCTS.banner.ratePerSqft.toFixed(2)} sekaki persegi (minimum RM${PRODUCTS.banner.minPrice}). Saiz popular: 6x3, 8x4, 10x4 kaki.`
    : "Harga termasuk cetakan penuh warna.";
  const q = quote(c);
  $("s-region").textContent = SHIPPING[c.region].label + (E.state.value ? "" : " (pilih negeri)");
  if (!q) {
    $("s-desc").textContent = "Semak saiz & kuantiti";
    $("s-sub").textContent = $("s-ship").textContent = $("s-total").textContent = "–";
    return null;
  }
  $("s-desc").textContent = `${q.desc} × ${q.qty}`;
  $("s-sub").textContent = rm(q.subtotal);
  $("s-ship").textContent = q.shipping ? rm(q.shipping) : "PERCUMA";
  $("s-total").textContent = rm(q.total);
  const ship = SHIPPING[c.region];
  $("s-free").textContent = ship.freeAbove && q.shipping
    ? `Tambah ${rm(ship.freeAbove - q.subtotal)} lagi untuk penghantaran percuma.` : "";
  return q;
}

f.addEventListener("input", render);
f.addEventListener("change", (e) => {
  if (e.target.name === "product") fillVariants(E.product.value);
  render();
});

document.querySelectorAll("[data-pick]").forEach((a) =>
  a.addEventListener("click", () => {
    const r = f.querySelector(`input[name=product][value=${a.dataset.pick}]`);
    r.checked = true;
    fillVariants(r.value);
    render();
  })
);

function validate() {
  let ok = true;
  for (const name of ["name", "phone", "email", "address", "postcode", "city", "state"]) {
    const el = E[name];
    let bad = !el.value.trim();
    if (name === "phone") bad = !/^0\d{8,10}$/.test(el.value.replace(/[\s-]/g, ""));
    if (name === "email") bad = !/^\S+@\S+\.\S+$/.test(el.value);
    if (name === "postcode") bad = !/^\d{5}$/.test(el.value);
    el.classList.toggle("bad", bad);
    if (bad && ok) el.focus();
    ok = ok && !bad;
  }
  return ok;
}

f.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("err");
  err.hidden = true;
  const q = render();
  if (!q) { err.textContent = "Sila semak saiz dan kuantiti."; err.hidden = false; return; }
  if (!validate()) { err.textContent = "Sila lengkapkan maklumat yang ditanda merah."; err.hidden = false; return; }

  const btn = $("pay");
  btn.disabled = true;
  btn.textContent = "Memproses…";
  const payload = {
    ...current(),
    name: E.name.value.trim(), phone: E.phone.value.replace(/[\s-]/g, ""), email: E.email.value.trim(),
    address: E.address.value.trim(), postcode: E.postcode.value.trim(), city: E.city.value.trim(),
    state: E.state.value, notes: E.notes.value.trim(),
  };
  try {
    const res = await fetch("/api/checkout", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ralat pelayan");

    // Simpan ringkasan untuk halaman terima kasih
    try { sessionStorage.setItem("zt-last-order", JSON.stringify({ id: data.orderId, item: data.item, qty: data.qty, total: data.total, mode: data.mode, firstName: payload.name.split(" ")[0] })); } catch {}

    location.href = data.redirect;
  } catch (ex) {
    err.textContent = "Maaf, tempahan tidak dapat diproses: " + ex.message + ". Cuba lagi atau WhatsApp kami.";
    err.hidden = false;
    btn.disabled = false;
    btn.textContent = "Bayar Sekarang";
  }
});

fillVariants(E.product.value);
render();
