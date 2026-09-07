import * as pty from "@lydell/node-pty";
import os from "node:os";
import fs from "node:fs";
import { exec } from "node:child_process";

export function createTerminal(cwd: string) {
    const shell =
        os.platform() === "win32"
            ? "cmd.exe"
            : "bash";

    return pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 120,
        rows: 30,
        cwd: cwd || os.homedir(),
        env: process.env as Record<string, string>,
    });
}

export function hasChildProcesses(pid: number): Promise<boolean> {
    return new Promise((resolve) => {
        if (!pid) return resolve(false);

        const platform = os.platform();
        if (platform === "linux") {
            try {
                const childrenPath = `/proc/${pid}/task/${pid}/children`;
                if (fs.existsSync(childrenPath)) {
                    const content = fs.readFileSync(childrenPath, "utf8").trim();
                    return resolve(content.length > 0);
                }
            } catch {
                // fallback to pgrep
            }
            exec(`pgrep -P ${pid}`, (err, stdout) => {
                resolve(!err && stdout.trim().length > 0);
            });
        } else if (platform === "darwin") {
            exec(`pgrep -P ${pid}`, (err, stdout) => {
                resolve(!err && stdout.trim().length > 0);
            });
        } else if (platform === "win32") {
            exec(`wmic process where (ParentProcessId=${pid}) get ProcessId`, (err, stdout) => {
                if (err) return resolve(false);
                const lines = stdout.trim().split("\n").filter((l) => l.trim() && !l.includes("ProcessId"));
                resolve(lines.length > 0);
            });
        } else {
            resolve(false);
        }
    });
}