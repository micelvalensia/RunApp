export interface Project {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  icon?: string;
}