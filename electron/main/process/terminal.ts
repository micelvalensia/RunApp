import * as pty from "@lydell/node-pty";
import os from "node:os";

export function createTerminal(cwd: string) {
    const shell =
        os.platform() === "win32"
            ? "powershell.exe"
            : "bash";

    return pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 120,
        rows: 30,
        cwd: cwd || os.homedir(),
        env: process.env as Record<string, string>,
    });
}