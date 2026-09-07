import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  project: {
    getAll: () => ipcRenderer.invoke('project::getAll'),
    getById: (id: number) => ipcRenderer.invoke('project:getById', id),
    create: (data: any) => ipcRenderer.invoke('project:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('project:delete', id)
  },
  services: {
    getAll: (project_id: number) => ipcRenderer.invoke("services::getAll", project_id),
    getById: (id: number) => ipcRenderer.invoke("services::getById", id),
    create: (data: any) => ipcRenderer.invoke("services::create", data),
    update: (id: number, data: any) => ipcRenderer.invoke("services::update", id, data),
    delete: (id: number) => ipcRenderer.invoke("services::destroy", id)
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory')
  },
  command: {
    findAll: () => ipcRenderer.invoke("command::findAll"),
    findByServiceId: (service_id: number) => ipcRenderer.invoke("command::findByServiceId", service_id),
    findById: (id: number) => ipcRenderer.invoke("command::findById", id),
    create: (data: any) => ipcRenderer.invoke("command::create", data),
    update: (id: number, data: any) => ipcRenderer.invoke("command::update", id, data),
    delete: (id: number) => ipcRenderer.invoke("command::delete", id)
  },
  terminal: {
    create: (serviceId: number, workingDirectory: string): Promise<void> =>
      ipcRenderer.invoke("terminal:create", serviceId, workingDirectory),

    isRunning: (serviceId: number): Promise<boolean> =>
      ipcRenderer.invoke("terminal:isRunning", serviceId),

    write: (serviceId: number, data: string): void => {
      ipcRenderer.send("terminal:write", serviceId, data);
    },

    resize: (serviceId: number, cols: number, rows: number): void => {
      ipcRenderer.send("terminal:resize", serviceId, cols, rows);
    },

    onData: (callback: (serviceId: number, data: string) => void): void => {
      ipcRenderer.on("terminal:data", (_, serviceId: number, data: string) => {
        callback(serviceId, data);
      });
    },

    onExit: (callback: (serviceId: number, exitCode: number) => void): void => {
      ipcRenderer.on("terminal:exit", (_, serviceId: number, exitCode: number) => {
        callback(serviceId, exitCode);
      });
    },

    onStatusChange: (callback: (serviceId: number, status: 'running' | 'stopped') => void): void => {
      ipcRenderer.on("terminal:status-change", (_, serviceId: number, status: 'running' | 'stopped') => {
        callback(serviceId, status);
      });
    },

    destroy: (serviceId: number): void => {
      ipcRenderer.send("terminal:destroy", serviceId);
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
