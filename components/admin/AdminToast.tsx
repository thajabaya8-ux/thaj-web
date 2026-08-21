'use client';
import { useAdmin } from '@/lib/adminContext';

export default function AdminToast() {
  const { toastMsg } = useAdmin();
  return <div id="toast" className={toastMsg ? 'on' : ''}>{toastMsg}</div>;
}
