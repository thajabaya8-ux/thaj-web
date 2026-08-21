'use client';
import { useRef } from 'react';
import { useSite } from '@/lib/siteContext';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export default function PrivateRoomPage() {
  const { L, submitAppointment } = useSite();
  const formRef = useRef<HTMLFormElement>(null);
  const bullets = [
    L('Preview of the coming chapter', 'معاينة الفصل الجاي'),
    L('Made-to-measure consultation', 'استشارة تفصيل'),
    L('Private styling session', 'جلسة تنسيق خاصة'),
    L('Archive viewing', 'معاينة الأرشيف')
  ];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data: Record<string, string> = {};
    form.querySelectorAll<FormEl>('[data-f]').forEach((el) => { if (el.dataset.f) data[el.dataset.f] = el.value; });
    const ok = await submitAppointment(data);
    if (ok) form.reset();
  };

  return (
    <section className="dark bleed" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: 'calc(var(--nav-h) + clamp(50px,9vh,110px)) 0 clamp(60px,10vh,120px)' }}>
      <div className="wrap split" style={{ gridTemplateColumns: 'repeat(12,1fr)', alignItems: 'center' }}>
        <div style={{ gridColumn: '1/6' }}>
          <div className="lbl rv" style={{ color: 'var(--champagne)', marginBottom: 20 }}>{L('By appointment only', 'بموعد فقط')}</div>
          <h1 className="h-l rv"><span className="clip">{L('The Private Room', 'الغرفة الخاصة')}</span></h1>
          <p className="body rv" style={{ marginTop: 26, maxWidth: '42ch' }}>{L('Collection previews before release. Bespoke commissions. Personal styling. In Riyadh, or by video for clients abroad.', 'معاينة المجموعات قبل النزول. طلبات تفصيل خاصة. تنسيق شخصي. في الرياض، أو بالفيديو للعميلات بره.')}</p>
          <div className="rv" style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bullets.map((x) => (
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }} key={x}>
                <span style={{ color: 'var(--champagne)' }}>—</span><span className="body" style={{ fontSize: 13 }}>{x}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '7/13' }}>
          <form className="form rv" ref={formRef} onSubmit={onSubmit}>
            <div className="f2">
              <div className="field"><label>{L('Name', 'الاسم')}</label><input data-f="name" required placeholder={L('Full name', 'الاسم كامل')} /></div>
              <div className="field"><label>{L('Email', 'الإيميل')}</label><input data-f="email" type="email" required placeholder="you@domain.com" /></div>
            </div>
            <div className="f2">
              <div className="field"><label>{L('Preferred date', 'التاريخ المفضّل')}</label><input data-f="date" type="date" required /></div>
              <div className="field"><label>{L('Time', 'الوقت')}</label>
                <select data-f="time"><option>{L('Morning', 'صباحًا')}</option><option>{L('Afternoon', 'بعد الظهر')}</option><option>{L('Evening', 'مساءً')}</option></select>
              </div>
            </div>
            <div className="field"><label>{L('Type of appointment', 'نوع الموعد')}</label>
              <select data-f="type">
                <option>{L('Collection preview', 'معاينة مجموعة')}</option><option>{L('Made to measure', 'تفصيل')}</option>
                <option>{L('Personal styling', 'تنسيق شخصي')}</option><option>{L('Archive viewing', 'معاينة الأرشيف')}</option>
              </select>
            </div>
            <div className="field"><label>{L('In person or video', 'حضوري ولا فيديو')}</label>
              <select data-f="mode"><option>{L('Riyadh — atelier', 'الرياض — الأتيليه')}</option><option>{L('Video call', 'مكالمة فيديو')}</option></select>
            </div>
            <div className="field"><label>{L('Anything we should know', 'أي حاجة نعرفها')}</label>
              <textarea data-f="notes" placeholder={L('Occasion, pieces you have in mind, measurements already held…', 'المناسبة، قطع في بالك، مقاسات محفوظة عندنا…')} />
            </div>
            <button className="btn wide" type="submit" style={{ borderColor: 'var(--champagne)', color: 'var(--on-dark)' }}>{L('Request the room', 'اطلبي الغرفة')}</button>
          </form>
        </div>
      </div>
    </section>
  );
}
