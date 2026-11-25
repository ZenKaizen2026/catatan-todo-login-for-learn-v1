# PRD — Catatan & To-do dengan Login (Proyek #1)

Versi: 1.0 · Pemilik produk: Manusia (Decision Maker) · Disusun untuk: tim agent (lihat `AGENTS.md`)
Letak file di repo: `docs/PRD.md`

---

## 1. Ringkasan
Aplikasi web untuk mencatat dan mengelola tugas harian. Pengguna mendaftar, login, lalu membuat tugas yang bisa dikelompokkan dalam kategori, diberi prioritas dan tenggat, diubah statusnya, dicari, dan difilter.

Proyek ini adalah **proyek fondasi**: fiturnya sengaja kecil supaya seluruh alur full-stack (frontend → API → database → kembali ke layar) bisa dipahami dan dijelaskan penuh.

## 2. Tujuan
**Tujuan produk**
- Pengguna dapat mengelola tugas pribadinya dengan aman (hanya dirinya yang bisa melihatnya).

**Tujuan belajar (alasan proyek ini ada)**
- Memahami autentikasi (register, login, token, sesi kedaluwarsa).
- Memahami CRUD, validasi, relasi tabel (1-N), filter, pencarian, dan pagination.
- Membedakan dan men-debug 400, 401, 403, 404, dan 500.
- Terbiasa dengan alur kerja industri: PRD → desain → kode → tes → review → merge.
- Menghasilkan satu repo portofolio yang bisa dijelaskan penuh saat interview.

## 3. Pengguna
Satu jenis pengguna: **Pengguna terdaftar** (mahasiswa atau pekerja yang ingin mengatur tugas pribadi). Tidak ada peran admin pada versi ini.

## 4. Fitur inti (3 fitur)

### F1 — Autentikasi
- **US-1** Sebagai pengunjung, saya bisa **mendaftar** dengan nama, email, dan password agar punya akun.
- **US-2** Sebagai pengguna, saya bisa **login** dengan email dan password agar bisa mengakses tugas saya.
- **US-3** Sebagai pengguna, saya bisa **logout** agar sesi saya berakhir di perangkat itu.
- **US-4** Sebagai pengguna, jika sesi saya kedaluwarsa, saya diarahkan ke halaman login dengan pesan yang jelas, bukan layar kosong atau error mentah.

Kriteria penerimaan:
- Email harus unik. Mendaftar dengan email yang sudah ada menampilkan pesan yang jelas.
- Password minimal 8 karakter dan disimpan dalam bentuk hash.
- Login gagal tidak menyebutkan apakah email atau passwordnya yang salah.
- Halaman tugas tidak bisa dibuka tanpa login.

### F2 — Pengelolaan tugas (CRUD)
- **US-5** Sebagai pengguna, saya bisa **membuat tugas** dengan judul, deskripsi (opsional), prioritas, tenggat (opsional), dan kategori (opsional).
- **US-6** Sebagai pengguna, saya bisa **melihat daftar tugas** milik saya dengan pagination.
- **US-7** Sebagai pengguna, saya bisa **mengubah** isi tugas dan **mengubah statusnya** (`todo` → `doing` → `done`, dan boleh mundur).
- **US-8** Sebagai pengguna, saya bisa **menghapus** tugas, dengan konfirmasi sebelum benar-benar terhapus.
- **US-9** Sebagai pengguna, saya bisa **mencari** tugas berdasarkan judul dan **memfilter** berdasarkan status, prioritas, dan kategori.

Kriteria penerimaan:
- Judul wajib, 1 sampai 120 karakter. Deskripsi maksimal 1000 karakter.
- Prioritas: `rendah`, `sedang`, `tinggi` (bawaan: `sedang`). Status bawaan: `todo`.
- Daftar tugas menampilkan 10 item per halaman (bawaan) dan urutan terbaru lebih dulu.
- Pengguna **tidak boleh** melihat, mengubah, atau menghapus tugas milik pengguna lain.

### F3 — Kategori
- **US-10** Sebagai pengguna, saya bisa **membuat, mengubah, dan menghapus kategori** pribadi (misalnya "Kuliah", "Proyek", "Pribadi").
- **US-11** Sebagai pengguna, saya bisa mengelompokkan tugas ke dalam satu kategori.

Kriteria penerimaan:
- Nama kategori wajib, 1 sampai 50 karakter, unik per pengguna.
- Menghapus kategori **tidak** menghapus tugasnya. Tugas tersebut menjadi "tanpa kategori".
- Pengguna hanya bisa memakai kategori miliknya sendiri.

## 5. Aturan umum
- Setiap layar yang mengambil data punya tiga keadaan: **memuat**, **error**, dan **kosong** (dengan ajakan membuat tugas pertama).
- Tampilan responsif (HP dan laptop) dan bisa dipakai dengan keyboard.
- Pesan error untuk pengguna ditulis dalam bahasa Indonesia yang mudah dipahami.
- Semua endpoint memakai format error seragam sesuai `AGENTS.md`.

## 6. Di luar lingkup (jangan dikerjakan sekarang)
- Reset password, verifikasi email, login dengan Google/OAuth.
- Berbagi tugas atau kolaborasi antar pengguna.
- Notifikasi dan pengingat.
- Subtugas, lampiran file, tag berlapis.
- Aplikasi mobile, mode gelap, multi-bahasa.
- Peran admin.

Hal-hal ini boleh masuk daftar ide untuk versi berikutnya.

## 7. Stack (tetap, lihat `AGENTS.md`)
TypeScript, React + Vite, Node.js + Fastify, PostgreSQL + Prisma, Zod, Vitest, Playwright, Docker Compose, GitHub Actions.

## 8. Data (gambaran, detail ditentukan Arsitek)
- **Pengguna**: nama, email (unik), password hash, tanggal dibuat.
- **Kategori**: nama, pemilik (pengguna). Satu pengguna punya banyak kategori.
- **Tugas**: judul, deskripsi, status, prioritas, tenggat, pemilik (pengguna), kategori (opsional). Satu pengguna punya banyak tugas.

## 9. Persyaratan non-fungsional
- **Keamanan**: password di-hash, token berumur terbatas, input divalidasi, tidak ada rahasia di repo, tiap data dicek kepemilikannya di sisi server.
- **Kinerja**: daftar tugas dimuat dengan pagination dan tidak melakukan query berulang per baris (hindari masalah N+1).
- **Keterpeliharaan**: TypeScript `strict`, tes untuk setiap endpoint, lint bersih.
- **Portabilitas**: seluruh sistem bisa dijalankan dengan `docker compose up` dan satu petunjuk di README.

## 10. Kriteria sukses (Definition of Done proyek)
1. Pengguna bisa menjalankan alur lengkap: daftar → login → buat kategori → buat tugas → ubah status → cari dan filter → hapus → logout.
2. Semua user story US-1 sampai US-11 berjalan sesuai kriteria penerimaan.
3. Tes unit dan integrasi lolos, plus tes e2e untuk alur utama (Playwright).
4. Laporan QA berverdict **LOLOS**, tanpa temuan tinggi atau sedang yang terbuka.
5. README lengkap: cara menjalankan, fitur, stack, dan keputusan teknis penting.
6. Pemilik proyek bisa menjelaskan alur satu request dari klik tombol sampai database **tanpa bantuan AI**.

## 11. Rencana waktu (acuan)
| Tahap | Perkiraan |
|---|---|
| Fase 0–1: PRD, desain, Gate 1 | 1 hari |
| Fase 2: setup | 0,5 hari |
| Fase 3: implementasi paralel | 2–3 hari |
| Fase 4–5: integrasi dan QA (maks 3 putaran) | 1–2 hari |
| Fase 6–7: review, Gate 2, README | 1 hari |
| **Siklus belajar setelah kode jadi** | **5–7 hari** |

## 12. Rencana siklus belajar (setelah kode jadi)
- **Bedah kode**: gambar alur login dan alur "buat tugas" dari klik sampai database.
- **Code review**: balas semua komentar review pada Pull Request.
- **Bug lab** (kandidat bug yang disisipkan): path API salah (404), token kedaluwarsa (401), mengakses tugas pengguna lain (403), CORS, `useEffect` yang membuat render berulang, N+1 pada daftar tugas dengan kategori.
- **Simulasi interview**: tanya-jawab tentang JWT, hash password, relasi tabel, pagination, dan keputusan teknis di `ARCHITECTURE.md`.

## 13. Risiko
| Risiko | Penanganan |
|---|---|
| Fitur membengkak | Patuhi bagian "Di luar lingkup". Ide baru masuk daftar nanti. |
| Kode AI tidak dipahami | Siklus belajar wajib dijalankan sebelum proyek berikutnya. |
| Kontrak API berubah di tengah jalan | Hanya Arsitek yang boleh mengubah `openapi.yaml`. |
| Kuota agent habis | Kerjakan per fase dan catat progres di `STATUS.md`. |

## 14. Pertanyaan terbuka (diputuskan Arsitek dengan persetujuan di Gate 1)
- Masa berlaku token dan apakah memakai refresh token. Saran awal: token akses saja dulu, masa berlaku pendek.
- Penyimpanan token di frontend (memori, `localStorage`, atau cookie `httpOnly`) beserta konsekuensi keamanannya.
- Kode status saat mengakses data milik orang lain: 403 atau 404.
- Apakah penghapusan tugas permanen (hard delete) atau bertanda (soft delete).
