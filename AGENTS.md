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
- gunakan bahasa indonesia saat commit
- buat commit message saat diminta saja, jangan otomatis buat commit sebelum diminta

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

---

# Konteks Aplikasi

Project ini adalah monorepo e-commerce dengan 3 aplikasi utama:
- `ecommerce-backend`: REST API menggunakan Go Fiber, GORM, dan MySQL.
- `ecommerce-frontend`: web app menggunakan React + Vite.
- `ecommerce-mobile`: aplikasi Expo/React Native sederhana.

## Backend
- Entry point backend ada di `ecommerce-backend/main.go`.
- Koneksi database ada di `ecommerce-backend/config/database.go`.
- Routing utama ada di `ecommerce-backend/routes/setup.go`.
- Backend memakai `AutoMigrate` untuk model di folder `ecommerce-backend/models`.
- Upload file disimpan di `ecommerce-backend/uploads` dan diserve sebagai `/uploads`.
- Autentikasi menggunakan JWT Bearer token di `ecommerce-backend/middleware/auth.go`.
- Role yang digunakan: `admin`, `seller`, `buyer`, `courier`, `warehouse_staff`.

## Domain Backend
- Auth: register OTP, login email/password, dan Google login.
- User/Profile: ambil dan update profil user.
- Shop/Product: registrasi toko, approval toko oleh admin, CRUD produk seller.
- Cart/Order: keranjang, checkout, upload bukti pembayaran, update status order.
- Wallet/Akane Pay: setup PIN, top up, withdrawal, pembayaran order.
- Shipment/Warehouse/Delivery Hub: tracking resi, proses gudang, kurir, assignment hub, bukti pengiriman.
- Admin: dashboard, manajemen user, toko, warehouse, courier, dan delivery hub.

## Frontend Web
- Entry point frontend ada di `ecommerce-frontend/src/main.jsx`.
- Routing halaman ada di `ecommerce-frontend/src/App.jsx`.
- Halaman dibagi ke folder `pages/auth`, `pages/user`, `pages/seller`, dan `pages/admin`.
- Frontend web saat ini banyak memakai `axios` langsung di halaman dengan base URL `http://localhost:3000/api`.
- Token dan role disimpan di `localStorage`.
- Belum ada centralized API client atau protected route global di frontend web; proteksi utama tetap di backend.
- Dark mode dikelola melalui `ecommerce-frontend/src/context/ThemeContext.jsx`.
- Data wilayah Indonesia memakai service `ecommerce-frontend/src/services/regionService.js`.

## Mobile
- Entry point mobile ada di `ecommerce-mobile/App.js`.
- API client mobile ada di `ecommerce-mobile/src/services/api.js`.
- Mobile memakai `AsyncStorage` untuk token dan axios interceptor untuk menyisipkan Authorization header.
- Base URL mobile masih hardcoded ke IP lokal, jadi perlu dicek jika jaringan/device berubah.

## Alur Bisnis Utama
- Buyer melihat produk publik dari `/api/products`.
- Buyer menambah produk ke cart, lalu checkout membuat order per toko.
- Pembayaran bisa melalui upload bukti transfer manual atau Akane Pay.
- Seller memproses order dan saat status menjadi `Dikirim`, backend membuat shipment dan nomor resi.
- Warehouse staff dan courier memperbarui status/lokasi shipment.
- Buyer dapat tracking resi dan konfirmasi paket diterima.
- Buyer dapat mendaftar sebagai seller; toko perlu approval admin sebelum aktif sebagai seller.

## Catatan Implementasi Existing
- Field `Product.Image` menyimpan JSON string array path gambar, bukan tabel relasi gambar.
- Response API umumnya memakai `fiber.Map` dengan key seperti `message`, `data`, `token`, atau `role`.
- Beberapa controller mengambil `user_id` dari JWT locals sebagai `float64`; ikuti pola existing atau gunakan helper yang sudah ada bila tersedia.
- Jangan membuat arsitektur baru besar-besaran kecuali memang dibutuhkan; project saat ini memakai controller langsung ke GORM tanpa layer service terpisah.

---

# Common Mistakes To Avoid

Section ini digunakan untuk menyimpan kesalahan yang pernah dilakukan AI agar tidak terulang di sesi berikutnya.

## Auto Update Rule

Setelah memperbaiki error, jika error tersebut disebabkan oleh kesalahan implementasi AI dan berpotensi terjadi lagi, AI HARUS menambahkan catatan baru ke section ini.

Jangan menulis catatan jika:
- error hanya typo kecil sekali
- error tidak relevan untuk sesi berikutnya
- error berasal dari input user yang salah
- catatan serupa sudah ada sebelumnya

AI hanya boleh menambahkan catatan baru.
AI tidak boleh menghapus atau mengubah catatan lama tanpa diminta user.

## Format Wajib

1. **Kesalahan:** ...
   - **Penyebab:** ...
   - **Solusi:** ...
   - **Pencegahan:** ...
   - **File terkait:** ...

## Catatan Kesalahan

1. 
