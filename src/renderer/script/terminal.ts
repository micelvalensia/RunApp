import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const xtermInstances = new Map<number, Terminal>();
const fitAddons = new Map<number, FitAddon>();
const terminalContainers = new Map<number, HTMLDivElement>();
let resizeObserver: ResizeObserver | null = null;

// Setup listener untuk data dari PTY
window.api.terminal.onData((serviceId: number, data: string) => {
    const terminal = xtermInstances.get(serviceId);
    if (terminal) {
        terminal.write(data);
    }
});

function initResizeObserver(): void {
    const output = document.getElementById("terminal-output");
    if (output && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
            terminalContainers.forEach((container, serviceId) => {
                if (container.style.display !== "none") {
                    fitTerminal(serviceId);
                }
            });
        });
        resizeObserver.observe(output);
    }
}

/**
 * Fit terminal dimensions to its container and notify PTY
 */
export function fitTerminal(serviceId?: number | null): void {
    if (serviceId === null || serviceId === undefined) return;

    const fitAddon = fitAddons.get(serviceId);
    const terminal = xtermInstances.get(serviceId);
    const container = terminalContainers.get(serviceId);

    if (fitAddon && terminal && container && container.style.display !== "none") {
        try {
            fitAddon.fit();
            if (terminal.cols > 0 && terminal.rows > 0) {
                window.api.terminal.resize(serviceId, terminal.cols, terminal.rows);
            }
        } catch (err) {
            console.error("Error fitting terminal:", err);
        }
    }
}

/**
 * Clear the active terminal buffer
 */
export function clearTerminal(serviceId?: number | null): void {
    if (serviceId === null || serviceId === undefined) return;
    const terminal = xtermInstances.get(serviceId);
    if (terminal) {
        terminal.clear();
    }
}

/**
 * Render/tampilkan terminal untuk service tertentu
 */
export function renderTerminal(serviceId: number): void {
    const output = document.getElementById("terminal-output");
    if (!output) return;

    initResizeObserver();

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
            fontSize: 13,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: "#16161e",
                foreground: "#c0caf5",
                cursor: "#7aa2f7",
                selectionBackground: "rgba(122, 162, 247, 0.3)",
            },
            convertEol: true,
            scrollback: 10000,
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        fitAddons.set(serviceId, fitAddon);

        terminal.open(terminalContainer);

        // Forward input user ke PTY
        terminal.onData((data: string) => {
            window.api.terminal.write(serviceId, data);
        });

        xtermInstances.set(serviceId, terminal);
    }

    // Fit & focus
    setTimeout(() => {
        fitTerminal(serviceId);
        terminal?.focus();
    }, 20);
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

    fitAddons.delete(serviceId);

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