// Harga contoh (placeholder). Tukar nilai di sini sahaja: halaman & server guna fail yang sama.
export const PRODUCTS = {
  banner: {
    name: "Banner Tarpaulin",
    type: "custom", // harga ikut kaki persegi
    ratePerSqft: 1.2,
    minPrice: 25,
    note: "Tarpaulin 380gsm, siap eyelet & tali",
  },
  tstand: {
    name: "Banner T-Stand",
    type: "fixed",
    variants: {
      "2x5": { label: "2 x 5 kaki (cetak sahaja, tanpa stand)", price: 25 },
    },
  },
  rollup: {
    name: "Bunting Roll-Up",
    type: "fixed",
    variants: {
      "2.85x6.5": { label: "2.85 x 6.5 kaki (pakej cetak + stand + beg)", price: 120 },
    },
  },
};

export const SHIPPING = {
  semenanjung: { label: "Semenanjung Malaysia", fee: 12, freeAbove: 300 },
  borneo: { label: "Sabah / Sarawak / Labuan", fee: 30, freeAbove: null },
};

const round2 = (n) => Math.round(n * 100) / 100;

// Kira harga. Pulangkan null jika input tidak sah.
export function quote({ product, variant, width, height, qty, region }) {
  const p = PRODUCTS[product];
  const ship = SHIPPING[region];
  qty = Math.floor(Number(qty));
  if (!p || !ship || !(qty >= 1 && qty <= 500)) return null;

  let unit, desc;
  if (p.type === "custom") {
    const w = Number(width), h = Number(height);
    if (!(w >= 1 && w <= 100 && h >= 1 && h <= 100)) return null;
    unit = Math.max(round2(w * h * p.ratePerSqft), p.minPrice);
    desc = `${p.name} ${w} x ${h} kaki`;
  } else {
    const v = p.variants[variant];
    if (!v) return null;
    unit = v.price;
    desc = `${p.name} ${v.label}`;
  }
  const subtotal = round2(unit * qty);
  const shipping = ship.freeAbove && subtotal >= ship.freeAbove ? 0 : ship.fee;
  return { desc, unit, qty, subtotal, shipping, total: round2(subtotal + shipping) };
}
