'use client';

import {AdminLayout} from '../components/AdminLayout';
import {PrioritiesTab} from '../dashboard/PriorityQueueTab';

export default function PriorityPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Priority Queue</h1>
        </div>
        <PrioritiesTab />
      </div>
    </AdminLayout>
  );
}
