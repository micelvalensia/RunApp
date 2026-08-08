import { services, activeTerminalId, setActiveTerminalId } from './state';
import { renderTerminal, closeTerminal, hasTerminal, getActiveTerminalIds } from './terminal';
import { renderServices } from './services';
import { escapeHtml } from './dom';

// Switch to a terminal
export async function switchToTerminal(serviceId: number): Promise<void> {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    setActiveTerminalId(serviceId);

    // Check if terminal already exists
    const terminalExists = hasTerminal(serviceId);

    // 1. Render/display XTerm for this service
    renderTerminal(serviceId);

    // 2. Create PTY for this service if it doesn't exist
    if (!terminalExists) {
        await window.api.terminal.create(serviceId, service.working_directory);
    }

    renderServices();
    renderTerminalTabs();
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
    closeTerminal(serviceId);

    if (activeTerminalId === serviceId) {
        // Switch to first available terminal or null
        const remainingTerminals = getActiveTerminalIds();
        setActiveTerminalId(remainingTerminals[0] || null);

        if (activeTerminalId) {
            switchToTerminal(activeTerminalId);
        } else {
            // Display placeholder
            const terminalOutput = document.getElementById('terminal-output')!;
            terminalOutput.innerHTML = '<div class="terminal-placeholder">No terminal selected. Click a service to open its terminal.</div>';
        }
    }

    renderServices();
    renderTerminalTabs();
}
