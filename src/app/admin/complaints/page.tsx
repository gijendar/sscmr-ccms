'use client';

import {AdminLayout} from '../components/AdminLayout';
import {AllComplaintsTab} from '../dashboard/AllComplaintsTab';

export default function AllComplaintsPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">All Complaints</h1>
        </div>
        <AllComplaintsTab />
      </div>
    </AdminLayout>
  );
}
