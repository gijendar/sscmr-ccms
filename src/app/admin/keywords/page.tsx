'use client';

import {AdminLayout} from '../components/AdminLayout';
import {PriorityKeywordsTab} from '../dashboard/PriorityKeywordsTab';

export default function PriorityKeywordsPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Priority Keywords</h1>
        </div>
        <PriorityKeywordsTab />
      </div>
    </AdminLayout>
  );
}
