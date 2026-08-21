'use client';
import { useSite } from '@/lib/siteContext';

export default function Toast() {
  const { toastMsg } = useSite();
  return <div id="toast" className={toastMsg ? 'on' : ''}>{toastMsg}</div>;
}
