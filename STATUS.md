# STATUS.md — Papan Status Proyek

Proyek: Catatan & To-do dengan Login (Proyek #1 — For Learn)
Folder: `Web/catatan-todo-login-for-learn-v1`
Fase saat ini: Fase 2 (Selesai — Siap masuk Fase 3 Implementasi)
Putaran perbaikan QA: 0 / 3
Gate 1: disetujui (2026-11-25) · Gate 2: belum

| ID | Tugas | Pemilik | Status | Catatan |
|---|---|---|---|---|
| T01 | Susun PRD | Koordinator | DONE | `docs/PRD.md` terverifikasi lengkap (F1–F3, US-1 s.d. US-11, out-of-scope, DoD) |
| T02 | Rancang arsitektur + openapi.yaml | Arsitek | DONE | `docs/ARCHITECTURE.md` dan `docs/openapi.yaml` selesai dan saling konsisten |
| T03 | Setup repo, Docker, CI | Koordinator | DONE | Repo Git, branch (`feat/backend`, `feat/frontend`), `docker-compose.yml`, `.env.example`, `.gitignore`, dan CI selesai; `docker compose up -d` terverifikasi menjalankan `catatan-todo-db` (PostgreSQL 16) dalam status `healthy` |
| T04 | Implementasi backend | Backend | TODO | Siap mulai di branch `feat/backend` |
| T05 | Implementasi frontend (mock) | Frontend | TODO | Siap mulai paralel di branch `feat/frontend` |
| T06 | Integrasi | Backend + Frontend | TODO | Setelah T04 & T05 |
| T07 | Audit QA | QA & Reviewer | TODO | Setelah T06 |
| T08 | Review + Pull Request | QA & Reviewer | TODO | Setelah T07 LOLOS |
| T09 | README + deploy | Koordinator | TODO | Setelah Gate 2 |

## Log keputusan
- **2026-11-24:** Proyek #1 dimulai dalam mode belajar bertahap (tidak langsung full multi-agent paralel dalam satu hari). Folder proyek dibuat di `Web/catatan-todo-login-for-learn-v0` (akhiran `v0` menandakan Fase 0).
- **2026-11-24:** Fase 0 (`docs/PRD.md`) ditetapkan dan diverifikasi memenuhi syarat `AGENTS.md` (3 fitur inti, user stories, kriteria penerimaan, batasan luar lingkup, dan kriteria sukses).
- **2026-11-24:** Pengingat pasca-rilis (Design Polish, Security Fresh-Context Audit, Siklus Update Versi) disimpan di `.agents/CATATAN_PASCA_RILIS.md` untuk dijalankan setelah v1.0 selesai.
- **2026-11-25:** **Gate 1 DISETUJUI** oleh Manusia. Rencana `docs/ARCHITECTURE.md`, `docs/openapi.yaml`, dan 4 keputusan ADR disahkan. Lanjut ke Fase 2 dan upload ke `https://github.com/ZenKaizen2026/catatan-todo-login-for-learn-v1.git`.
- **2026-11-26:** Docker Desktop (v29.9.3 / Compose v5.7.1) aktif. `docker compose up -d --wait` berhasil menjalankan container `catatan-todo-db` (`postgres:16-alpine`) dalam status **healthy** di port `5432`. **Fase 2 (`T03`) resmi DONE.**
