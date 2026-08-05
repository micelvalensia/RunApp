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
