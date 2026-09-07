import { ipcMain, BrowserWindow } from "electron";
import { createTerminal, hasChildProcesses } from "../process/terminal.js";

const terminals = new Map<number, ReturnType<typeof createTerminal>>();
const activeJobStatus = new Map<number, boolean>();
let statusCheckInterval: NodeJS.Timeout | null = null;
let lastWebContents: Electron.WebContents | null = null;

let isCleaningUp = false;

function safeSend(sender: Electron.WebContents | null, channel: string, ...args: any[]) {
    try {
        if (sender && !sender.isDestroyed()) {
            const window = BrowserWindow.fromWebContents(sender);
            if (window && !window.isDestroyed()) {
                sender.send(channel, ...args);
            }
        }
    } catch {
        // Window already closed/destroyed - ignore safely
    }
}

function checkAllTerminalsStatus() {
    if (isCleaningUp || terminals.size === 0 || !lastWebContents || lastWebContents.isDestroyed()) {
        return;
    }

    terminals.forEach(async (terminal, serviceId) => {
        try {
            const isJobActive = await hasChildProcesses(terminal.pid);
            const prevStatus = activeJobStatus.get(serviceId);

            if (prevStatus !== isJobActive) {
                activeJobStatus.set(serviceId, isJobActive);
                safeSend(lastWebContents, "terminal:status-change", serviceId, isJobActive ? "running" : "stopped");
            }
        } catch (err) {
            console.error(`Error checking status for service ${serviceId}:`, err);
        }
    });
}

function startStatusMonitoring(webContents: Electron.WebContents) {
    lastWebContents = webContents;
    if (!statusCheckInterval) {
        statusCheckInterval = setInterval(checkAllTerminalsStatus, 700);
    }
}

export function registerTerminalIPC() {
    ipcMain.handle(
        "terminal:create",
        (event, serviceId: number, workingDirectory: string) => {
            startStatusMonitoring(event.sender);

            // Jangan buat PTY baru jika sudah ada
            if (terminals.has(serviceId)) {
                return;
            }

            const terminal = createTerminal(workingDirectory);
            terminals.set(serviceId, terminal);
            activeJobStatus.set(serviceId, false);

            // Kirim data dengan serviceId
            terminal.onData((data: string) => {
                if (isCleaningUp) return;
                safeSend(event.sender, "terminal:data", serviceId, data);
            });

            terminal.onExit(({ exitCode }) => {
                terminals.delete(serviceId);
                activeJobStatus.delete(serviceId);
                if (isCleaningUp) return;
                safeSend(event.sender, "terminal:exit", serviceId, exitCode);
                safeSend(event.sender, "terminal:status-change", serviceId, "stopped");
            });
        }
    );

    ipcMain.handle("terminal:isRunning", async (_, serviceId: number) => {
        const terminal = terminals.get(serviceId);
        if (!terminal) return false;
        return await hasChildProcesses(terminal.pid);
    });

    ipcMain.on(
        "terminal:write",
        (event, serviceId: number, data: string) => {
            const terminal = terminals.get(serviceId);
            if (terminal) {
                terminal.write(data);
                startStatusMonitoring(event.sender);

                // If Ctrl+C is sent, perform a quick status check
                if (data.includes("\x03")) {
                    setTimeout(checkAllTerminalsStatus, 150);
                }
            }
        }
    );

    ipcMain.on(
        "terminal:resize",
        (_, serviceId: number, cols: number, rows: number) => {
            const terminal = terminals.get(serviceId);
            if (terminal && cols > 0 && rows > 0) {
                try {
                    terminal.resize(cols, rows);
                } catch (err) {
                    console.error(`Error resizing terminal ${serviceId}:`, err);
                }
            }
        }
    );

    // Cleanup terminal saat ditutup
    ipcMain.on(
        "terminal:destroy",
        (_, serviceId: number) => {
            const terminal = terminals.get(serviceId);
            if (terminal) {
                try {
                    terminal.kill();
                } catch {
                    // ignore
                }
                terminals.delete(serviceId);
                activeJobStatus.delete(serviceId);
            }
        }
    );
}

// Cleanup all terminals (dipanggil saat app quit)
export function cleanupAllTerminals() {
    if (isCleaningUp) return;
    isCleaningUp = true;

    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
    lastWebContents = null;

    console.log(`Cleaning up ${terminals.size} active terminals...`);
    terminals.forEach((terminal, serviceId) => {
        try {
            console.log(`Killing terminal for service ${serviceId}`);
            terminal.kill();
        } catch {
            // ignore if already killed
        }
    });
    terminals.clear();
    activeJobStatus.clear();
    console.log('All terminals cleaned up');
    isCleaningUp = false;
}