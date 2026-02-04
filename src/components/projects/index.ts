/**
 * ClearPress AI - Project Components
 * Barrel export for project-related components
 */

export { ProjectStatusBadge } from './ProjectStatusBadge';
export { UrgencyBadge } from './UrgencyBadge';
export { ProjectTable } from './ProjectTable';
export { ProjectRow } from './ProjectRow';
export { ProjectFilters } from './ProjectFilters';
export { ProjectForm } from './ProjectForm';
export { ClientProjectRequestForm } from './ClientProjectRequestForm';
export { CreateProjectDialog } from './CreateProjectDialog';
export { EditProjectDialog } from './EditProjectDialog';
export { DeleteProjectDialog } from './DeleteProjectDialog';
export { EmailToProjectDialog } from './EmailToProjectDialog';
export { ProjectInfoCard } from './ProjectInfoCard';
export { ProjectBriefCard } from './ProjectBriefCard';
export { ProjectContentSection } from './ProjectContentSection';
export { EmptyProjectState } from './EmptyProjectState';

// Schemas
export {
  projectFormSchema,
  projectStatusSchema,
  clientRequestFormSchema,
  STATUS_TRANSITIONS,
  isValidStatusTransition,
  type ProjectFormData,
  type ProjectStatusData,
  type ClientRequestFormData,
} from './schemas';
