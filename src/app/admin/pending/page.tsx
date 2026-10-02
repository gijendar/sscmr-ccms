'use client';

import {AdminLayout} from '../components/AdminLayout';
import {PendingTab} from '../dashboard/PendingTab';

export default function PendingPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Pending Complaints</h1>
        </div>
        <PendingTab />
      </div>
    </AdminLayout>
  );
}
