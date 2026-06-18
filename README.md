# Kebutuhan Rumah Tangga

Aplikasi inventaris rumah tangga berbasis HTML, CSS, dan JavaScript murni. Tidak memerlukan PHP, MySQL, Node.js, atau XAMPP saat dihosting.

## Login admin

- Username: `admin`
- Password diatur melalui environment variable `ADMIN_PASSWORD`.

## Menjalankan secara lokal

Buka `index.html` langsung di browser, atau jalankan server statis:

```bash
npx serve .
```

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub.
2. Unggah seluruh isi folder ini ke root repository.
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**, branch `main`, folder `/ (root)`.

## Deploy ke Vercel

1. Unggah folder ini ke repository GitHub.
2. Di Vercel, pilih **Add New → Project**.
3. Impor repository tersebut.
4. Framework preset: **Other**.
5. Klik **Deploy**.

## Sinkronisasi lintas perangkat

Pasang integrasi **Neon Postgres** pada proyek Vercel, kemudian tambahkan:

- `DATABASE_URL`: otomatis tersedia dari integrasi Neon.
- `ADMIN_PASSWORD`: password akun admin.
- `SESSION_SECRET`: teks acak panjang minimal 32 karakter.

Setelah redeploy, data akun admin tersimpan di database dan tersinkron di semua perangkat. `localStorage` tetap digunakan sebagai cache dan mode cadangan jika server belum dikonfigurasi.
