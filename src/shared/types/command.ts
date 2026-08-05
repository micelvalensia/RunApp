export interface Command {
    id: number;
    service_id: number;
    name: string;
    executable: string;
    arguments: string;
    created_at: string;
}

export interface CreateCommandDto {
    service_id: number;
    name: string;
    executable: string;
    arguments: string;
}

export interface UpdateCommandDto {
    service_id?: number;
    name?: string;
    executable?: string;
    arguments?: string;
}