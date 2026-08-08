import type { Service } from '../../shared/types/service';
import {
    currentProject,
    services,
    activeTerminalId,
    setServices
} from './state';
import { servicesList, escapeHtml } from './dom';
import { switchToTerminal, renderTerminalTabs } from './terminal-manager';
import { openServiceModal, openCommandModal } from './modals';

// Load services for current project
export async function loadServices(): Promise<void> {
    if (!currentProject) {
        servicesList.innerHTML = '';
        return;
    }

    try {
        if (!window.api.services) {
            throw new Error('Services API not available. Please restart the app.');
        }

        const loadedServices = await window.api.services.getAll(currentProject.id);
        console.log('Services loaded:', loadedServices);
        setServices(loadedServices);
        renderServices();
    } catch (error) {
        console.error('Error loading services:', error);
        servicesList.innerHTML = `
      <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--danger);">
        <p>Error loading services: ${error}</p>
        <p style="font-size: 12px; margin-top: 8px;">Try restarting the app</p>
      </div>
    `;
    }
}

// Render services
export async function renderServices(): Promise<void> {
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

        // Attach event listeners
        attachServiceCardListeners(card, service);
        servicesList.appendChild(card);
    });

    renderTerminalTabs();
}

// Attach event listeners to service card
function attachServiceCardListeners(card: HTMLElement, service: Service): void {
    card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        switchToTerminal(service.id);
    });

    card.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleEditService(service.id);
    });

    card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteService(service.id);
    });

    card.querySelector('[data-action="add-command"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAddCommand(service.id);
    });

    card.querySelectorAll('[data-action="delete-command"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const commandId = Number((btn as HTMLElement).dataset.commandId);
            handleDeleteCommand(commandId);
        });
    });

    card.querySelector('[data-action="run"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleRunService(service.id);
    });
}

// Service event handlers (defined here to avoid circular dependency)
function handleEditService(serviceId: number): void {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        openServiceModal(service);
    }
}

async function handleRunService(serviceId: number): Promise<void> {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    switchToTerminal(serviceId);
}

async function handleDeleteService(serviceId: number): Promise<void> {
    const service = services.find(s => s.id === serviceId);
    if (service && confirm(`Delete service "${service.name}"?`)) {
        try {
            await window.api.services.delete(service.id);
            await loadServices();
        } catch (error) {
            console.error('Delete service error:', error);
        }
    }
}

function handleAddCommand(serviceId: number): void {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        openCommandModal(service);
    }
}

async function handleDeleteCommand(commandId: number): Promise<void> {
    if (commandId && confirm("Delete this command?")) {
        try {
            await window.api.command.delete(commandId);
            await loadServices();
        } catch (error) {
            console.error('Delete command error:', error);
        }
    }
}
