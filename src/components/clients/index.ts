/**
 * ClearPress AI - Client Components
 * Barrel export for client-related components
 */

export { EmptyClientState } from './EmptyClientState';
export { ClientFilters } from './ClientFilters';
export { ClientRow } from './ClientRow';
export { ClientTable } from './ClientTable';
export { IndustrySelector } from './IndustrySelector';
export { ClientForm } from './ClientForm';
export { CreateClientDialog } from './CreateClientDialog';
export { EditClientDialog } from './EditClientDialog';
export { DeleteClientDialog } from './DeleteClientDialog';
export { ClientInfoCard } from './ClientInfoCard';
export { ClientSettingsCard } from './ClientSettingsCard';
export { StyleProfileEditor } from './StyleProfileEditor';
export { StyleExtractionPanel } from './StyleExtractionPanel';
export { ClientUsersSection } from './ClientUsersSection';
export { InviteClientUserDialog } from './InviteClientUserDialog';

// Schemas
export {
  clientFormSchema,
  clientSettingsSchema,
  styleProfileSchema,
  type ClientFormData,
  type ClientSettingsData,
  type StyleProfileData,
} from './schemas';
