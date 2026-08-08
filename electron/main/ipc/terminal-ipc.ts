import { ipcMain, BrowserWindow } from "electron";
import { createTerminal } from "../process/terminal.js";

const terminals = new Map<number, ReturnType<typeof createTerminal>>();

export function registerTerminalIPC() {
    ipcMain.handle(
        "terminal:create",
        (event, serviceId: number, workingDirectory: string) => {
            // Jangan buat PTY baru jika sudah ada
            if (terminals.has(serviceId)) {
                return;
            }

            const terminal = createTerminal(workingDirectory);
            terminals.set(serviceId, terminal);

            // Kirim data dengan serviceId
            terminal.onData((data: string) => {
                const window = BrowserWindow.fromWebContents(event.sender);
                if (window && !window.isDestroyed()) {
                    event.sender.send("terminal:data", serviceId, data);
                }
            });
        }
    );

    ipcMain.on(
        "terminal:write",
        (_, serviceId: number, data: string) => {
            const terminal = terminals.get(serviceId);
            if (terminal) {
                terminal.write(data);
            }
        }
    );

    // Cleanup terminal saat ditutup
    ipcMain.on(
        "terminal:destroy",
        (_, serviceId: number) => {
            const terminal = terminals.get(serviceId);
            if (terminal) {
                terminal.kill();
                terminals.delete(serviceId);
            }
        }
    );
}

// Cleanup all terminals (dipanggil saat app quit)
export function cleanupAllTerminals() {
    console.log(`Cleaning up ${terminals.size} active terminals...`);
    terminals.forEach((terminal, serviceId) => {
        console.log(`Killing terminal for service ${serviceId}`);
        terminal.kill();
    });
    terminals.clear();
    console.log('All terminals cleaned up');
}