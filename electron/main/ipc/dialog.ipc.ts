import { ipcMain, dialog, BrowserWindow } from 'electron';

export function registerDialogIpc() {
    ipcMain.handle('dialog:openDirectory', async () => {
        const window = BrowserWindow.getFocusedWindow();
        if (!window) return null;

        const result = await dialog.showOpenDialog(window, {
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Working Directory'
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });
}
