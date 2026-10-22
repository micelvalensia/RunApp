# 🚀 Runner Project

Aplikasi desktop modern berbasis **Electron + TypeScript** yang dirancang khusus untuk mengelompokkan, mengelola, dan menjalankan multi-terminal service dalam satu workspace terpadu di lingkungan **Windows** (Windows 10 & Windows 11).

---

## ✨ Fitur Utama

- 📁 **Project & Service Grouping**: Kelompokkan beberapa service (misal Frontend, Backend API, Worker, Database) dalam satu project tanpa membuka puluhan jendela terminal terpisah.
- ▶️ **One-Click Command Execution**: Jalankan executable utama atau sub-commands kustom secara langsung dari kartu service.
- 🪟 **Optimasi Penuh Windows 10 & Windows 11**:
  - **Dukungan Windows Modern Tanpa WMIC**: Berjalan mulus di Windows 11 (22H2 / 24H2) yang telah menghapus utilitas lawas `wmic.exe`.
  - **Multi-Shell Windows Support**: Fleksibilitas memilih shell terminal per-service: **Command Prompt (`cmd.exe`)**, **PowerShell (`powershell.exe`)**, atau **Git Bash (`bash.exe`)**.
  - **Zero Background Pop-ups**: Seluruh pendeteksian proses anak berjalan 100% senyap di background (`CREATE_NO_WINDOW`) tanpa memunculkan jendela konsol berkedip.
  - **Hemat Memori & Bebas Leak**: Menggunakan arsitektur *batch status checking* dengan *process locking* untuk mencegah penumpukan proses dan menjaga konsumsi RAM tetap rendah (~0–50 MB beban background).
- 🟢 **Live Process & Status Tracking**: Deteksi real-time apakah command sedang berjalan (`running`) atau berhenti (`stopped`), termasuk saat dihentikan via `Ctrl+C` di terminal maupun saat proses selesai otomatis.
- 💻 **Smart Responsive Terminal (XTerm.js + FitAddon)**: 
  - Auto-fit ukuran baris & kolom terminal mengikuti ukuran window/container secara dinamis.
  - Scrollback buffer hingga **10.000 baris** dengan scrolling yang halus tanpa terpotong.
  - Tombol **Clear Terminal** untuk membersihkan layar secara instan.
- ⛶ **Terminal Focus / Maximize Mode**: Maksimalkan tampilan terminal hingga 100% layar dengan tombol maximize atau cukup **Double-Click** pada header terminal.
- 💾 **Local SQLite Storage**: Semua konfigurasi project, service, dan commands tersimpan aman dan cepat menggunakan `better-sqlite3`.
- 🛡️ **Graceful Process Lifecycle**: Terminal PTY dibersihkan secara otomatis saat aplikasi ditutup untuk mencegah zombie process di Windows Task Manager.

---

## 🛠️ Tech Stack

- **Desktop Framework**: [Electron](https://www.electronjs.org/)
- **Build Tool**: [electron-vite](https://electron-vite.org/) & [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Database**: SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3))
- **Terminal & PTY**: [@xterm/xterm](https://xtermjs.org/), [@xterm/addon-fit](https://www.npmjs.com/package/@xterm/addon-fit), [@lydell/node-pty](https://github.com/lydell/node-pty)
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 💻 Penggunaan Shell di Windows

Aplikasi mendukung tiga tipe shell populer di Windows yang dapat dipilih melalui dropdown terminal:

| Shell | Executable Default | Keterangan |
| :--- | :--- | :--- |
| **CMD** | `%COMSPEC%` (`cmd.exe`) | **Rekomendasi default.** Sangat ringan, cepat, dan hemat memori (~4 MB RAM per instance). |
| **PowerShell** | `powershell.exe` | Mendukung script Windows PowerShell (.ps1) dan perintah advanced. |
| **Git Bash** | `bash.exe` | Otomatis mendeteksi instalasi Git for Windows (`C:\Program Files\Git\bin\bash.exe`). |

---

## 🚀 Memulai Pengembangan (Development di Windows)

### Prasyarat
- **Node.js**: Versi 20 atau 22 LTS
- **pnpm**: Versi 10 atau lebih baru
- **Visual C++ Build Tools** (jika melakukan build native dependency secara lokal di Windows):
  ```powershell
  npm install -g windows-build-tools
  # atau install via Visual Studio Installer (Desktop development with C++)
  ```

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

# Build Windows installer lokal (.exe)
pnpm build:win      # Menghasilkan NSIS Setup & Portable di folder dist/
```

---

## 📦 Build Windows (.exe) via GitHub Actions (CI/CD)

Karena dependensi `better-sqlite3` dan `node-pty` memerlukan kompilasi native C++, repository ini sudah dilengkapi dengan **GitHub Actions Workflow** berbasis runner Windows resmi (`windows-latest`) lengkap dengan MSVC environment.

### 1. Build Manual (Kapan Saja)
1. Buka tab **Actions** di repository GitHub Anda.
2. Pilih workflow **Build Windows Release** di sidebar kiri.
3. Klik tombol **Run workflow** ▶️ pada branch `main`.
4. Setelah proses selesai (± 2-3 menit), download paket binary dari bagian **Artifacts**:
   - `runner-project-*-setup.exe` (NSIS Installer)
   - `runner-project-*-portable.exe` (Portable Standalone)

### 2. Auto-Publish Release via Git Tag
Cukup buat tag versi baru dan push ke GitHub:
```bash
git tag v1.0.9
git push origin v1.0.9
```
GitHub Actions akan otomatis me-build dan mempublikasikan installer siap pakai langsung di halaman **GitHub Releases**.

---

## 📂 Struktur Project

```
├── .github/
│   └── workflows/        # GitHub Actions CI/CD (Windows MSVC build)
├── electron/
│   ├── main/             # Electron Main Process
│   │   ├── ipc/          # IPC Handlers (Terminal status batching, dialog, database)
│   │   ├── process/      # Terminal spawn & Windows child process tracker
│   │   ├── updater.ts    # Safe Auto-Updater (active on production)
│   │   └── window.ts     # Window manager & Chromium options
│   └── preload/          # Preload bridge API
├── src/
│   ├── database/         # SQLite schema & database migrations
│   ├── repositories/     # Data Access Layer (Projects, Services, Commands)
│   ├── services/         # Business logic layer
│   ├── renderer/         # Frontend UI (HTML, CSS, TypeScript)
│   │   ├── script/       # UI Logic, state, event handlers, terminal manager
│   │   └── style/        # Modern dark-theme stylesheet
│   └── shared/           # Shared TypeScript types & interfaces
├── electron-builder.yml  # Konfigurasi packaging NSIS & Portable Windows
└── package.json
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
