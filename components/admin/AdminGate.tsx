'use client';
import type { ReactNode } from 'react';
import { useAdmin } from '@/lib/adminContext';
import LoginForm from './LoginForm';
import Sidebar from './Sidebar';
import AdminToast from './AdminToast';

export default function AdminGate({ children }: { children: ReactNode }) {
  const { me } = useAdmin();

  if (me === undefined) return null; // brief session check on first load
  if (me === null) return <LoginForm />;

  return (
    <div id="shell">
      <Sidebar />
      <main className="adm-main">{children}</main>
      <AdminToast />
    </div>
  );
}
