export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PriorityScore = 4 | 3 | 2 | 1;
export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface DetectedKeyword {
  keyword: string;
  level: PriorityLevel;
  score: PriorityScore;
}

export interface Complaint {
  id: number;
  complaint_number: string;
  student_name: string;
  roll_number: string;
  department: string;
  class_division: string;
  contact_number: string;
  gmail_id: string;
  category: string;
  pc_number?: string;
  description: string;
  priority_level: PriorityLevel;
  priority_score: PriorityScore;
  detected_keywords: DetectedKeyword[];
  status: ComplaintStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  completed_by?: string;
  rejected_at?: string;
  rejected_by?: string;
}

export type ComplaintFormData = Omit<
  Complaint,
  | 'id'
  | 'complaint_number'
  | 'priority_level'
  | 'priority_score'
  | 'detected_keywords'
  | 'status'
  | 'rejection_reason'
  | 'created_at'
  | 'updated_at'
  | 'completed_at'
  | 'completed_by'
  | 'rejected_at'
  | 'rejected_by'
>;

export const REJECTION_REASONS = [
  'Spam',
  'Duplicate Complaint',
  'Invalid Information',
  'Not College Related',
  'Unnecessary Complaint',
  'Other',
] as const;
