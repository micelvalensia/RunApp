import type { Project } from '../../shared/types/project';
import {
    currentProject,
    projects,
    setCurrentProject,
    setProjects
} from './state';
import {
    projectsList,
    emptyState,
    projectDetail,
    projectName,
    projectDescription
} from './dom';
import { escapeHtml } from './dom';
import { loadServices } from './services';

// Load projects from database
export async function loadProjects(): Promise<void> {
    try {
        const loadedProjects = await window.api.project.getAll();
        console.log('Projects loaded:', loadedProjects);
        setProjects(loadedProjects);
        renderProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Render projects list
export function renderProjects(): void {
    projectsList.innerHTML = '';

    if (projects.length === 0) {
        projectsList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No projects yet</div>';
        return;
    }

    projects.forEach((project) => {
        const item = document.createElement('div');
        item.className = 'project-item';
        if (currentProject?.id === project.id) {
            item.classList.add('active');
        }

        item.innerHTML = `
      <div class="project-icon">${project.icon || '📁'}</div>
      <div class="project-item-content">
        <div class="project-item-name">${escapeHtml(project.name)}</div>
        ${project.description ? `<div class="project-item-desc">${escapeHtml(project.description)}</div>` : ''}
      </div>
    `;

        item.addEventListener('click', () => selectProject(project));
        projectsList.appendChild(item);
    });
}

// Select a project
export function selectProject(project: Project): void {
    setCurrentProject(project);
    renderProjects();
    showProjectDetail();
}

// Show project detail view
export function showProjectDetail(): void {
    if (!currentProject) {
        emptyState.style.display = 'flex';
        projectDetail.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    projectDetail.style.display = 'flex';

    projectName.textContent = currentProject.name;
    projectDescription.textContent = currentProject.description || 'No description';

    loadServices();
}
