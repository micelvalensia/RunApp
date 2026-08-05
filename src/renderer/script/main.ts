import type { Project } from '../../shared/types/project';
import type { Service } from '../../shared/types/service';
import type { Command } from '../../shared/types/command';

// State
let currentProject: Project | null = null;
let projects: Project[] = [];
let services: Service[] = [];
let commands: Map<number, Command[]> = new Map(); // Commands per service
let activeTerminalId: number | null = null; // Track active terminal
let terminals: Map<number, string[]> = new Map(); // Store terminal outputs per service
let currentServiceId: number | null = null; // Track current service for command modal

// DOM Elements
const projectsList = document.getElementById('projects-list')!;
const emptyState = document.getElementById('empty-state')!;
const projectDetail = document.getElementById('project-detail')!;
const projectName = document.getElementById('project-name')!;
const projectDescription = document.getElementById('project-description')!;
const servicesList = document.getElementById('services-list')!;
const terminalOutput = document.getElementById('terminal-output')!;
// const terminalTabs = document.getElementById('terminal-tabs')!;

// Modals
const modalProject = document.getElementById('modal-project')!;
const modalService = document.getElementById('modal-service')!;
const modalCommand = document.getElementById('modal-command')!;
const modalProjectTitle = document.getElementById('modal-project-title')!;

// Forms
const formProject = document.getElementById('form-project') as HTMLFormElement;
const formService = document.getElementById('form-service') as HTMLFormElement;
const formCommand = document.getElementById('form-command') as HTMLFormElement;
const inputProjectName = document.getElementById('input-project-name') as HTMLInputElement;
const inputProjectDescription = document.getElementById('input-project-description') as HTMLTextAreaElement;
const inputProjectIcon = document.getElementById('input-project-icon') as HTMLInputElement;

// Service form inputs
const inputServiceName = document.getElementById('input-service-name') as HTMLInputElement;
const inputServiceCwd = document.getElementById('input-service-cwd') as HTMLInputElement;
const inputServiceExecutable = document.getElementById('input-service-executable') as HTMLInputElement;
const inputServiceArguments = document.getElementById('input-service-arguments') as HTMLInputElement;
const inputServiceAutostart = document.getElementById('input-service-autostart') as HTMLInputElement;

// Command form inputs
const inputCommandName = document.getElementById('input-command-name') as HTMLInputElement;
const inputCommandExecutable = document.getElementById('input-command-executable') as HTMLInputElement;
const inputCommandArguments = document.getElementById('input-command-arguments') as HTMLInputElement;
const inputCommandServiceId = document.getElementById('commandServiceId') as HTMLInputElement

// Initialize
function init(): void {
  console.log('Initializing app...');
  loadProjects();
  setupEventListeners();
}

// Load projects from database
async function loadProjects(): Promise<void> {
  try {
    projects = await window.api.project.getAll();
    console.log('Projects loaded:', projects);
    renderProjects();
  } catch (error) {
    console.error('Error loading projects:', error);
    addTerminalLine('Error loading projects', 'error');
  }
}

// Render projects list
function renderProjects(): void {
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
function selectProject(project: Project): void {
  currentProject = project;
  renderProjects();
  showProjectDetail();
}

// Show project detail view
function showProjectDetail(): void {
  if (!currentProject) {
    emptyState.style.display = 'flex';
    projectDetail.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  projectDetail.style.display = 'flex';

  projectName.textContent = currentProject.name;
  projectDescription.textContent = currentProject.description || 'No description';

  addTerminalLine(`Project "${currentProject.name}" loaded`, 'info');
  loadServices();
}

// Load services for current project
async function loadServices(): Promise<void> {
  if (!currentProject) {
    servicesList.innerHTML = '';
    return;
  }

  try {

    if (!window.api.services) {
      throw new Error('Services API not available. Please restart the app.');
    }

    services = await window.api.services.getAll(currentProject.id);
    console.log('Services loaded:', services);
    renderServices();
  } catch (error) {
    console.error('Error loading services:', error);
    addTerminalLine(`Error loading services: ${error}`, 'error');
    servicesList.innerHTML = `
      <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--danger);">
        <p>Error loading services: ${error}</p>
        <p style="font-size: 12px; margin-top: 8px;">Try restarting the app</p>
      </div>
    `;
  }
}

// Render services
async function renderServices(): Promise<void> {
  if (services.length === 0) {
    servicesList.innerHTML = `
      <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; opacity: 0.5;">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <p>No services yet. Click "Add Service" to create one.</p>
      </div>
    `;
    return;
  }

  servicesList.innerHTML = '';

  services.forEach((service) => {
    const card = document.createElement('div');
    card.className = 'service-card';
    if (service.status === 'running') {
      card.classList.add('running');
    }
    if (activeTerminalId === service.id) {
      card.classList.add('active');
    }

    card.innerHTML = `
      <div class="service-card-header">
        <div class="service-info">
          <h4>${escapeHtml(service.name)}</h4>
          <div class="service-path" title="${escapeHtml(service.working_directory)}">${escapeHtml(service.working_directory)}</div>
        </div>
        <div class="service-actions">
          <button class="btn-icon btn-sm" data-action="edit" data-service-id="${service.id}" title="Edit Service">
           ✏️
          </button>
          <button class="btn-icon btn-sm btn-danger" data-action="delete" data-service-id="${service.id}" title="Delete Service">
            🗑️
          </button>
        </div>
      </div>
      <div class="service-status ${service.status === 'running' ? 'running' : ''}">${service.status}</div>
      <div class="service-commands">
        <button class="command-btn" data-action="run" data-service-id="${service.id}">
          ${service.status === 'running' ? '⏸' : '▶'} ${service.executable} ${service.arguments || ''}
        </button>
       ${service.commands.map((com) => `
          <button class="command-btn" data-action="run" data-service-id="${com.id}">
            ${com.executable} ${com.arguments || ''}
            <span class="x-button" data-action="delete-command" data-command-id="${com.id}">&times;</span>
          </button>
        `).join('')
      }
        <button class="command-btn command-btn-add" data-action="add-command" data-service-id="${service.id}">
          + Add Command
        </button>
      </div>
    `;

    // Card click to show terminal
    card.addEventListener('click', (e) => {
      // Ignore if clicking buttons
      if ((e.target as HTMLElement).closest('button')) return;
      switchToTerminal(service.id);
    });

    // Add event listeners for buttons
    const editBtn = card.querySelector('[data-action="edit"]');
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleEditService(service.id);
    });

    const deleteBtn = card.querySelector('[data-action="delete"]');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteService(service.id);
    });

    const addCommandBtn = card.querySelector('[data-action="add-command"]');
    addCommandBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAddCommand(service.id);
    });

    const deleteCommandBtns = card.querySelectorAll(
      '[data-action="delete-command"]'
    );

    deleteCommandBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const commandId = Number(
          (btn as HTMLElement).dataset.commandId
        );

        handleDeleteCommand(commandId);
      });
    });

    const runBtn = card.querySelector('[data-action="run"]');
    runBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRunService(service.id);
    });

    servicesList.appendChild(card);
  });

  renderTerminalTabs();
}

// Switch to a service's terminal
function switchToTerminal(serviceId: number): void {
  activeTerminalId = serviceId;

  // Initialize terminal for this service if not exists
  if (!terminals.has(serviceId)) {
    const service = services.find(s => s.id === serviceId);
    terminals.set(serviceId, [`Terminal for ${service?.name || 'Service'}`]);
  }

  renderServices();
  renderTerminalTabs();
  renderTerminalOutput();
}

// Render terminal tabs
function renderTerminalTabs(): void {
  const terminalTabsEl = document.getElementById('terminal-tabs')!;
  terminalTabsEl.innerHTML = '';

  if (terminals.size === 0) {
    return;
  }

  terminals.forEach((_, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const tab = document.createElement('div');
    tab.className = 'terminal-tab';
    if (activeTerminalId === serviceId) {
      tab.classList.add('active');
    }
    if (service.status === 'running') {
      tab.classList.add('running');
    }

    tab.innerHTML = `
      <span>${escapeHtml(service.name)}</span>
      <button class="tab-close" data-service-id="${serviceId}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    tab.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.tab-close')) return;
      switchToTerminal(serviceId);
    });

    const closeBtn = tab.querySelector('.tab-close');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTerminal(serviceId);
    });

    terminalTabsEl.appendChild(tab);
  });
}

// Close a terminal tab
function closeTerminal(serviceId: number): void {
  terminals.delete(serviceId);

  if (activeTerminalId === serviceId) {
    // Switch to first available terminal or null
    const firstTerminal = Array.from(terminals.keys())[0];
    activeTerminalId = firstTerminal || null;
  }

  renderServices();
  renderTerminalTabs();
  renderTerminalOutput();
}

// Render terminal output for active terminal
function renderTerminalOutput(): void {
  const terminalOutputEl = document.getElementById('terminal-output')!;

  if (!activeTerminalId || !terminals.has(activeTerminalId)) {
    terminalOutputEl.innerHTML = '<div class="terminal-line">No terminal selected. Click a service to view its output.</div>';
    return;
  }

  const lines = terminals.get(activeTerminalId) || [];
  terminalOutputEl.innerHTML = lines.map(line => {
    let className = 'terminal-line';
    if (line.includes('[ERROR]')) className += ' error';
    else if (line.includes('[SUCCESS]')) className += ' success';
    else if (line.includes('[INFO]')) className += ' info';
    return `<div class="${className}">${escapeHtml(line)}</div>`;
  }).join('');

  terminalOutputEl.scrollTop = terminalOutputEl.scrollHeight;
}

// Handle edit service
async function handleEditService(serviceId: number): Promise<void> {
  const service = services.find(s => s.id === serviceId);
  if (service) {
    openServiceModal(service);
  }
}

// Handle run service
async function handleRunService(serviceId: number): Promise<void> {
  const service = services.find(s => s.id === serviceId);
  if (!service) return;

  addTerminalLineToService(serviceId, `[INFO] Starting ${service.name}...`);
  switchToTerminal(serviceId);
  // TODO: Implement actual process execution
}

// Handle delete service
async function handleDeleteService(serviceId: number): Promise<void> {
  const service = services.find(s => s.id === serviceId);
  if (service && confirm(`Delete service "${service.name}"?`)) {
    addTerminalLine(`Delete service: ${service.name}`, 'info');
    try {
      await window.api.services.delete(service.id)
    } catch (error) {
      addTerminalLine(`Delete failed, ${error}`, "error")
    } finally {
      await loadServices();
      addTerminalLine("Services Deleted!", "success")
    }
  }
}

// Handle add command
function handleAddCommand(serviceId: number): void {
  const service = services.find(s => s.id === serviceId);
  if (service) {
    addTerminalLine(`Add command for service: ${service.name}`, 'info');
    openCommandModal(service);
  }
}

async function handleDeleteCommand(commandId: number): Promise<void> {
  if (commandId && confirm("Delete this command?")) {
    addTerminalLine("Delete Comamnd...", "info")

    try {
      await window.api.command.delete(commandId)
    } catch (error) {
      addTerminalLine(`Delete failed, ${error}`, "error")
    } finally {
      await loadServices();
      addTerminalLine("Command Deleted!", "success")
    }
  }
}

// Add line to specific service terminal
function addTerminalLineToService(serviceId: number, text: string, type: 'info' | 'success' | 'error' | 'default' = 'default'): void {
  const prefix = type === 'error' ? '[ERROR]' : type === 'success' ? '[SUCCESS]' : type === 'info' ? '[INFO]' : '';
  const timestamp = new Date().toLocaleTimeString();
  const line = `[${timestamp}] ${prefix} ${text}`;

  if (!terminals.has(serviceId)) {
    const service = services.find(s => s.id === serviceId);
    terminals.set(serviceId, [`Terminal for ${service?.name || 'Service'}`]);
  }

  const lines = terminals.get(serviceId)!;
  lines.push(line);

  // Limit lines to prevent memory issues
  if (lines.length > 1000) {
    lines.shift();
  }

  terminals.set(serviceId, lines);

  if (activeTerminalId === serviceId) {
    renderTerminalOutput();
  }
}

// Add line to terminal (backward compatibility)
function addTerminalLine(text: string, type: 'info' | 'success' | 'error' | 'default' = 'default'): void {
  // Add to active terminal if exists, otherwise create a general terminal
  if (activeTerminalId) {
    addTerminalLineToService(activeTerminalId, text, type);
  } else {
    // For general messages, just update the terminal output
    const terminalOutputEl = document.getElementById('terminal-output')!;
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    terminalOutputEl.appendChild(line);
    terminalOutputEl.scrollTop = terminalOutputEl.scrollHeight;
  }
}

// Clear terminal
function clearTerminal(): void {
  terminalOutput.innerHTML = '<div class="terminal-line">Terminal cleared</div>';
}

// Setup event listeners
function setupEventListeners(): void {
  // Add project button
  document.getElementById('btn-add-project')?.addEventListener('click', () => {
    openProjectModal();
  });

  // Add service button
  document.getElementById('btn-add-service')?.addEventListener('click', () => {
    if (currentProject) {
      openServiceModal();
    }
  });

  // Edit project button
  document.getElementById('btn-edit-project')?.addEventListener('click', () => {
    if (currentProject) {
      openProjectModal(currentProject);
    }
  });

  // Delete project button
  document.getElementById('btn-delete-project')?.addEventListener('click', async () => {
    if (currentProject && confirm(`Delete project "${currentProject.name}"?`)) {
      try {
        await window.api.project.delete(currentProject.id);
        addTerminalLine(`Project "${currentProject.name}" deleted`, 'success');
        currentProject = null;
        await loadProjects();
        showProjectDetail();
      } catch (error) {
        addTerminalLine(`Error deleting project: ${error}`, 'error');
      }
    }
  });

  // Clear terminal button
  document.getElementById('btn-clear-terminal')?.addEventListener('click', clearTerminal);

  // Modal close buttons
  document.getElementById('btn-close-modal-project')?.addEventListener('click', closeProjectModal);
  document.getElementById('btn-cancel-project')?.addEventListener('click', closeProjectModal);
  document.getElementById('btn-close-modal-service')?.addEventListener('click', closeServiceModal);
  document.getElementById('btn-cancel-service')?.addEventListener('click', closeServiceModal);
  document.getElementById('btn-close-modal-command')?.addEventListener('click', closeCommandModal);
  document.getElementById('btn-cancel-command')?.addEventListener('click', closeCommandModal);

  // Click outside modal to close
  modalProject?.addEventListener('click', (e) => {
    if (e.target === modalProject) closeProjectModal();
  });
  modalService?.addEventListener('click', (e) => {
    if (e.target === modalService) closeServiceModal();
  });
  modalCommand?.addEventListener('click', (e) => {
    if (e.target === modalCommand) closeCommandModal();
  });

  // Form submissions
  formProject?.addEventListener('submit', handleProjectSubmit);
  formService?.addEventListener('submit', handleServiceSubmit);
  formCommand?.addEventListener('submit', handleCommandSubmit);

  // Browse button for service working directory
  document.getElementById('btn-browse-service-cwd')?.addEventListener('click', async () => {
    try {
      console.log('Browse button clicked');
      console.log('window.api:', window.api);
      console.log('window.api.dialog:', window.api?.dialog);

      if (!window.api?.dialog?.openDirectory) {
        throw new Error('Dialog API not available. Please FULLY RESTART the app (stop and run again).');
      }

      const selectedPath = await window.api.dialog.openDirectory();
      console.log('Selected path:', selectedPath);

      if (selectedPath) {
        const inputServiceCwd = document.getElementById('input-service-cwd') as HTMLInputElement;
        if (inputServiceCwd) {
          inputServiceCwd.value = selectedPath;
          addTerminalLine(`Selected directory: ${selectedPath}`, 'success');
        }
      }
    } catch (error) {
      console.error('Error opening directory dialog:', error);
      addTerminalLine(`Error: ${error}`, 'error');
    }
  });
}

// Open project modal (add or edit)
function openProjectModal(project?: Project): void {
  if (project) {
    modalProjectTitle.textContent = 'Edit Project';
    inputProjectName.value = project.name;
    inputProjectDescription.value = project.description || '';
    inputProjectIcon.value = project.icon || '';
    formProject.dataset.projectId = project.id.toString();
  } else {
    modalProjectTitle.textContent = 'Add Project';
    formProject.reset();
    delete formProject.dataset.projectId;
  }
  modalProject.classList.add('active');
}

function closeProjectModal(): void {
  modalProject.classList.remove('active');
  formProject.reset();
}

function openServiceModal(service?: Service): void {
  const modalServiceTitle = document.getElementById('modal-service-title')!;

  if (service) {
    modalServiceTitle.textContent = 'Edit Service';
    inputServiceName.value = service.name;
    inputServiceCwd.value = service.working_directory;
    inputServiceExecutable.value = service.executable;
    inputServiceArguments.value = service.arguments || '';
    inputServiceAutostart.checked = service.auto_start === 1;
    formService.dataset.serviceId = service.id.toString();
  } else {
    modalServiceTitle.textContent = 'Add Service';
    formService.reset();
    delete formService.dataset.serviceId;
  }

  modalService.classList.add('active');
}

function closeServiceModal(): void {
  modalService.classList.remove('active');
}

function openCommandModal(service: Service): void {
  formCommand.reset();
  inputCommandServiceId.value = String(service.id);
  modalCommand.classList.add('active');
}

function closeCommandModal(): void {
  modalCommand.classList.remove('active');
}

// Handle project form submission
async function handleProjectSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const data = {
    name: inputProjectName.value.trim(),
    description: inputProjectDescription.value.trim() || undefined,
    icon: inputProjectIcon.value.trim() || undefined,
  };

  try {
    const projectId = formProject.dataset.projectId;

    if (projectId) {
      // Update
      await window.api.project.update(parseInt(projectId), data);
      addTerminalLine(`Project "${data.name}" updated`, 'success');
    } else {
      // Create
      await window.api.project.create(data);
      addTerminalLine(`Project "${data.name}" created`, 'success');
    }

    closeProjectModal();
    await loadProjects();

    // Select the newly created/updated project
    if (!projectId) {
      const newProject = projects.find(p => p.name === data.name);
      if (newProject) selectProject(newProject);
    }
  } catch (error) {
    addTerminalLine(`Error saving project: ${error}`, 'error');
  }
}

// Handle service form submission
async function handleServiceSubmit(e: Event): Promise<void> {
  e.preventDefault();

  if (!currentProject) {
    addTerminalLine('No project selected', 'error');
    return;
  }

  const serviceId = formService.dataset.serviceId;
  const data = serviceId ? {
    // Update - tidak perlu project_id
    name: inputServiceName.value.trim(),
    working_directory: inputServiceCwd.value.trim(),
    executable: inputServiceExecutable.value.trim(),
    arguments: inputServiceArguments.value.trim(),
    auto_start: inputServiceAutostart.checked ? 1 : 0
  } : {
    // Create - perlu project_id
    project_id: currentProject.id,
    name: inputServiceName.value.trim(),
    working_directory: inputServiceCwd.value.trim(),
    executable: inputServiceExecutable.value.trim(),
    arguments: inputServiceArguments.value.trim(),
    auto_start: inputServiceAutostart.checked ? 1 : 0,
    status: 'stopped'
  };

  // Validation
  if (!data.name) {
    addTerminalLine('Service name is required', 'error');
    return;
  }

  if (!data.working_directory) {
    addTerminalLine('Working directory is required', 'error');
    return;
  }

  if (!data.executable) {
    addTerminalLine('Executable is required', 'error');
    return;
  }

  try {
    if (serviceId) {
      // Update
      await window.api.services.update(parseInt(serviceId), data);
      addTerminalLine(`Service "${data.name}" updated successfully`, 'success');
    } else {
      // Create
      await window.api.services.create(data as any);
      addTerminalLine(`Service "${data.name}" created successfully`, 'success');
    }

    closeServiceModal();
    await loadServices();
  } catch (error) {
    console.error('Error saving service:', error);
    addTerminalLine(`Error saving service: ${error}`, 'error');
  }
}

// Handle command form submission
async function handleCommandSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const data = {
    name: inputCommandName.value.trim(),
    executable: inputCommandExecutable.value.trim(),
    arguments: inputCommandArguments.value.trim(),
    service_id: Number(inputCommandServiceId.value.trim())
  }

  // Validation
  if (!data.name) {
    addTerminalLine('Command name is required', 'error');
    return;
  }

  if (!data.arguments) {
    addTerminalLine('Command Arguments is required', 'error');
    return;
  }

  if (!data.executable) {
    addTerminalLine('Command Executable is required', 'error');
    return;
  }

  const currentService = services.find((s) => s.id === data.service_id)

  try {
    addTerminalLine(`Processing to Create commmand for ${currentService?.name} Service`, "info")
    await window.api.command.create(data)
  } catch (error) {
    addTerminalLine(`Failed Create command, ${error}`, "error")
  } finally {
    loadServices()
    addTerminalLine(`Command Created for service ${currentService?.name}`, 'success');
  }

  closeCommandModal();
}

// Utility: Escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
