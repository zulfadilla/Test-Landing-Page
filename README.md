# Zurutech Solution: landing page banner & bunting

Landing page jualan banner tarpaulin, bunting X-stand dan roll-up, dengan checkout ikut saiz, kos pos Semenanjung / Sabah-Sarawak, dan bayaran ToyyibPay (FPX, kad, e-wallet). Dihoskan di **Cloudflare Pages**.

## Struktur
| Laluan | Fungsi |
|---|---|
| `public/index.html` | Landing page (hero, produk, galeri, testimoni, penghantaran, checkout, FAQ) |
| `public/pricing.mjs` | **Semua harga & kos pos** (nilai contoh). Ubah di sini sahaja, server guna fail yang sama |
| `public/terima-kasih.html` | Halaman selepas bayar, semak status sebenar dengan ToyyibPay |
| `functions/api/checkout.js` | Kira semula harga di server, cipta bil ToyyibPay, rekod order |
| `functions/api/toyyibpay-callback.js` | ToyyibPay maklumkan bayaran, disahkan semula melalui API |
| `functions/api/order-status.js` | Status untuk halaman terima kasih |
| `apps-script.gs` | Skrip Google Sheets untuk rekod order |

## Deploy ke Cloudflare Pages
1. Cloudflare dashboard > **Workers & Pages** > Create > Pages > **Connect to Git** > pilih repo ini.
2. Framework preset: **None**. Build command: *(kosong)*. Build output directory: **`public`**.
3. Save and Deploy. Site live di `https://<nama>.pages.dev`.

## Pembolehubah persekitaran (Settings > Variables and Secrets)
| Nama | Nilai |
|---|---|
| `TOYYIBPAY_SECRET_KEY` | User Secret Key akaun ToyyibPay (jenis Secret) |
| `TOYYIBPAY_CATEGORY_CODE` | Kod Category yang dicipta di ToyyibPay |
| `TOYYIBPAY_MODE` | kosong = sandbox (dev.toyyibpay.com), `live` = bayaran sebenar |
| `SHEETS_WEBHOOK_URL` | URL web app Apps Script (lihat bawah) |
| `SHEETS_WEBHOOK_SECRET` | Sama dengan `SECRET` dalam apps-script.gs (jenis Secret) |

Tanpa `TOYYIBPAY_*`, site berjalan dalam **mod demo**: order direkod, tiada bayaran.

## Rekod order
- **Google Sheets (disyorkan):** buat Sheet baharu > Extensions > Apps Script > tampal `apps-script.gs`, tukar `SECRET`, Deploy > Web app (Execute as: Me, Access: Anyone). Salin URL ke `SHEETS_WEBHOOK_URL`. Setiap order masuk satu baris dan status dikemas kini bila dibayar.
- **Cloudflare KV (pilihan):** cipta KV namespace, kemudian di Settings > Bindings tambah KV binding bernama `ORDERS`.

## Perlu tukar sebelum live
- Harga & kos pos dalam `public/pricing.mjs`
- No. WhatsApp `60123456789` / `012-345 6789` dan e-mel `hello@zurutech.my` (index.html, terima-kasih.html)
- Testimoni contoh dan gambar mockup `public/img/*.svg`
- Logo sementara `public/img/logo.svg`

## Uji di komputer
```
npx wrangler pages dev public
```
