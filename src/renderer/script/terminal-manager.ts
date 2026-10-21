import { currentProject, services, activeTerminalId, setActiveTerminalId, getProjectActiveTerminalId } from './state';
import { renderTerminal, closeTerminal, hasTerminal, getActiveTerminalIds, fitTerminal, hideAllTerminals } from './terminal';
import { renderServices } from './services';
import { escapeHtml } from './dom';

// Setup listener untuk event exit dari PTY
window.api.terminal.onExit((serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        service.status = 'stopped';
        service.running_command = null;
        renderServices();
        renderTerminalTabs();
    }
    // Update DB regardless of which project is open
    window.api.services.update(serviceId, { status: 'stopped', running_command: null }).catch(console.error);
});

// Setup listener untuk status perubahan child process (e.g. Ctrl+C atau program selesai)
window.api.terminal.onStatusChange((serviceId: number, status: 'running' | 'stopped') => {
    const service = services.find(s => s.id === serviceId);
    if (service && service.status !== status) {
        service.status = status;
        if (status === 'stopped') {
            service.running_command = null;
        }
        renderServices();
        renderTerminalTabs();
    }
    // Update DB regardless of which project is open
    if (status === 'stopped') {
        window.api.services.update(serviceId, { status: 'stopped', running_command: null }).catch(console.error);
    } else {
        window.api.services.update(serviceId, { status: 'running' }).catch(console.error);
    }
});

// Switch to a terminal
export async function switchToTerminal(serviceId: number): Promise<void> {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    setActiveTerminalId(serviceId);

    // Sync dropdown shell in terminal header
    const shellSelect = document.getElementById('select-terminal-shell') as HTMLSelectElement | null;
    const currentShell = service.terminal_shell || localStorage.getItem('preferred_terminal_shell') || 'bash';
    if (shellSelect) {
        shellSelect.value = currentShell;
    }

    // Check if terminal already exists
    const terminalExists = hasTerminal(serviceId);

    // 1. Render/display XTerm for this service
    renderTerminal(serviceId);

    // 2. Create PTY for this service if it doesn't exist
    if (!terminalExists) {
        await window.api.terminal.create(serviceId, service.working_directory, currentShell);
    }

    renderServices();
    renderTerminalTabs();
    setTimeout(() => fitTerminal(serviceId), 30);
}

// Render terminal tabs
export function renderTerminalTabs(): void {
    const terminalTabsEl = document.getElementById('terminal-tabs')!;
    terminalTabsEl.innerHTML = '';

    const activeTerminalIds = getActiveTerminalIds();

    if (activeTerminalIds.length === 0) {
        return;
    }

    activeTerminalIds.forEach((serviceId) => {
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
            handleCloseTerminal(serviceId);
        });

        terminalTabsEl.appendChild(tab);
    });
}

// Close a terminal tab
export function handleCloseTerminal(serviceId: number): void {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        service.status = 'stopped';
        service.running_command = null;
        window.api.services.update(service.id, { status: 'stopped', running_command: null }).catch(console.error);
    }

    closeTerminal(serviceId);

    if (activeTerminalId === serviceId) {
        // Switch to first available terminal for the current project or null
        const projectTerminals = getActiveTerminalIds().filter(id => services.some(s => s.id === id));
        const nextId = projectTerminals[0] || null;
        setActiveTerminalId(nextId);

        if (nextId) {
            switchToTerminal(nextId);
        } else {
            hideAllTerminals();
            const terminalOutput = document.getElementById('terminal-output');
            if (terminalOutput) {
                terminalOutput.innerHTML = '<div class="terminal-placeholder">No terminal selected. Click a service to open its terminal.</div>';
            }
        }
    }

    renderServices();
    renderTerminalTabs();
}

/**
 * Restore active terminal display when switching projects
 */
export function restoreProjectTerminal(): void {
    if (!currentProject) return;

    let targetId = getProjectActiveTerminalId(currentProject.id);

    // If targetId is not set or doesn't belong to current services, find one
    if (targetId === null || !services.some(s => s.id === targetId)) {
        // Priority 1: Service that has an open terminal and is running
        const runningWithTerminal = services.find(s => s.status === 'running' && hasTerminal(s.id));
        if (runningWithTerminal) {
            targetId = runningWithTerminal.id;
        } else {
            // Priority 2: Any service that already has an open terminal
            const anyWithTerminal = services.find(s => hasTerminal(s.id));
            if (anyWithTerminal) {
                targetId = anyWithTerminal.id;
            } else {
                targetId = null;
            }
        }
    }

    if (targetId !== null) {
        setActiveTerminalId(targetId);
        renderTerminal(targetId);

        // Sync shell dropdown
        const activeService = services.find(s => s.id === targetId);
        const shellSelect = document.getElementById('select-terminal-shell') as HTMLSelectElement | null;
        if (shellSelect && activeService) {
            shellSelect.value = activeService.terminal_shell || localStorage.getItem('preferred_terminal_shell') || 'bash';
        }

        renderServices();
        renderTerminalTabs();
        setTimeout(() => fitTerminal(targetId), 30);
    } else {
        setActiveTerminalId(null);
        hideAllTerminals();
        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput && !terminalOutput.querySelector('.terminal-placeholder')) {
            terminalOutput.innerHTML = '<div class="terminal-placeholder">No terminal selected. Click a service to open its terminal.</div>';
        }
        renderServices();
        renderTerminalTabs();
    }
}
