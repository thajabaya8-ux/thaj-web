'use client';
import { useEffect, useState } from 'react';

export default function Curtain() {
  const [go, setGo] = useState(false);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setGo(true), 120);
    const t2 = setTimeout(() => setOut(true), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div id="curtain" className={`${go ? 'go' : ''} ${out ? 'out' : ''}`.trim()}>
      <img className="c-mark" src="/assets/logo/logo-beige.png" alt="THAJ" />
      <div className="c-sub lbl" style={{ color: 'var(--on-dark-soft)' }}>
        THAJ ABAYA BRAND &nbsp;·&nbsp; دار ثاج للأزياء
      </div>
    </div>
  );
}
