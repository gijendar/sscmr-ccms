'use client';

import {AdminLayout} from '../components/AdminLayout';
import {InProgressTab} from '../dashboard/InProgressTab';

export default function InProgressPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">In Progress</h1>
        </div>
        <InProgressTab />
      </div>
    </AdminLayout>
  );
}
