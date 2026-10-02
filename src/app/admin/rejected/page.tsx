'use client';

import {AdminLayout} from '../components/AdminLayout';
import {RejectedTab} from '../dashboard/RejectedTab';

export default function RejectedPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Rejected Complaints</h1>
        </div>
        <RejectedTab />
      </div>
    </AdminLayout>
  );
}
