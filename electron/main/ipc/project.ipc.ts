import { ipcMain } from "electron";
import projectServiceModule from "../../../src/services/project-service";

export function registerProjectIpc() {
    const projectService = projectServiceModule.getInstance();

    ipcMain.handle("project::getAll", () => {
        return projectService.getAll()
    })

    ipcMain.handle("project:getById", (_, id: number) => {
        return projectService.getById(id);
    });

    ipcMain.handle("project:create", (_, data) => {
        return projectService.create(data);
    });

    ipcMain.handle("project:update", (_, id: number, data: any) => {
        return projectService.update(id, data);
    });

    ipcMain.handle("project:delete", (_, id: number) => {
        return projectService.delete(id);
    });
}
