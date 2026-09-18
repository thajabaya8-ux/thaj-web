'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Curtain() {
  const [go, setGo] = useState(false);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setGo(true), 120);
    const t2 = setTimeout(() => setOut(true), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div id="curtain" className={`${go ? 'go' : ''} ${out ? 'out' : ''}`.trim()}>
      <div className="c-glow" />
      <div className="c-mark-wrap">
        <Image className="c-mark" src="/assets/logo/logo-beige.png" alt="THAJ" width={1200} height={552} priority />
        <div className="c-shimmer" />
      </div>
      <div className="c-sub lbl" style={{ color: 'var(--on-dark-soft)' }}>
        THAJ ABAYA BRAND &nbsp;·&nbsp; دار ثاج للأزياء
      </div>
    </div>
  );
}
