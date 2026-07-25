# TKAMAJU — Latihan Soal TKA

Struktur proyek (HTML + CSS + JavaScript + Python terpisah):

```
tkamaju2/
├── app.py                 ← Backend Python (Flask): API register/login/poin/leaderboard
├── requirements.txt        ← Dependensi Python
├── data/
│   └── users.json          ← Dibuat otomatis, tempat data akun & poin disimpan
├── templates/
│   └── index.html           ← Struktur halaman (HTML)
└── static/
    ├── style.css            ← Semua styling/tampilan (CSS)
    └── script.js             ← Logika aplikasi: bank soal, kuis, rank (JavaScript)
```

## Cara menjalankan

1. Install Python 3.9+ jika belum ada.
2. Buka terminal di folder `tkamaju2/`, lalu jalankan:
   ```
   pip install -r requirements.txt
   python app.py
   ```
3. Buka browser ke: `http://localhost:5000`

Server Python akan menyajikan halaman web sekaligus API untuk akun,
poin, dan papan peringkat. Data pengguna tersimpan di `data/users.json`.

## Menambah soal baru

Buka `static/script.js`, cari objek `QUESTIONS`. Tambahkan soal baru
mengikuti pola:

```js
mc('Pertanyaan pilihan ganda?', ['A','B','C','D'], 2, 15)   // 2 = index jawaban benar, 15 = poin
esai('Pertanyaan uraian?', ['jawaban diterima 1','jawaban lain'], 20)
```

Letakkan di dalam `QUESTIONS[jenjang][mapel][mode]` sesuai kategori
(jenjang: sd/smp/sma, mapel: bindo/matematika/ipa/ips/bing, mode:
mudah/sedang/susah).

## Catatan keamanan

Ini adalah versi latihan/prototipe: kata sandi disimpan dalam bentuk
teks biasa di `data/users.json`. Untuk pemakaian sungguhan (banyak
pengguna asli), sebaiknya:
- Hash kata sandi (mis. `werkzeug.security.generate_password_hash`)
- Pindah penyimpanan ke database (SQLite/PostgreSQL)
- Tambahkan sesi login (Flask-Login) dan HTTPS
