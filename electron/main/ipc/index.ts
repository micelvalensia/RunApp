import { ipcMain } from 'electron'
import { registerProjectIpc } from './project.ipc'
import { registerServiceIpc } from './service.ipc'
import { registerDialogIpc } from './dialog.ipc'
import { registerCommandIpc } from './command.ipc'

export function setupIpcHandlers(): void {
  registerProjectIpc()
  registerServiceIpc()
  registerCommandIpc()
  registerDialogIpc()
  ipcMain.on('ping', () => console.log('pong'))
}
