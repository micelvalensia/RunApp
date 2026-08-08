import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const xtermInstances = new Map<number, Terminal>();
const terminalContainers = new Map<number, HTMLDivElement>();

// Setup listener untuk data dari PTY
window.api.terminal.onData((serviceId: number, data: string) => {
    const terminal = xtermInstances.get(serviceId);
    if (terminal) {
        terminal.write(data);
    }
});

/**
 * Render/tampilkan terminal untuk service tertentu
 * - Buat XTerm instance jika belum ada
 * - Switch visibility ke terminal yang dipilih
 * - Jangan destroy terminal yang lama
 */
export function renderTerminal(serviceId: number): void {
    const output = document.getElementById("terminal-output");
    if (!output) return;

    // Hapus placeholder jika ada
    const placeholder = output.querySelector(".terminal-placeholder");
    if (placeholder) {
        placeholder.remove();
    }

    // Hide semua terminal container
    terminalContainers.forEach((container) => {
        container.style.display = "none";
    });

    let terminalContainer = terminalContainers.get(serviceId);

    // Buat container khusus untuk service ini jika belum ada
    if (!terminalContainer) {
        terminalContainer = document.createElement("div");
        terminalContainer.className = "terminal-container";
        terminalContainer.dataset.serviceId = String(serviceId);
        terminalContainer.style.width = "100%";
        terminalContainer.style.height = "100%";

        output.appendChild(terminalContainer);
        terminalContainers.set(serviceId, terminalContainer);
    }

    // Tampilkan container service ini
    terminalContainer.style.display = "block";

    let terminal = xtermInstances.get(serviceId);

    // Buat XTerm instance jika belum ada
    if (!terminal) {
        terminal = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: "#1e1e1e",
                foreground: "#d4d4d4",
            },
            convertEol: true,
        });

        terminal.open(terminalContainer);

        // Forward input user ke PTY
        terminal.onData((data: string) => {
            window.api.terminal.write(serviceId, data);
        });

        xtermInstances.set(serviceId, terminal);
    }

    terminal.focus();
}

/**
 * Tutup dan destroy terminal untuk service tertentu
 */
export function closeTerminal(serviceId: number): void {
    const terminal = xtermInstances.get(serviceId);
    const container = terminalContainers.get(serviceId);

    if (terminal) {
        terminal.dispose();
        xtermInstances.delete(serviceId);
    }

    if (container) {
        container.remove();
        terminalContainers.delete(serviceId);
    }

    // Beritahu main process untuk kill PTY
    window.api.terminal.destroy(serviceId);
}

/**
 * Cek apakah terminal sudah ada untuk service tertentu
 */
export function hasTerminal(serviceId: number): boolean {
    return xtermInstances.has(serviceId);
}

/**
 * Get semua service IDs yang memiliki terminal aktif
 */
export function getActiveTerminalIds(): number[] {
    return Array.from(xtermInstances.keys());
}