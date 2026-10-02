'use client';

import {AdminLayout} from '../components/AdminLayout';
import {AnalyticsTab} from '../dashboard/AnalyticsTab';

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        </div>
        <AnalyticsTab />
      </div>
    </AdminLayout>
  );
}
