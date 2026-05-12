# AGENTS.md

## Bahasa Respon
- Selalu jawab menggunakan bahasa Indonesia.
- Jangan mengubah bahasa kecuali user meminta.

---

# Workflow Utama

## Saat menerima task
AI HARUS mengikuti workflow berikut:

1. Pelajari file dan alur yang relevan terlebih dahulu.
2. Pahami arsitektur dan pola kode existing.
3. Lakukan implementasi fitur / perbaikan.
4. Setelah selesai coding:
   - cek error
   - cek type error
   - cek build
   - cek lint
   - cek compile
5. Jika ada error:
   - cari root cause
   - perbaiki error
   - ulangi pengecekan
6. Jika tidak ada error:
   - berhenti melakukan perubahan tambahan
   - jelaskan hasil perubahan

AI TIDAK boleh berhenti setelah coding tanpa melakukan pengecekan error.

---

# Aturan Analisis Sebelum Coding

Sebelum mengubah file:
- pahami flow fitur terkait
- baca file yang relevan terlebih dahulu
- ikuti style code existing
- gunakan perubahan seminimal mungkin
- jangan rewrite besar-besaran tanpa alasan kuat

Jika ada pattern existing:
- gunakan pattern yang sama
- jangan membuat style baru sendiri

---

# Backend Rules (Go Fiber)

## Struktur
- Ikuti struktur controller/service/model/router existing.
- Jangan memindahkan file tanpa alasan kuat.
- Gunakan naming convention yang sudah ada.

## Error Handling
- Gunakan error handling yang konsisten.
- Jangan menggunakan panic kecuali memang diperlukan.
- Return response API mengikuti format existing.

## Database
- Jangan mengubah schema database tanpa kebutuhan jelas.
- Jika perlu migration, jelaskan perubahan schema.

## Validation
- Selalu validasi input.
- Jangan percaya input user secara langsung.

---

# Frontend Rules (React + Vite)

## UI
- Ikuti design existing.
- Gunakan component existing jika memungkinkan.
- Jangan membuat UI dengan style berbeda dari halaman lain.

## React Rules
- Gunakan functional component.
- Gunakan hooks pattern existing.
- Hindari duplicate state.

## Styling
- Ikuti styling dan class existing.
- Jangan membuat inline style berlebihan.

---

# Command Rules

## DILARANG menjalankan command long-running:
- npm run dev
- npm start
- go run main.go
- air
- nodemon
- vite
- docker compose up
- docker-compose up

## BOLEH menjalankan command pengecekan:
Frontend:
- npm run build
- npm run lint
- npm run type-check

Backend:
- go test ./...
- go test
- go build ./...
- gofmt
- go vet ./...

General:
- git diff
- git status
- ls
- tree
- cat
- rg
- grep

---

# Setelah Selesai

AI HARUS memberikan:
1. Ringkasan perubahan
2. File yang diubah
3. Alasan perubahan
4. Error yang ditemukan
5. Cara fix error
6. Hasil build/test/lint
7. Cara testing manual

---

# Debugging Rules

Jika menemukan error:
- jangan langsung menebak
- cari root cause terlebih dahulu
- baca stack trace dengan teliti
- cek dependency terkait
- cek import terkait
- cek type terkait
- cek route/alur data terkait

Jika fix pertama gagal:
- lanjut investigasi
- jangan berhenti di satu percobaan

---

# Security Rules

- Jangan hardcode secret/API key.
- Jangan expose credential.
- Jangan menghapus authentication/security existing tanpa alasan.
- Jangan disable validation hanya agar build berhasil.

---

# Git Rules

Saat diminta membuat commit message:
- gunakan format conventional commit

Contoh:
- feat:
- fix:
- refactor:
- chore:
- docs:

---

# Fokus Utama

Prioritas utama:
1. kode berjalan dengan benar
2. tidak ada error
3. konsisten dengan project existing
4. perubahan minimal namun efektif
5. maintainable
6. mudah dipahami