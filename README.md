# 🚀 Runner Project

Aplikasi desktop modern berbasis **Electron + TypeScript** yang dirancang untuk mengelompokkan, mengelola, dan menjalankan multi-terminal service dalam satu workspace terpadu.

---

## ✨ Fitur Utama

- 📁 **Project & Service Grouping**: Kelompokkan beberapa service (misal Frontend, Backend API, Worker, Database) dalam satu project tanpa membuka puluhan jendela terminal terpisah.
- ▶️ **One-Click Command Execution**: Jalankan executable utama atau sub-commands kustom secara langsung dari kartu service.
- 🟢 **Live Process & Status Tracking**: Deteksi real-time apakah command sedang berjalan (`running`) atau berhenti (`stopped`), termasuk saat dihentikan via `Ctrl+C` di terminal maupun saat proses selesai otomatis.
- 💻 **Smart Responsive Terminal (XTerm.js + FitAddon)**: 
  - Auto-fit ukuran baris & kolom terminal mengikuti ukuran window/container secara dinamis.
  - Scrollback buffer hingga **10.000 baris** dengan scrolling yang halus tanpa terpotong.
  - Tombol **Clear Terminal** untuk membersihkan layar secara instan.
- ⛶ **Terminal Focus / Maximize Mode**: Maksimalkan tampilan terminal hingga 100% layar dengan tombol maximize atau cukup **Double-Click** pada header terminal.
- 💾 **Local SQLite Storage**: Semua konfigurasi project, service, dan commands tersimpan aman dan cepat menggunakan `better-sqlite3`.
- 🛡️ **Graceful Process Lifecycle**: Terminal PTY dibersihkan secara otomatis saat aplikasi ditutup untuk mencegah zombie process.

---

## 🛠️ Tech Stack

- **Desktop Framework**: [Electron](https://www.electronjs.org/)
- **Build Tool**: [electron-vite](https://electron-vite.org/) & [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Database**: SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3))
- **Terminal & PTY**: [@xterm/xterm](https://xtermjs.org/), [@xterm/addon-fit](https://www.npmjs.com/package/@xterm/addon-fit), [@lydell/node-pty](https://github.com/lydell/node-pty)
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 🚀 Memulai Pengembangan (Development)

### Prasyarat
- **Node.js**: Versi 20 atau lebih baru
- **pnpm**: Versi 10 atau lebih baru

### Instalasi & Menjalankan Aplikasi
```bash
# 1. Clone repository
git clone https://github.com/micelvalensia/RunApp.git
cd RunApp

# 2. Install dependencies
pnpm install

# 3. Jalankan aplikasi dalam mode development
pnpm dev
```

### Scripts Tambahan
```bash
# Typecheck TypeScript (Node & Web)
pnpm typecheck

# Build bundle produksi
pnpm build

# Build installer lokal
pnpm build:linux    # Linux (AppImage, Deb, Snap)
pnpm build:win      # Windows (NSIS Installer & Portable)
```

---

## 📦 Build Windows (.exe) via GitHub Actions (CI/CD)

Karena dependensi `better-sqlite3` dan `node-pty` memerlukan kompilasi native C++, repository ini sudah dilengkapi dengan **GitHub Actions Workflow** (`windows-latest`) agar kamu bisa membuat installer Windows tanpa perlu memiliki laptop Windows.

### 1. Build Manual (Kapan Saja)
1. Buka tab **Actions** di repository GitHub.
2. Pilih workflow **Build Windows Release** di sidebar kiri.
3. Klik dropdown **Run workflow** ▶️.
4. Setelah proses selesai (± 2-3 menit), download file `.exe` dari bagian **Artifacts**.

### 2. Auto-Publish Release via Git Tag
Cukup buat tag versi baru dan push ke GitHub:
```bash
git tag v1.0.4
git push origin v1.0.4
```
GitHub Actions akan otomatis me-build dan merilis file installer di halaman **GitHub Releases**:
- `runner-project-1.0.4-nsis.exe` (*Installer - Startup instan & direkomendasikan*)
- `runner-project-1.0.4-portable.exe` (*Portable standalone tanpa instalasi*)

---

## 📂 Struktur Project

```
├── .github/
│   └── workflows/        # GitHub Actions CI/CD workflows
├── electron/
│   ├── main/             # Electron Main Process (PTY, IPC handlers, lifecycle)
│   └── preload/          # Preload bridge API
├── src/
│   ├── database/         # SQLite schema & database migrations
│   ├── repositories/     # Data Access Layer (Projects, Services, Commands)
│   ├── services/         # Business logic layer
│   ├── renderer/         # Frontend UI (HTML, CSS, TypeScript)
│   │   ├── script/       # UI Logic, state, event handlers, terminal manager
│   │   └── style/        # Modern dark-theme stylesheet
│   └── shared/           # Shared TypeScript types & interfaces
├── electron-builder.yml  # Konfigurasi packaging Electron Builder
└── package.json
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
