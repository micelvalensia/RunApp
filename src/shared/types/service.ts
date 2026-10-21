import { Command } from "./command";


export interface Service {
  id: number;
  project_id: number;
  name: string;
  working_directory: string;
  executable: string;
  arguments: string;
  auto_start: number;
  status: string;
  running_command?: string | null;
  terminal_shell?: string | null;
  created_at: string;
  updated_at: string;
  commands: Command[]
}

export interface CreateServiceDto {
  project_id: number;
  name: string;
  working_directory: string;
  executable: string;
  arguments: string;
  auto_start: number;
  status: string;
  running_command?: string | null;
  terminal_shell?: string | null;
}

export interface UpdateServiceDto {
  project_id?: number;
  name?: string;
  working_directory?: string;
  executable?: string;
  arguments?: string;
  auto_start?: number;
  status?: string;
  running_command?: string | null;
  terminal_shell?: string | null;
}