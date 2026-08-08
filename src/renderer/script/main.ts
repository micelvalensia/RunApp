import { loadProjects } from './projects';
import { setupEventListeners } from './event-handlers';

// Initialize app
function init(): void {
  console.log('Initializing app...');
  loadProjects();
  setupEventListeners();
}

// Start app
document.addEventListener('DOMContentLoaded', init);
