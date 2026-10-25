import { ipcMain, BrowserWindow } from "electron";
import os from "node:os";
import fs from "node:fs";
import { createTerminal, checkChildProcessesBatch, hasChildProcesses } from "../process/terminal.js";

const terminals = new Map<number, ReturnType<typeof createTerminal>>();
const activeJobStatus = new Map<number, boolean>();
let statusCheckTimeout: NodeJS.Timeout | null = null;
let lastWebContents: Electron.WebContents | null = null;
let isCheckingStatus = false;

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

async function checkAllTerminalsStatus() {
    if (isCheckingStatus || isCleaningUp || terminals.size === 0 || !lastWebContents || lastWebContents.isDestroyed()) {
        return;
    }

    isCheckingStatus = true;
    try {
        const terminalEntries = Array.from(terminals.entries());
        const pids = terminalEntries.map(([_, term]) => term.pid);
        const childStatusMap = await checkChildProcessesBatch(pids);

        for (const [serviceId, terminal] of terminalEntries) {
            const isJobActive = childStatusMap.get(terminal.pid) ?? false;
            const prevStatus = activeJobStatus.get(serviceId);

            if (prevStatus !== isJobActive) {
                activeJobStatus.set(serviceId, isJobActive);
                safeSend(lastWebContents, "terminal:status-change", serviceId, isJobActive ? "running" : "stopped");
            }
        }
    } catch (err) {
        console.error("Error checking terminal statuses:", err);
    } finally {
        isCheckingStatus = false;
    }
}

function scheduleNextStatusCheck(delayMs = 2000) {
    if (isCleaningUp || terminals.size === 0 || !lastWebContents || lastWebContents.isDestroyed()) {
        return;
    }

    if (statusCheckTimeout) {
        clearTimeout(statusCheckTimeout);
        statusCheckTimeout = null;
    }

    statusCheckTimeout = setTimeout(async () => {
        await checkAllTerminalsStatus();
        if (!isCleaningUp && terminals.size > 0) {
            const anyActive = Array.from(activeJobStatus.values()).some(Boolean);
            scheduleNextStatusCheck(anyActive ? 1500 : 3000);
        }
    }, delayMs);
}

function startStatusMonitoring(webContents: Electron.WebContents) {
    lastWebContents = webContents;
    if (!statusCheckTimeout) {
        scheduleNextStatusCheck(500);
    }
}

export function registerTerminalIPC() {
    ipcMain.handle(
        "terminal:create",
        (event, serviceId: number, workingDirectory: string, shell?: string) => {
            // Jangan buat PTY baru jika sudah ada
            if (terminals.has(serviceId)) {
                return;
            }

            const terminal = createTerminal(workingDirectory, shell);
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
                if (terminals.size === 0 && statusCheckTimeout) {
                    clearTimeout(statusCheckTimeout);
                    statusCheckTimeout = null;
                }
                if (isCleaningUp) return;
                safeSend(event.sender, "terminal:exit", serviceId, exitCode);
                safeSend(event.sender, "terminal:status-change", serviceId, "stopped");
            });

            // Notice if user selected cmd on a non-Windows machine without cmd
            if (os.platform() !== "win32" && shell === "cmd" && !fs.existsSync("/usr/bin/cmd")) {
                setTimeout(() => {
                    safeSend(
                        event.sender,
                        "terminal:data",
                        serviceId,
                        "\r\n\x1b[33m[Runner] Note: 'cmd' is a Windows shell. Using default shell (bash) on Linux/macOS.\x1b[0m\r\n\r\n"
                    );
                }, 100);
            }
        }
    );

    ipcMain.handle("terminal:isRunning", async (_, serviceId: number) => {
        const terminal = terminals.get(serviceId);
        if (!terminal) return false;
        return await hasChildProcesses(terminal.pid);
    });

    ipcMain.handle("terminal:hasTerminal", (_, serviceId: number) => {
        return terminals.has(serviceId);
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
                    scheduleNextStatusCheck(150);
                } else if (data.includes("\r") || data.includes("\n")) {
                    scheduleNextStatusCheck(600);
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
                if (terminals.size === 0 && statusCheckTimeout) {
                    clearTimeout(statusCheckTimeout);
                    statusCheckTimeout = null;
                }
            }
        }
    );
}

// Cleanup all terminals (dipanggil saat app quit)
export function cleanupAllTerminals() {
    if (isCleaningUp) return;
    isCleaningUp = true;

    if (statusCheckTimeout) {
        clearTimeout(statusCheckTimeout);
        statusCheckTimeout = null;
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