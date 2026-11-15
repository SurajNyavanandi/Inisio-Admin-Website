export type UserRole = 'admin' | 'superadmin' | 'ca' | 'prosync' | 'dpr' | 'user';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type KycStatus = 'Verified' | 'Pending Review' | 'Not Submitted';

export interface LoginAuditLog {
  timestamp: string;
  ip: string;
  status: 'Success' | 'Failed';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  companyName?: string;
  promoterShareholding?: number;
  projectRequirement?: string;
  kycStatus: KycStatus;
  lastLogin: string;
  createdAt: string;
  loginAuditLogs: LoginAuditLog[];
}

export type PipelineStatus =
  | 'Inquiry'
  | 'Feasibility Review'
  | 'CMA Prepared'
  | 'DPR Drafting'
  | 'Syndication'
  | 'Sanctioned'
  | 'Closed/Lost';

export type FeasibilityRating = 'High' | 'Moderate' | 'Low';

export interface LeadRecord {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  projectCost: number; // in Cr (INR)
  requiredBankDebt: number; // in Cr (INR)
  pipelineStatus: PipelineStatus;
  bankabilityScore: number; // 0-100
  feasibilityRating: FeasibilityRating;
  assignedDPR?: string;
  assignedProsync?: string;
  assignedCA?: string;
  industry: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type InquiryStatus = 'New' | 'In Progress' | 'Contacted' | 'Resolved';

export interface InquiryRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  isArchived: boolean;
  assignedStaff?: string;
  internalNotes: string;
  createdAt: string;
}

export interface AssessmentRecord {
  id: string;
  leadId: string;
  companyName: string;
  projectSector: string;
  debtEquityRatio: string;
  dscr: number;
  currentRatio: number;
  bankabilityStatus: 'High Bankability' | 'Moderate Feasibility' | 'Critical Risk';
  cmaAuditStatus: 'Passed' | 'Under Review' | 'Observations Flagged';
  assignedCA: string;
  reviewedAt: string;
}

export interface ConsultationRecord {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  scheduledTime: string;
  advisoryType: 'Debt Syndication' | 'CMA & Ratio Audit' | 'DPR Pre-check' | 'Project Finance';
  status: 'Requested' | 'Scheduled' | 'Completed' | 'Cancelled';
  assignedAdvisor: string;
}

export interface IndustryBenchmark {
  id: string;
  name: string;
  sector: string;
  typicalDscrBenchmark: number;
  maxLeverage: string;
  riskWeight: 'Low' | 'Medium' | 'High';
}

export interface AdvisoryService {
  id: string;
  name: string;
  code: string;
  category: 'CMA' | 'DPR' | 'Syndication' | 'Feasibility';
  standardTurnaroundDays: number;
  active: boolean;
}
