'use client';
import { useEffect, useState } from 'react';
import { useSite } from '@/lib/siteContext';

export default function RoomPage() {
  const { L, num, pieces, collections } = useSite();

  // Date.now() is impure, so it can't run directly (even memoized) during
  // render — computed after mount instead, matching React's rules for
  // reading impure/external values (https://react.dev/reference/rules/components-and-hooks-must-be-pure).
  const [sync, setSync] = useState('');
  const [day, setDay] = useState(0);
  // This is React's own prescribed fix for the purity rule above (read
  // impure values after mount, in an effect) — it's flagged by the newer,
  // separate set-state-in-effect rule too, which is in tension with that
  // guidance for this exact case. Reviewed and intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSync(new Date().toLocaleString('en-GB',
      { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      .replace(',', ' ·').replace(/\//g, '.'));
    setDay(Math.floor((Date.now() - new Date(2026, 0, 0).getTime()) / 86400000));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const line: [string, string, number][] = [
    [L('Signature', 'التوقيع'), L('Finishing', 'تشطيب'), 82],
    [L('Resort 26', 'مصيف ٢٦'), L('Embroidery', 'تطريز'), 54],
    [L('Ramadan', 'رمضان'), L('Pattern', 'باترون'), 18]
  ];
  const figs: [string, number, string][] = [
    [L('In archive', 'في الأرشيف'), pieces.length, L('Pieces catalogued', 'قطعة مفهرسة')],
    [L('Chapters', 'الفصول'), Object.keys(collections).length, L('Collections open', 'مجموعة مفتوحة')],
    [L('Atelier', 'الأتيليه'), line.length, L('In production', 'تحت الإنتاج')],
    [L('Calendar', 'التقويم'), day, L('Day of 2026', 'يوم من ٢٠٢٦')]
  ];

  return (
    <section className="dark bleed" style={{ minHeight: '100vh', padding: 'calc(var(--nav-h) + clamp(46px,8vh,96px)) 0 clamp(50px,8vh,100px)' }}>
      <div className="wrap">
        <div className="lbl rv" style={{ color: 'var(--champagne)', marginBottom: 18 }}>{L('Private · Maison Control Room', 'خاص · غرفة تحكم الدار')}</div>
        <h1 className="h-l rv" style={{ marginBottom: 'clamp(40px,6vw,70px)' }}><span className="clip">{L('The state of the house', 'حالة الدار')}</span></h1>
        <div className="split" style={{ gridTemplateColumns: 'repeat(12,1fr)', marginBottom: 'clamp(50px,8vw,100px)' }}>
          {figs.map(([a, b, c]) => (
            <div className="room-fig rv" style={{ gridColumn: 'span 3' }} key={a}>
              <div className="lbl" style={{ marginBottom: 14 }}>{a}</div><b>{num(String(b).padStart(2, '0'))}</b>
              <div className="lbl" style={{ color: 'var(--champagne)', marginTop: 12 }}>{c}</div>
            </div>
          ))}
        </div>
        <div className="lbl rv" style={{ color: 'var(--champagne)', marginBottom: 20 }}>{L('The atelier line', 'خط الأتيليه')}</div>
        {line.map(([n, st, p]) => (
          <div className="lrow rv" key={n}>
            <div><div className="h-s">{n}</div></div>
            <div className="lbar"><b data-w={`${p}%`}></b></div>
            <div className="lbl" style={{ color: 'var(--champagne)' }}>{st} · {num(p)}%</div>
          </div>
        ))}
        <div className="lbl rv" style={{ color: 'var(--champagne)', margin: 'clamp(50px,7vw,90px) 0 20px' }}>{L('Connected services', 'الخدمات المتصلة')}</div>
        <div className="split" style={{ gridTemplateColumns: 'repeat(12,1fr)' }}>
          <div className="panel rv" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
              <span className="lbl">{L('Iggsfield · Image & film', 'إيجزفيلد · صور وفيديو')}</span><span className="stat st-w"><i></i>{L('Limited', 'محدود')}</span>
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 52, lineHeight: 0.9 }}>0</div>
            <div className="lbl" style={{ marginTop: 14, lineHeight: 2.2 }}>{L('Credits · Free plan', 'رصيد · خطة مجانية')}</div>
            <p className="body" style={{ fontSize: 12, marginTop: 20, borderTop: '1px solid var(--on-dark-line)', paddingTop: 16 }}>
              {L('No generation credits remain. Campaign imagery and fabric macros can be produced from here once topped up.', 'مافيش رصيد توليد. صور الحملة ولقطات القماش المقربة ممكن تتعمل من هنا بعد الشحن.')}
            </p>
          </div>
          <div className="panel rv" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
              <span className="lbl">{L('The desk · Gmail', 'المكتب · جيميل')}</span><span className="stat st-o"><i></i>{L('Re-auth', 'إعادة ربط')}</span>
            </div>
            {[L('Unread', 'غير مقروء'), L('Awaiting reply', 'بانتظار رد'), L('Suppliers', 'الموردين')].map((k) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--on-dark-line)' }} key={k}>
                <span className="lbl">{k}</span><b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 14 }}>—</b>
              </div>
            ))}
            <p className="body" style={{ fontSize: 12, marginTop: 18 }}>{L('Token expired. Re-authorize the connector and this fills with the house inbox.', 'التوكن انتهى. أعيدي ربط الكونكتور والجزء ده هيمتلي ببريد الدار.')}</p>
          </div>
          <div className="panel rv" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
              <span className="lbl">{L('Local atelier', 'الأتيليه المحلي')}</span><span className="stat st-o"><i></i>{L('None', 'لا يوجد')}</span>
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 52, lineHeight: 0.9 }}>—</div>
            <div className="lbl" style={{ marginTop: 14 }}>{L('Folders connected', 'مجلدات متصلة')}</div>
            <p className="body" style={{ fontSize: 12, marginTop: 20, borderTop: '1px solid var(--on-dark-line)', paddingTop: 16 }}>
              {L('Connect the folder holding lookbooks and photography and the archive reads from it directly.', 'اربطي المجلد اللي فيه اللوك بوك والتصوير والأرشيف هيقرأ منه مباشرة.')}
            </p>
          </div>
        </div>
        <div className="lbl rv" style={{ marginTop: 40, color: 'var(--on-dark-soft)', lineHeight: 2.4 }}>{L('Data read at', 'البيانات مقروءة في')} {sync} · {L('Cairo', 'القاهرة')}</div>
      </div>
    </section>
  );
}
