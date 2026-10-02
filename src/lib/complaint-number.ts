import {supabase} from './supabase';

/**
 * Complaint numbers follow the format:
 * CMP-YYYY-NNNNN
 *
 * Example: CMP-2026-00125
 *
 * Generation is database-safe: `next_complaint_number()` runs inside Postgres
 * as the table owner (SECURITY DEFINER) and returns the next value for the
 * current year. This is required because students are anonymous and RLS grants
 * them INSERT but NOT SELECT on `complaints`, so the browser cannot read the
 * current maximum itself. The UNIQUE constraint on `complaint_number` remains
 * the final guard; callers retry on a 23505 duplicate using a freshly
 * generated number.
 */

export async function generateComplaintNumber(): Promise<string> {
  const {data, error} = await supabase.rpc('next_complaint_number');

  if (error || typeof data !== 'string' || data.length === 0) {
    throw new Error('Failed to generate complaint number');
  }

  return data;
}

function parseComplaintNumberInternal(complaintNumber: string): {
  year: number;
  sequence: number;
} | null {
  const match = complaintNumber.match(/^CMP-(\d{4})-(\d+)$/);
  if (!match) {
    return null;
  }
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

export function parseComplaintNumberToId(complaintNumber: string): number | null {
  const parsed = parseComplaintNumberInternal(complaintNumber);
  return parsed ? parsed.sequence : null;
}

export { parseComplaintNumberInternal as parseComplaintNumber };
