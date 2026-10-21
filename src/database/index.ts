import migration001 from "./migrations/001_create_projects";
import migration002 from "./migrations/002_create_services";
import migration003 from "./migrations/003_create_commands";
import migration004 from "./migrations/004_add_running_command_to_services";
import migration005 from "./migrations/005_add_terminal_shell_to_services";

export default [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
];