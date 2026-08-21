'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import Sidebar from './Sidebar';
import AdminToast from './AdminToast';

// Protects every /admin/* page: signed out, or signed in as a customer
// account, both send the visitor to the shared /login page instead of
// this shell — even if they typed the /admin URL directly.
export default function AdminGate({ children }: { children: ReactNode }) {
  const { me } = useAdmin();
  const router = useRouter();

  useEffect(() => { if (me === null) router.replace('/login'); }, [me, router]);

  if (me === undefined || me === null) return null; // brief session check, or redirecting

  return (
    <div id="shell">
      <Sidebar />
      <main className="adm-main">{children}</main>
      <AdminToast />
    </div>
  );
}
