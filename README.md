# Kebutuhan Rumah Tangga

Aplikasi inventaris rumah tangga berbasis HTML, CSS, dan JavaScript murni. Tidak memerlukan PHP, MySQL, Node.js, atau XAMPP saat dihosting.

## Login demo

- Username: `admin`
- Password: `admin123`

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

Data aplikasi disimpan di `localStorage` browser. Data bersifat lokal untuk setiap browser/perangkat dan tidak tersinkron antar pengguna.
