# Runner Project

Aplikasi desktop untuk mengelola dan menjalankan services/commands dengan integrated terminal berbasis Electron.

## Features

- 📁 **Project Management** - Kelola multiple projects dalam satu aplikasi
- 🚀 **Service Management** - Tambah, edit, dan jalankan services per project
- 💻 **Integrated Terminal** - Terminal bawaan dengan XTerm untuk setiap service
- ⚡ **Command Shortcuts** - Simpan dan jalankan command favorit dengan satu klik
- 💾 **SQLite Database** - Data tersimpan lokal dengan SQLite
- 🎨 **Modern UI** - Interface clean dan responsive

## Installation

### Download Installer

Installer tersedia di folder `installers/`:

- **Windows Portable**: `runner-project-1.0.0-win-portable.zip` (87 MB)
  - Extract zip dan jalankan `runner-project.exe`
  - Tidak perlu instalasi, langsung jalankan

### Build from Source (untuk Linux atau full installer)

```bash
# Clone repository
git clone https://github.com/micelvalensia/RunApp.git
cd RunApp

# Install dependencies
pnpm install

# Build installer Linux
pnpm build:linux

# Build installer Windows 
pnpm build:win

# Hasil installer akan ada di folder dist/
# - Linux: dist/runner-project-1.0.0.AppImage
# - Windows: dist/runner-project-1.0.0-setup.exe
```

## Development

### Prerequisites

- Node.js 18+ 
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Run development mode
pnpm dev

# Build aplikasi
pnpm build

# Build installer
pnpm build:linux   # Linux (AppImage, Snap, Deb)
pnpm build:win     # Windows (NSIS installer)
```

## Tech Stack

- **Electron** - Desktop framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **SQLite** (better-sqlite3) - Local database
- **XTerm.js** - Terminal emulator
- **node-pty** - PTY process management

## Project Structure

```
├── electron/          # Main & preload process
│   ├── main/         # Main process (Node.js)
│   └── preload/      # Preload script
├── src/
│   ├── database/     # Database setup & migrations
│   ├── repositories/ # Data access layer
│   ├── services/     # Business logic
│   ├── renderer/     # UI layer
│   │   ├── script/   # Frontend TypeScript
│   │   └── style/    # CSS
│   └── shared/       # Shared types
└── installers/       # Built installers
```

## Recent Improvements

### Code Refactoring
- Split monolithic `main.ts` (600+ lines) into modular files
- Better separation of concerns (state, DOM, services, handlers)
- Eliminated circular dependencies

### Bug Fixes
- ✅ Fixed terminal process cleanup on app close
- ✅ PTY processes now properly terminate when window closes
- ✅ No more zombie processes in background

## License

MIT
