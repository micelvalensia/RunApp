# Struktur Project - Runner Project App

## Overview

Project ini menggunakan Electron + Vite + TypeScript dengan struktur folder yang terorganisir untuk memisahkan concern antara Electron processes, business logic, dan renderer.

## Struktur Folder

```
runner-project-app/
│
├── electron/                    # Electron-specific code
│   ├── main/                    # Main process
│   │   ├── index.ts            # Entry point main process
│   │   ├── window.ts           # Window management
│   │   └── ipc/                # IPC handlers
│   │       ├── index.ts        # IPC setup & coordination
│   │       ├── project.ipc.ts  # Project-related IPC
│   │       ├── service.ipc.ts  # Service-related IPC
│   │       ├── command.ipc.ts  # Command execution IPC
│   │       └── process.ipc.ts  # Process management IPC
│   │
│   └── preload/                # Preload scripts
│       ├── index.ts            # Preload script
│       └── index.d.ts          # Type definitions
│
├── src/                        # Application source code
│   ├── database/               # Database layer
│   │   ├── db.ts              # Database connection
│   │   ├── migrate.ts         # Migration runner
│   │   └── migrations/        # Migration files
│   │
│   ├── repositories/           # Data access layer
│   │   └── (repository files)
│   │
│   ├── services/               # Business logic layer
│   │   └── (service files)
│   │
│   ├── process/                # Process management
│   │   └── (process handlers)
│   │
│   ├── shared/                 # Shared code
│   │   ├── types/             # TypeScript types
│   │   ├── dto/               # Data Transfer Objects
│   │   └── utils/             # Utility functions
│   │
│   └── renderer/               # Frontend (Renderer process)
│       ├── index.html         # HTML entry point
│       ├── main.ts            # TypeScript entry point
│       ├── style.css          # Main styles
│       ├── assets/            # Static assets (images, fonts, etc.)
│       ├── pages/             # Page components
│       └── components/        # Reusable components
│
├── resources/                  # Application resources
│   └── icon.png               # App icon
│
├── out/                        # Build output (generated)
│   ├── main/                  # Compiled main process
│   ├── preload/               # Compiled preload
│   └── renderer/              # Compiled renderer
│
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript root config
├── tsconfig.node.json         # TS config for Node (main/preload)
├── tsconfig.web.json          # TS config for Web (renderer)
├── electron.vite.config.ts    # Electron Vite configuration
└── electron-builder.yml       # Electron Builder configuration
```

## Penjelasan Struktur

### `/electron`
Berisi semua kode yang berhubungan dengan Electron processes (main & preload).

- **`main/`**: Main process Electron
  - `index.ts`: Entry point, setup app lifecycle
  - `window.ts`: Window creation & management
  - `ipc/`: Semua IPC handlers terorganisir per domain

- **`preload/`**: Bridge antara main dan renderer process

### `/src`
Berisi business logic dan application code.

- **`database/`**: Database setup, migrations, dan connection management
- **`repositories/`**: Data access patterns (Repository pattern)
- **`services/`**: Business logic (Service layer)
- **`process/`**: Process spawning dan management
- **`shared/`**: Kode yang dipakai bersama di berbagai layer
  - `types/`: TypeScript interfaces & types
  - `dto/`: Data Transfer Objects untuk komunikasi antar layer
  - `utils/`: Helper functions

- **`renderer/`**: Frontend application
  - `pages/`: Halaman-halaman aplikasi
  - `components/`: Reusable UI components
  - `assets/`: Static files (images, CSS, SVG, dll.)

## Command Development

```bash
# Development mode
pnpm dev

# Type checking
pnpm typecheck           # Check all
pnpm typecheck:node      # Check main/preload
pnpm typecheck:web       # Check renderer

# Build
pnpm build               # Build all
pnpm build:win           # Build for Windows
pnpm build:mac           # Build for macOS
pnpm build:linux         # Build for Linux

# Formatting & Linting
pnpm format              # Format code with Prettier
pnpm lint                # Lint code with ESLint
```

## Import Paths

### Main Process
```typescript
// Window management
import { createWindow } from './window'

// IPC handlers
import { setupIpcHandlers } from './ipc'
import { setupProjectIpc } from './ipc/project.ipc'

// Database
import { initDatabase } from '../../src/database/db'

// Services
import { ProjectService } from '../../src/services/project.service'
```

### Renderer
```typescript
// Components
import Button from './components/Button'

// Pages
import HomePage from './pages/Home'

// Utilities
import { formatDate } from '../shared/utils/date'

// Types
import type { Project } from '../shared/types/project'
```

## Best Practices

1. **Separation of Concerns**: Main process, preload, dan renderer terpisah jelas
2. **IPC Organization**: Setiap domain IPC punya file sendiri
3. **Type Safety**: Gunakan TypeScript types dari `shared/types`
4. **Data Flow**: Renderer → IPC → Service → Repository → Database
5. **Reusability**: Shared code di `/src/shared`
6. **Testing**: Test files sejajar dengan file yang ditest

## Migration dari Struktur Lama

Jika ada file di struktur lama (`src/main`, `src/preload`), file tersebut sudah dipindahkan ke struktur baru. Lihat `REFACTORING_LOG.md` untuk detail lengkap.
