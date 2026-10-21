import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

/**
 * Setup and initialize auto-updater safely
 */
export function setupAutoUpdater(): void {
  // Only run updater in packaged production app, never in dev mode
  if (!app.isPackaged) {
    return;
  }

  // Automatic download and install preferences
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Application is up to date.');
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `A new version (v${info.version}) has been downloaded. Restart the application now to apply the update?`,
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      })
      .catch((err) => {
        console.error('[AutoUpdater] Dialog error:', err);
      });
  });

  autoUpdater.on('error', (err) => {
    // Log error gracefully without disrupting the user
    console.log('[AutoUpdater] Check/download skipped or failed:', err.message);
  });

  // Check for updates gracefully
  try {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.log('[AutoUpdater] Check for updates skipped:', err.message);
    });
  } catch (err) {
    console.log('[AutoUpdater] Initialization check failed:', err);
  }
}
