'use client';

import {AdminLayout} from '../components/AdminLayout';
import {CategoriesTab} from '../dashboard/CategoriesTab';

export default function CategoriesPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Categories</h1>
        </div>
        <CategoriesTab />
      </div>
    </AdminLayout>
  );
}
