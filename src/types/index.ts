/**
 * ClearPress AI - Core TypeScript Types
 * Application-level types and interfaces
 */

// ===== User & Auth Types =====

export type UserRole = 'pr_admin' | 'pr_staff' | 'client_user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  organization_id: string;
  preferences: UserPreferences;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  language: 'ja' | 'en';
  theme?: 'light' | 'dark' | 'system';
  notifications_email?: boolean;
  notifications_in_app?: boolean;
}

// ===== Organization Types =====

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  branding?: {
    primary_color?: string;
    logo_url?: string;
  };
  defaults?: {
    language?: 'ja' | 'en';
    urgency?: UrgencyLevel;
  };
}

// ===== Client Types =====

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  settings: ClientSettings;
  style_profile: StyleProfile;
  created_at: string;
  updated_at: string;
}

export interface ClientSettings {
  default_urgency?: UrgencyLevel;
  require_approval?: boolean;
}

export interface StyleProfile {
  tone?: string;
  formality?: 'low' | 'medium' | 'high';
  key_messages?: string[];
  avoid_phrases?: string[];
  boilerplate?: string;
  // AI extraction fields
  vocabulary_patterns?: string[];
  structure_preferences?: string[];
  extracted_from?: string[]; // File IDs
  last_extraction_at?: string;
}

// ===== Industry Types =====

export interface Industry {
  id: string;
  slug: string;
  name_en: string;
  name_ja: string;
  icon?: string;
  config: IndustryConfig;
  compliance_rules?: string;
  prompts?: Record<string, string>;
  is_active: boolean;
}

export interface IndustryConfig {
  content_types?: ContentType[];
  compliance_categories?: string[];
  required_elements?: Record<string, string[]>;
}

// ===== Project Types =====

export type ProjectStatus =
  | 'requested'
  | 'in_progress'
  | 'in_review'
  | 'approved'
  | 'completed'
  | 'archived';

export type UrgencyLevel = 'standard' | 'priority' | 'urgent' | 'crisis';

export interface Project {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  status: ProjectStatus;
  urgency: UrgencyLevel;
  target_date?: string;
  brief: string;
  expanded_brief?: ExpandedBrief;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  created_by_user?: User;
  content_items?: ContentItem[];
}

export interface ExpandedBrief {
  summary?: string;
  target_audience?: {
    primary: string[];
    secondary: string[];
  };
  key_messages?: string[];
  tone?: string;
  deliverables?: {
    type: ContentType;
    notes?: string;
  }[];
  constraints?: string[];
  references?: string[];
}

// ===== Content Types =====

export type ContentType =
  | 'press_release'
  | 'blog_post'
  | 'social_media'
  | 'internal_memo'
  | 'faq'
  | 'executive_statement';

export type ContentStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_revision'
  | 'approved';

export interface ContentItem {
  id: string;
  project_id: string;
  type: ContentType;
  title: string;
  status: ContentStatus;
  current_version_id?: string;
  settings: ContentSettings;
  locked_by?: string;
  locked_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  current_version?: ContentVersion;
  versions?: ContentVersion[];
  comments?: Comment[];
  suggestions?: ClientSuggestion[];
}

export interface ContentSettings {
  target_length?: number;
  include_isi?: boolean;
  include_boilerplate?: boolean;
  tone?: ToneType;
}

export type ToneType = 'formal' | 'professional' | 'friendly' | 'urgent' | 'custom';

// ===== Content Version Types =====

export interface ContentVersion {
  id: string;
  content_item_id: string;
  version_number: number;
  content: StructuredContent;
  compliance_score?: number;
  compliance_details?: ComplianceDetails;
  word_count: number;
  is_milestone?: boolean;
  milestone_name?: string;
  generation_params?: GenerationParams;
  created_by: string;
  created_at: string;
}

export interface StructuredContent {
  headline?: string;
  subheadline?: string;
  dateline?: string;
  lead?: string;
  body?: string[];
  quotes?: { text: string; attribution: string }[];
  boilerplate?: string;
  isi?: string;
  contact?: string;
  // For other content types
  title?: string;
  introduction?: string;
  sections?: { heading: string; content: string }[];
  conclusion?: string;
  cta?: string;
  plain_text?: string;
  html?: string;
}

export interface GenerationParams {
  tone?: ToneType;
  custom_tone?: string;
  model?: string;
  temperature?: number;
}

// ===== Compliance Types =====

export interface ComplianceDetails {
  categories: Record<string, ComplianceCategory>;
}

export interface ComplianceCategory {
  score: number;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
  rule_reference?: string;
}

// ===== Comment Types =====

export interface Comment {
  id: string;
  content_item_id: string;
  version_id?: string;
  user_id: string;
  content: string;
  position?: CommentPosition;
  parent_id?: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  replies?: Comment[];
}

export interface CommentPosition {
  type: 'inline' | 'general';
  start_offset?: number;
  end_offset?: number;
  selected_text?: string;
}

// ===== Client Suggestion Types =====

export interface ClientSuggestion {
  id: string;
  content_item_id: string;
  version_id: string;
  user_id: string;
  before_text: string;
  after_text: string;
  position: { start_offset: number; end_offset: number };
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  // Relations
  user?: User;
}

// ===== Approval Types =====

export interface Approval {
  id: string;
  content_item_id: string;
  version_id: string;
  user_id: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  feedback?: string;
  created_at: string;
  // Relations
  user?: User;
}

// ===== Notification Types =====

export type NotificationType =
  | 'project_request'
  | 'content_submitted'
  | 'comment_added'
  | 'approval_needed'
  | 'content_approved'
  | 'deadline_reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: {
    project_id?: string;
    content_item_id?: string;
    link?: string;
  };
  read: boolean;
  created_at: string;
}

// ===== File Types =====

export type FileCategory =
  | 'reference'
  | 'brand_guidelines'
  | 'tone_example'
  | 'previous_press_release'
  | 'style_reference'
  | 'asset'
  | 'export';

export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface FileRecord {
  id: string;
  organization_id: string;
  client_id?: string;
  project_id?: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: FileCategory;
  content_text?: string;
  extraction_status?: ExtractionStatus;
  extracted_at?: string;
  uploaded_by: string;
  created_at: string;
  // Relations
  uploaded_by_user?: User;
}

/** @deprecated Use FileRecord instead */
export interface File {
  id: string;
  organization_id: string;
  client_id?: string;
  project_id?: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: 'reference' | 'asset' | 'export';
  uploaded_by: string;
  created_at: string;
}

export interface FileFilters {
  client_id?: string;
  project_id?: string;
  category?: FileCategory[];
  extraction_status?: ExtractionStatus[];
  search?: string;
}

// ===== API Response Types =====

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ===== Filter Types =====

export interface ProjectFilters {
  client_id?: string;
  status?: ProjectStatus[];
  urgency?: UrgencyLevel[];
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface ContentFilters {
  type?: ContentType[];
  status?: ContentStatus[];
  search?: string;
}

// ===== Guided Content Creation Types =====

/**
 * Brief data collected by the guided content creation wizard
 */
export interface ContentGenerationBrief {
  project_id: string;
  content_type: ContentType;
  title: string;
  summary: string;
  key_messages: string[];
  call_to_action?: string;
  target_audience: string;
  tone: ToneType;
  custom_tone?: string;
  keywords: string[];
  target_length: number;
  // Pharmaceutical-specific fields
  product_name?: string;
  therapeutic_area?: string;
  include_isi: boolean;
  include_boilerplate: boolean;
  regulatory_notes?: string;
}

/**
 * Template for pre-filling the guided content wizard
 */
export interface ContentTemplate {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  description_ja: string;
  description_en: string;
  icon: string;
  defaults: Partial<ContentGenerationBrief>;
}

/**
 * A single generated content variant
 */
export interface ContentVariant {
  id: string;
  content: StructuredContent;
  compliance_score: number;
  word_count: number;
  generation_params: GenerationParams;
}

/**
 * Response from variant generation
 */
export interface GenerateVariantsResponse {
  variants: ContentVariant[];
  brief_id?: string;
}

/**
 * Target audience options
 */
export type TargetAudience =
  | 'healthcare_professionals'
  | 'patients'
  | 'media'
  | 'investors'
  | 'general_public'
  | 'regulators'
  | 'custom';

/**
 * Therapeutic area options for pharma content
 */
export type TherapeuticArea =
  | 'oncology'
  | 'cardiology'
  | 'neurology'
  | 'immunology'
  | 'infectious_disease'
  | 'rare_disease'
  | 'respiratory'
  | 'gastroenterology'
  | 'dermatology'
  | 'ophthalmology'
  | 'other';
