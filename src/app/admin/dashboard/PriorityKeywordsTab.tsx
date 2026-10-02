'use client';

import {useState, useEffect} from 'react';
import {
  getPriorityKeywords,
  createPriorityKeyword,
  updatePriorityKeyword,
  deletePriorityKeyword,
  type PriorityKeywordRecord,
} from '@/services/complaint';
import {PriorityLevel, PriorityScore} from '@/types/complaint';
import {PriorityBadge} from '@/app/components/PriorityBadge';
import {errorMessage} from '@/lib/utils';

const LEVELS: PriorityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const SCORE_BY_LEVEL: Record<PriorityLevel, PriorityScore> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function PriorityKeywordsTab() {
  const [keywords, setKeywords] = useState<PriorityKeywordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newKeyword, setNewKeyword] = useState('');
  const [newLevel, setNewLevel] = useState<PriorityLevel>('CRITICAL');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editKeyword, setEditKeyword] = useState('');
  const [editLevel, setEditLevel] = useState<PriorityLevel>('MEDIUM');
  const [savingEdit, setSavingEdit] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getPriorityKeywords()
      .then((rows) => {
        if (!active) return;
        setKeywords(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(errorMessage(e, 'Failed to load priority keywords'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const created = await createPriorityKeyword({
        keyword: newKeyword.trim(),
        priority_level: newLevel,
        priority_score: SCORE_BY_LEVEL[newLevel],
      });
      setKeywords((prev) => sortKeywords([...prev, created]));
      setNewKeyword('');
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to add keyword'));
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (kw: PriorityKeywordRecord) => {
    setEditingId(kw.id);
    setEditKeyword(kw.keyword);
    setEditLevel(kw.priority_level);
  };

  const handleSaveEdit = async () => {
    if (editingId === null || !editKeyword.trim()) return;
    setSavingEdit(true);
    setError(null);
    try {
      const updated = await updatePriorityKeyword(editingId, {
        keyword: editKeyword.trim(),
        priority_level: editLevel,
        priority_score: SCORE_BY_LEVEL[editLevel],
      });
      setKeywords((prev) => sortKeywords(prev.map((k) => (k.id === updated.id ? updated : k))));
      setEditingId(null);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to update keyword'));
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async (kw: PriorityKeywordRecord) => {
    setBusyId(kw.id);
    setError(null);
    try {
      const updated = await updatePriorityKeyword(kw.id, {is_active: !kw.is_active});
      setKeywords((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to update keyword'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (kw: PriorityKeywordRecord) => {
    if (!window.confirm(`Delete the keyword "${kw.keyword}"? Existing complaints keep their stored priority.`)) {
      return;
    }
    setBusyId(kw.id);
    setError(null);
    try {
      await deletePriorityKeyword(kw.id);
      setKeywords((prev) => prev.filter((k) => k.id !== kw.id));
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to delete keyword'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl glass p-5 shadow-sm" style={{background: 'rgba(255,255,255,0.06)'}}>
        <h2 className="text-lg font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Priority Keywords</h2>
        <p className="mt-1 text-sm" style={{color: 'rgba(255,255,255,0.65)'}}>
          Keywords are matched (case-insensitively) against the complaint category and description when a
          complaint is submitted. The highest matching level decides the priority. Changing a keyword here never
          recalculates existing complaints.
        </p>

        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">              <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}} htmlFor="new-keyword">
              Keyword
            </label>              <input
              id="new-keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. short circuit"
              className="mt-1 w-full rounded-lg border border-white/20 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              style={{background: 'rgba(255,255,255,0.05)', color: '#ffffff'}}
            />
          </div>
          <div>              <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}} htmlFor="new-priority">
              Priority
            </label>              <select
                id="new-priority"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value as PriorityLevel)}
                className="mt-1 rounded-lg border border-white/20 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                style={{background: 'rgba(255,255,255,0.05)', color: '#ffffff'}}
              >

              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>            <button
            type="submit"
            disabled={adding || !newKeyword.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {adding ? 'Adding…' : '+ Add Priority Keyword'}
          </button>

        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg border border-white/20 bg-white/10" />
          ))}
        </div>
      ) : keywords.length === 0 ? (
        <div className="rounded-xl glass p-8 text-center" style={{background: 'rgba(255,255,255,0.06)'}}>
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.7)'}}>
            No priority keywords yet. Add one above to start automatic prioritization.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl glass shadow-sm" style={{background: 'rgba(255,255,255,0.06)'}}>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] divide-y" style={{borderColor: 'rgba(255,255,255,0.15)'}}>
              <thead className="border-b" style={{borderBottomColor: 'rgba(255,255,255,0.2)'}}>
                <tr>
                  {['Keyword', 'Priority', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider`}
                      style={{color: h === 'Actions' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)'}}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {keywords.map((kw) => {
                  const editing = editingId === kw.id;
                  return (
                    <tr key={kw.id} className="transition-colors hover:bg-white/10">
                      <td className="px-4 py-3">
                        {editing ? (
                          <input
                            value={editKeyword}
                            onChange={(e) => setEditKeyword(e.target.value)}
                            className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-white placeholder-white/50"
                          />
                        ) : (
                          <span className="text-sm font-medium text-white">{kw.keyword}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <select
                            value={editLevel}
                            onChange={(e) => setEditLevel(e.target.value as PriorityLevel)}
                            className="rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-white"
                          >
                            {LEVELS.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <PriorityBadge level={kw.priority_level} size="sm" showScore />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(kw)}
                          disabled={busyId === kw.id}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                            kw.is_active
                              ? 'bg-green-500/20 text-green-200 hover:bg-green-500 hover:text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {kw.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {editing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                disabled={savingEdit || !editKeyword.trim()}
                                className="rounded-lg border border-green-300/60 bg-green-500/20 px-2.5 py-1.5 text-xs font-medium text-green-200 hover:bg-green-500 hover:text-white disabled:opacity-50"
                              >
                                {savingEdit ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(kw)}
                                className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(kw)}
                                disabled={busyId === kw.id}
                                className="rounded-lg border border-red-300/60 bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500 hover:text-white disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function sortKeywords(rows: PriorityKeywordRecord[]): PriorityKeywordRecord[] {
  return [...rows].sort(
    (a, b) => b.priority_score - a.priority_score || a.keyword.localeCompare(b.keyword),
  );
}
