import { ipcMain } from "electron";
import commandService from "../../../src/services/command-service";
import { CreateCommandDto, UpdateCommandDto } from "../../../src/shared/types/command";

export function registerCommandIpc() {
    const command = commandService.getInstance()

    ipcMain.handle("command::findAll", () => {
        return command.findAll()
    })

    ipcMain.handle("command::findByServiceId", (_, service_id: number) => {
        return command.findByServiceId(service_id)
    })

    ipcMain.handle("command::findById", (_, id: number) => {
        return command.findById(id)
    })

    ipcMain.handle("command::create", (_, data: CreateCommandDto) => {
        return command.create(data)
    })

    ipcMain.handle("command::update", (_, id: number, data: UpdateCommandDto) => {
        return command.update(id, data)
    })

    ipcMain.handle("command::delete", (_, id: number) => {
        return command.delete(id)
    })
}