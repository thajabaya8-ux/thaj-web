import './admin.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminProvider } from '@/lib/adminContext';
import AdminGate from '@/components/admin/AdminGate';

export const metadata: Metadata = { title: 'THAJ — Control Room' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminGate>{children}</AdminGate>
    </AdminProvider>
  );
}
