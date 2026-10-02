'use client';

import {AdminLayout} from '../components/AdminLayout';
import {CompletedTab} from '../dashboard/CompletedTab';

export default function CompletedPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Completed Complaints</h1>
        </div>
        <CompletedTab />
      </div>
    </AdminLayout>
  );
}
