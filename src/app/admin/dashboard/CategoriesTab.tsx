'use client';

import {useState, useEffect} from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryRecord,
} from '@/services/categories';
import {errorMessage} from '@/lib/utils';

export function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((rows) => {
        if (!active) return;
        setCategories(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(errorMessage(e, 'Failed to load categories'));
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
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createCategory(newName.trim());
      setCategories((prev) => [...prev, created].sort(byName));
      setNewName('');
      setNotice(`Category "${created.name}" created and available to students.`);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to create category'));
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (editingId === null || !editName.trim()) return;
    setSavingEdit(true);
    setError(null);
    try {
      const updated = await updateCategory(editingId, {name: editName.trim()});
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)).sort(byName));
      setEditingId(null);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to update category'));
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async (cat: CategoryRecord) => {
    setBusyId(cat.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateCategory(cat.id, {is_active: !cat.is_active});
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (!updated.is_active) {
        setNotice(`"${updated.name}" is now inactive and hidden from the student form. Past complaints keep it.`);
      }
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to update category'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (cat: CategoryRecord) => {
    const confirmed = window.confirm(
      `Permanently delete "${cat.name}"?\n\nIf this category was used by any complaint, deletion will be blocked — deactivate it instead to keep history intact.`,
    );
    if (!confirmed) return;
    setBusyId(cat.id);
    setError(null);
    setNotice(null);
    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch {
      setError(
        `Could not delete "${cat.name}" because complaints reference it. Deactivate it instead to keep historical records intact.`,
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl glass p-5 shadow-sm" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)'}}>
        <h2 className="text-lg font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Complaint Categories</h2>
        <p className="mt-1 text-sm" style={{color: 'rgba(255,255,255,0.6)'}}>
          Categories are loaded from the database into the student complaint form. New categories appear
          automatically — no code change required.
        </p>

        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}} htmlFor="new-category">
              Category Name
            </label>
            <input
              id="new-category"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Lift / Elevator"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              style={{background: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)'}}
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {adding ? 'Creating…' : '+ Create Category'}
          </button>
        </form>
      </div>

      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>
      )}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-2">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg border border-white/20 bg-white/10" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No categories yet. Create one above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl glass shadow-sm" style={{background: 'rgba(255,255,255,0.06)'}}>
          <div className="overflow-x-auto">
            <table className="min-w-[640px] divide-y" style={{borderColor: 'rgba(255,255,255,0.15)'}}>
              <thead className="" style={{background: 'rgba(255,255,255,0.03)'}}>
                <tr>
                  {['Category', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                        h === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((cat) => {
                  const editing = editingId === cat.id;
                  return (
                    <tr key={cat.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        {editing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-800">{cat.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(cat)}
                          disabled={busyId === cat.id}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                            cat.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {editing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                disabled={savingEdit || !editName.trim()}
                                className="rounded-lg border border-green-200 bg-white px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                {savingEdit ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(cat.id);
                                  setEditName(cat.name);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(cat)}
                                disabled={busyId === cat.id}
                                className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
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

function byName(a: CategoryRecord, b: CategoryRecord) {
  return a.name.localeCompare(b.name);
}
