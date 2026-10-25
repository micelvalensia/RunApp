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

let wmicAvailable: boolean | null = null;

export function checkChildProcessesBatch(pids: number[]): Promise<Map<number, boolean>> {
    return new Promise((resolve) => {
        const resultMap = new Map<number, boolean>();
        const validPids = pids.filter((p) => typeof p === "number" && p > 0);

        if (validPids.length === 0) {
            return resolve(resultMap);
        }

        const platform = os.platform();

        if (platform === "linux") {
            const remainingPids: number[] = [];

            for (const pid of validPids) {
                try {
                    const childrenPath = `/proc/${pid}/task/${pid}/children`;
                    if (fs.existsSync(childrenPath)) {
                        const content = fs.readFileSync(childrenPath, "utf8").trim();
                        resultMap.set(pid, content.length > 0);
                        continue;
                    }
                } catch {
                    // fallback to pgrep
                }
                remainingPids.push(pid);
            }

            if (remainingPids.length === 0) {
                return resolve(resultMap);
            }

            let pending = remainingPids.length;
            for (const pid of remainingPids) {
                exec(`pgrep -P ${pid}`, (err, stdout) => {
                    resultMap.set(pid, !err && stdout.trim().length > 0);
                    pending--;
                    if (pending === 0) resolve(resultMap);
                });
            }
        } else if (platform === "darwin") {
            let pending = validPids.length;
            for (const pid of validPids) {
                exec(`pgrep -P ${pid}`, (err, stdout) => {
                    resultMap.set(pid, !err && stdout.trim().length > 0);
                    pending--;
                    if (pending === 0) resolve(resultMap);
                });
            }
        } else if (platform === "win32") {
            const queryViaPowershell = () => {
                const filterParts = validPids.map((pid) => `ParentProcessId = ${pid}`).join(" or ");
                const psCommand = `powershell -NoProfile -NonInteractive -WindowStyle Hidden -Command "@(Get-CimInstance Win32_Process -Filter '(${filterParts}) and Name != ''conhost.exe'' and Name != ''openconsole.exe''').ParentProcessId"`;

                exec(psCommand, { windowsHide: true }, (err, stdout) => {
                    if (err || !stdout) {
                        for (const pid of validPids) {
                            resultMap.set(pid, false);
                        }
                        return resolve(resultMap);
                    }

                    const activeParents = new Set(
                        stdout
                            .split(/\r?\n/)
                            .map((line) => parseInt(line.trim(), 10))
                            .filter((n) => !isNaN(n) && n > 0)
                    );

                    for (const pid of validPids) {
                        resultMap.set(pid, activeParents.has(pid));
                    }
                    resolve(resultMap);
                });
            };

            if (wmicAvailable === false) {
                queryViaPowershell();
            } else {
                const wmicFilter = validPids.map((pid) => `ParentProcessId=${pid}`).join(" or ");
                exec(
                    `wmic process where ((${wmicFilter}) and Name!='conhost.exe' and Name!='openconsole.exe') get ParentProcessId,ProcessId`,
                    { windowsHide: true },
                    (err, stdout) => {
                        if (!err && stdout && stdout.includes("ProcessId")) {
                            wmicAvailable = true;
                            const lines = stdout.trim().split("\n").filter((l) => l.trim() && !l.includes("ProcessId") && !l.includes("ParentProcessId"));
                            const activeParents = new Set<number>();
                            for (const line of lines) {
                                const parts = line.trim().split(/\s+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
                                if (parts.length >= 1) {
                                    activeParents.add(parts[0]);
                                }
                            }
                            for (const pid of validPids) {
                                resultMap.set(pid, activeParents.has(pid));
                            }
                            return resolve(resultMap);
                        }

                        // WMIC failed (e.g. Windows 11 where WMIC is deprecated/removed)
                        wmicAvailable = false;
                        queryViaPowershell();
                    }
                );
            }
        } else {
            for (const pid of validPids) {
                resultMap.set(pid, false);
            }
            resolve(resultMap);
        }
    });
}

export async function hasChildProcesses(pid: number): Promise<boolean> {
    if (!pid || pid <= 0) return false;
    const batch = await checkChildProcessesBatch([pid]);
    return batch.get(pid) ?? false;
}