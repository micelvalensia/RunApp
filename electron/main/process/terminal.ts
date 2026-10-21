import * as pty from "@lydell/node-pty";
import os from "node:os";
import fs from "node:fs";
import { exec } from "node:child_process";

export function resolveShell(preferredShell?: string): { shell: string; args: string[] } {
    const platform = os.platform();
    const pref = (preferredShell || "").toLowerCase().trim();

    if (platform === "win32") {
        if (pref === "bash") {
            const gitBashPaths = [
                "C:\\Program Files\\Git\\bin\\bash.exe",
                "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
                `${process.env.LOCALAPPDATA}\\Programs\\Git\\bin\\bash.exe`
            ];
            for (const p of gitBashPaths) {
                if (fs.existsSync(p)) return { shell: p, args: ["--login"] };
            }
            return { shell: "bash.exe", args: [] };
        }
        if (pref === "powershell") {
            return { shell: "powershell.exe", args: [] };
        }
        // Default on Windows is cmd.exe
        return { shell: process.env.COMSPEC || "cmd.exe", args: [] };
    } else {
        // Linux / macOS
        if (pref === "cmd") {
            if (fs.existsSync("/usr/bin/cmd")) {
                return { shell: "/usr/bin/cmd", args: [] };
            }
            // Fallback to bash if cmd is not on this Linux machine
            return { shell: process.env.SHELL || "bash", args: [] };
        }
        if (pref === "sh") {
            return { shell: "/bin/sh", args: [] };
        }
        if (pref === "zsh") {
            const zshPath = fs.existsSync("/bin/zsh") ? "/bin/zsh" : (fs.existsSync("/usr/bin/zsh") ? "/usr/bin/zsh" : "zsh");
            return { shell: zshPath, args: [] };
        }
        if (pref === "powershell" || pref === "pwsh") {
            if (fs.existsSync("/usr/bin/pwsh")) return { shell: "/usr/bin/pwsh", args: [] };
            if (fs.existsSync("/usr/bin/powershell")) return { shell: "/usr/bin/powershell", args: [] };
        }
        return { shell: process.env.SHELL || "bash", args: [] };
    }
}

export function createTerminal(cwd: string, preferredShell?: string) {
    const { shell, args } = resolveShell(preferredShell);

    return pty.spawn(shell, args, {
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
                if (!err && stdout && stdout.includes("ProcessId")) {
                    const lines = stdout.trim().split("\n").filter((l) => l.trim() && !l.includes("ProcessId"));
                    return resolve(lines.length > 0);
                }
                // Fallback for Windows 11 where WMIC is deprecated/removed
                exec(
                    `powershell -NoProfile -NonInteractive -Command "if (@(Get-CimInstance Win32_Process -Filter 'ParentProcessId = ${pid}').Count -gt 0) { exit 0 } else { exit 1 }"`,
                    (psErr) => {
                        resolve(!psErr);
                    }
                );
            });
        } else {
            resolve(false);
        }
    });
}