import { ipcMain } from 'electron'
import { registerProjectIpc } from './project.ipc'
import { registerServiceIpc } from './service.ipc'
import { registerDialogIpc } from './dialog.ipc'
import { registerCommandIpc } from './command.ipc'
import { registerTerminalIPC, cleanupAllTerminals } from './terminal-ipc'

export function setupIpcHandlers(): void {
  registerProjectIpc()
  registerServiceIpc()
  registerCommandIpc()
  registerDialogIpc()
  registerTerminalIPC()
  ipcMain.on('ping', () => console.log('pong'))
}

export { cleanupAllTerminals }
