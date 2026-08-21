'use client';
import { useState } from 'react';
import { useSite } from '@/lib/siteContext';

export default function ReviewForm({ pieceId }: { pieceId: string }) {
  const { L, submitReview } = useSite();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const ok = await submitReview(pieceId, { name, email: email || undefined, message });
    setBusy(false);
    if (ok) { setSent(true); setName(''); setEmail(''); setMessage(''); }
  };

  if (sent) {
    return <p className="body rv" style={{ maxWidth: 520 }}>{L('Thank you — your note has reached the atelier.', 'شكرًا — رسالتك وصلت للأتيليه.')}</p>;
  }

  return (
    <form className="form rv" style={{ maxWidth: 520 }} onSubmit={onSubmit}>
      <p className="body" style={{ fontSize: 12.5, marginBottom: 18, color: 'var(--ink-faint)' }}>
        {L('A question about this piece, a size request, or anything else — it goes straight to the atelier.', 'سؤال عن القطعة دي، أو طلب مقاس معيّن، أو أي حاجة تانية — بتوصل للأتيليه على طول.')}
      </p>
      <div className="f2">
        <div className="field"><label>{L('Name', 'الاسم')}</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="field"><label>{L('Email (optional)', 'الإيميل (اختياري)')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <div className="field"><label>{L('Message', 'الرسالة')}</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} required /></div>
      <button className="btn" style={{ width: 'max-content' }} type="submit" disabled={busy}>
        {busy ? L('Sending…', 'بيتبعت…') : L('Send to the atelier', 'ابعتي للأتيليه')}
      </button>
    </form>
  );
}
