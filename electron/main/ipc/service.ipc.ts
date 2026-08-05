import { ipcMain } from "electron";
import servicesServiceModule from "../../../src/services/services-service";

export function registerServiceIpc() {
    const servicesService = servicesServiceModule.getInstance();

    ipcMain.handle("services::getAll", (_, project_id: number) => {
        return servicesService.getAll(project_id)
    })

    ipcMain.handle("services::getById", (_, id: number) => {
        return servicesService.getById(id)
    })

    ipcMain.handle("services::create", (_, data) => {
        return servicesService.create(data)
    })

    ipcMain.handle("services::update", (_, id: number, data: any) => {
        return servicesService.update(id, data)
    })

    ipcMain.handle("services::destroy", (_, id: number) => {
        return servicesService.delete(id)
    })
}
