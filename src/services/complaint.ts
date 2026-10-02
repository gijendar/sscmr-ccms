import {supabase} from '@/lib/supabase';
import {Complaint, ComplaintStatus} from '@/types/complaint';
import {generateComplaintNumber} from '@/lib/complaint-number';
import {calculatePriority, PriorityLevel, PriorityScore} from '@/lib/priority';

export interface CreateComplaintInput {
  student_name: string;
  roll_number: string;
  department: string;
  class_division: string;
  contact_number: string;
  gmail_id: string;
  category: string;
  pc_number?: string;
  description: string;
}

export interface CreatedComplaint {
  complaint_number: string;
  status: ComplaintStatus;
  description: string;
}

export async function createComplaint(input: CreateComplaintInput): Promise<CreatedComplaint> {
  // Priority is derived from the admin-configured keyword table at submit time.
  const priority = await calculatePriority(input.category, input.description, '');

  const complaintNumber = await generateComplaintNumber();

  const payload = {
    complaint_number: complaintNumber,
    student_name: input.student_name,
    roll_number: input.roll_number,
    department: input.department,
    class_division: input.class_division,
    contact_number: input.contact_number,
    gmail_id: input.gmail_id,
    category: input.category,
    pc_number: input.pc_number ?? null,
    description: input.description,
    priority_level: priority.priorityLevel,
    priority_score: priority.priorityScore,
    detected_keywords: priority.detectedKeywords,
    status: 'PENDING' as ComplaintStatus,
    rejection_reason: null,
  };

  // NOTE: we intentionally do NOT use `.select()` here. Students have INSERT
  // but not SELECT rights on complaints (RLS), so reading the row back would
  // be rejected. The submitter only needs the complaint number and status.
  const {error} = await supabase.from('complaints').insert(payload);

  if (error) {
    // Retry once on a duplicate complaint number (unique constraint 23505).
    if ((error.message || '').includes('duplicate') || error.code === '23505') {
      const retryNumber = await generateComplaintNumber();
      const {error: retryError} = await supabase
        .from('complaints')
        .insert({...payload, complaint_number: retryNumber});
      if (retryError) {
        throw new Error('Failed to submit complaint. Please try again.');
      }
      return {complaint_number: retryNumber, status: 'PENDING', description: input.description};
    }
    throw new Error('Failed to submit complaint. Please try again.');
  }

  return {complaint_number: complaintNumber, status: 'PENDING', description: input.description};
}

export interface CategoryRecord {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriorityKeywordRecord {
  id: number;
  keyword: string;
  priority_level: PriorityLevel;
  priority_score: PriorityScore;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCategories(): Promise<CategoryRecord[]> {
  const {data, error} = await supabase.from('categories').select('*').order('name');
  if (error) throw new Error('Failed to load categories');
  return (data || []) as CategoryRecord[];
}

export async function getActiveCategories(): Promise<string[]> {
  const {data, error} = await supabase
    .from('categories')
    .select('name')
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error('Failed to load categories');
  return (data || []).map((r) => r.name) as string[];
}

export async function createCategory(name: string): Promise<CategoryRecord> {
  const {data, error} = await supabase
    .from('categories')
    .insert({name: name.trim()})
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('A category with this name already exists');
    throw new Error('Failed to create category');
  }
  return data as CategoryRecord;
}

export async function updateCategory(
  id: number,
  updates: {name?: string; is_active?: boolean},
): Promise<CategoryRecord> {
  const {data, error} = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error('Failed to update category');
  return data as CategoryRecord;
}

export async function deleteCategory(id: number): Promise<void> {
  const {error} = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error('Failed to delete category');
}

export async function getPriorityKeywords(): Promise<PriorityKeywordRecord[]> {
  const {data, error} = await supabase
    .from('priority_keywords')
    .select('*')
    .order('priority_score', {ascending: false})
    .order('keyword', {ascending: true});
  if (error) throw new Error('Failed to load priority keywords');
  return (data || []) as PriorityKeywordRecord[];
}

export async function createPriorityKeyword(input: {
  keyword: string;
  priority_level: PriorityLevel;
  priority_score: PriorityScore;
}): Promise<PriorityKeywordRecord> {
  const {data, error} = await supabase
    .from('priority_keywords')
    .insert({
      keyword: input.keyword.trim(),
      priority_level: input.priority_level,
      priority_score: input.priority_score,
      is_active: true,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('This keyword already exists');
    throw new Error('Failed to create priority keyword');
  }
  return data as PriorityKeywordRecord;
}

export async function updatePriorityKeyword(
  id: number,
  updates: {
    keyword?: string;
    priority_level?: PriorityLevel;
    priority_score?: PriorityScore;
    is_active?: boolean;
  },
): Promise<PriorityKeywordRecord> {
  const {data, error} = await supabase
    .from('priority_keywords')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error('Failed to update priority keyword');
  return data as PriorityKeywordRecord;
}

export async function deletePriorityKeyword(id: number): Promise<void> {
  const {error} = await supabase.from('priority_keywords').delete().eq('id', id);
  if (error) throw new Error('Failed to delete priority keyword');
}

export interface ComplaintFilter {
  status?: ComplaintStatus;
  statuses?: ComplaintStatus[];
  priority_level?: PriorityLevel;
  category?: string;
  department?: string;
  search?: string; // complaint number, student name, roll number, gmail, category
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
  sort?: 'queue' | 'newest';
}

/**
 * Single query builder shared by the list and paginated fetchers, so filtering
 * and priority-queue ordering can never drift apart between callers.
 *
 * When `range` is provided the query also asks PostgreSQL for an exact total
 * count, which is what pagination uses.
 */
async function fetchComplaints(
  filter: ComplaintFilter,
  range?: {from: number; to: number},
): Promise<{rows: Complaint[]; total: number | null}> {
  let query = supabase.from('complaints').select('*', range ? {count: 'exact'} : {});

  // The Priority Queue order is priority_score DESC then created_at ASC.
  // Completed/Rejected lists use newest activity first instead.
  if (filter.sort === 'newest') {
    query = query
      .order('completed_at', {ascending: false, nullsFirst: false})
      .order('rejected_at', {ascending: false, nullsFirst: false})
      .order('created_at', {ascending: false});
  } else {
    query = query.order('priority_score', {ascending: false}).order('created_at', {ascending: true});
  }

  if (filter.status) query = query.eq('status', filter.status);
  if (filter.statuses && filter.statuses.length) query = query.in('status', filter.statuses);
  if (filter.priority_level) query = query.eq('priority_level', filter.priority_level);
  if (filter.category) query = query.eq('category', filter.category);
  if (filter.department) query = query.eq('department', filter.department);

  if (filter.search) {
    const s = filter.search.trim();
    if (s.length > 0) {
      // Escape special LIKE pattern characters to prevent errors
      const escaped = s
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/\./g, '\\.');
      query = query.or(
        `complaint_number.ilike.%${escaped}%,student_name.ilike.%${escaped}%,roll_number.ilike.%${escaped}%,gmail_id.ilike.%${escaped}%,category.ilike.%${escaped}%`,
      );
    }
  }

  if (filter.from_date) query = query.gte('created_at', filter.from_date);
  if (filter.to_date) query = query.lte('created_at', filter.to_date);

  if (range) {
    query = query.range(range.from, range.to);
  } else if (filter.offset !== undefined) {
    const limit = filter.limit ?? 50;
    query = query.range(filter.offset, filter.offset + limit - 1);
  } else if (filter.limit) {
    query = query.limit(filter.limit);
  }

  const {data, error, count} = await query;
  if (error) {
    console.error('Supabase query error:', error.code, error.message, error.details);
    throw new Error(`Failed to load complaints: ${error.message || error.code}`);
  }
  return {rows: (data || []) as Complaint[], total: count ?? null};
}

export async function getComplaints(filter: ComplaintFilter = {}): Promise<Complaint[]> {
  const {rows} = await fetchComplaints(filter);
  return rows;
}

export interface ComplaintsPage {
  rows: Complaint[];
  total: number;
}

/**
 * Paginated complaint fetch. Ordering/filtering is identical to
 * `getComplaints`, so the priority queue order is preserved page to page.
 */
export async function getComplaintsPage(
  filter: ComplaintFilter,
  page: number,
  pageSize: number,
): Promise<ComplaintsPage> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 25);
  const from = (safePage - 1) * safeSize;
  const {rows, total} = await fetchComplaints(filter, {from, to: from + safeSize - 1});
  return {rows, total: total ?? rows.length};
}

export async function getComplaintById(id: number): Promise<Complaint | null> {
  const {data, error} = await supabase.from('complaints').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Failed to load complaint');
  }
  return (data as Complaint) ?? null;
}

export async function getComplaintByNumber(complaintNumber: string): Promise<Complaint | null> {
  const {data, error} = await supabase
    .from('complaints')
    .select('*')
    .eq('complaint_number', complaintNumber)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Failed to load complaint');
  }
  return (data as Complaint) ?? null;
}

export async function updateComplaintStatus(
  id: number,
  updates: {
    status: ComplaintStatus;
    completed_by?: string;
    rejected_by?: string;
    rejection_reason?: string;
  },
): Promise<Complaint> {
  const now = new Date().toISOString();
  const {data, error} = await supabase
    .from('complaints')
    .update({
      ...updates,
      updated_at: now,
      completed_at: updates.status === 'COMPLETED' ? now : null,
      rejected_at: updates.status === 'REJECTED' ? now : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Failed to update complaint status');
  return data as Complaint;
}

/**
 * Permanently deletes a complaint. There is no soft-delete path: the row is
 * removed from the database. Deletion is admin-only via RLS.
 *
 * The `.select('id')` is deliberate: if RLS blocks the delete (non-admin) or
 * the row is already gone, PostgREST reports success with zero rows. Returning
 * the deleted id lets us distinguish a real delete from a silently ignored one
 * so the UI never claims a complaint was removed when it was not.
 */
export async function deleteComplaint(id: number): Promise<void> {
  const {data, error} = await supabase.from('complaints').delete().eq('id', id).select('id');
  if (error) throw new Error('Failed to remove complaint. Please try again.');
  if (!data || data.length === 0) {
    throw new Error('Complaint could not be removed. Check your admin permissions and try again.');
  }
}

export async function getComplaintCounts(): Promise<{
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  rejected: number;
  critical: number;
  high: number;
}> {
  const queries = [
    supabase.from('complaints').select('*', {count: 'exact'}),
    supabase.from('complaints').select('*', {count: 'exact'}).eq('status', 'PENDING'),
    supabase.from('complaints').select('*', {count: 'exact'}).eq('status', 'IN_PROGRESS'),
    supabase.from('complaints').select('*', {count: 'exact'}).eq('status', 'COMPLETED'),
    supabase.from('complaints').select('*', {count: 'exact'}).eq('status', 'REJECTED'),
    supabase
      .from('complaints')
      .select('*', {count: 'exact'})
      .eq('priority_level', 'CRITICAL')
      .in('status', ['PENDING', 'IN_PROGRESS']),
    supabase
      .from('complaints')
      .select('*', {count: 'exact'})
      .eq('priority_level', 'HIGH')
      .in('status', ['PENDING', 'IN_PROGRESS']),
  ];

  const results = await Promise.all(
    queries.map(async (query) => {
      const {data, error, count} = await query;
      if (error) {
        console.error('Count query error:', error.code, error.message);
        return 0;
      }
      return count ?? 0;
    }),
  );

  const [total, pending, inProgress, completed, rejected, critical, high] = results;

  return {
    total: total || 0,
    pending: pending || 0,
    in_progress: inProgress || 0,
    completed: completed || 0,
    rejected: rejected || 0,
    critical: critical || 0,
    high: high || 0,
  };
}

export type AnalyticsResult = {
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  averageResolutionMinutes: number | null;
};

export async function getAnalytics(): Promise<AnalyticsResult> {
  const all = await getComplaints({});

  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};

  for (const c of all) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    byPriority[c.priority_level] = (byPriority[c.priority_level] || 0) + 1;
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byDepartment[c.department] = (byDepartment[c.department] || 0) + 1;
  }

  // Average resolution time: completed_at - created_at.
  let averageResolutionMinutes: number | null = null;
  const resolved = all.filter((c) => c.completed_at && c.status === 'COMPLETED');
  if (resolved.length > 0) {
    const diffs = resolved
      .map((c) => {
        const created = new Date(c.created_at).getTime();
        const completed = new Date(c.completed_at!).getTime();
        const diff = (completed - created) / 60000;
        return Number.isFinite(diff) ? diff : null;
      })
      .filter((d): d is number => d !== null);
    if (diffs.length) {
      averageResolutionMinutes = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
  }

  return {byCategory, byPriority, byStatus, byDepartment, averageResolutionMinutes};
}
