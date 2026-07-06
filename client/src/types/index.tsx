// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  verificationLevel: number;
  isVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  planId: string;
  phone?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'CUSTOMER' | 'TAILOR' | 'DESIGNER' | 'ORGANIZATION' | 'SUPER_ADMIN';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'TRIAL';

// Measurement types
export interface Measurement {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  userHeightCm: number;
  bodyShape?: string;
  data: Record<string, number>;
  confidenceScores: Record<string, number>;
  calibrationData?: any;
  poseFeedback?: any;
  clothingFeedback?: any;
  aiModelUsed?: string;
  aiConfidence?: number;
  syncedToFysora: boolean;
  fysoraMeasurementId?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  type: OrganizationType;
  registrationNumber?: string;
  verificationLevel: number;
  isVerified: boolean;
  fysoraOrgId?: string;
  logo?: string;
  address?: Address;
  contactEmail?: string;
  contactPhone?: string;
  settings?: any;
  members?: OrganizationMember[];
  createdAt: string;
  updatedAt: string;
}

export type OrganizationType = 'TAILOR' | 'DESIGNER' | 'BOUTIQUE' | 'BRAND' | 'OTHER';

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrgMemberRole;
  permissions?: any;
  joinedAt: string;
  user?: User;
}

export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

// Address type
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// Export types
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeMetadata?: boolean;
  includeConfidence?: boolean;
  includeBodyShape?: boolean;
}

export interface ShareLink {
  url: string;
  token: string;
  expiresAt: string;
}

// Cloud Backup types
export interface CloudProvider {
  id: string;
  type: 'google_drive' | 'dropbox' | 'onedrive';
  accessToken: string;
  refreshToken?: string;
  connectedAt: string;
  autoBackup?: boolean;
  backupFrequency?: 'daily' | 'weekly' | 'monthly';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  phone?: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Ecosystem notice
export interface EcosystemNotice {
  message: string;
  accepted: boolean;
  required: boolean;
}

// Audit log types
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  source: 'ifysora' | 'fysora-fashn' | 'admin';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
