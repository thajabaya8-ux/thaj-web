import type { ReactNode } from 'react';

export default function Mast({ label, title, desc }: { label: ReactNode; title: ReactNode; desc?: ReactNode }) {
  return (
    <section className="masthead bleed">
      <div className="wrap mh">
        <div className="t">
          <div className="lbl rv">{label}</div>
          <h1 className="h-l rv"><span className="clip">{title}</span></h1>
        </div>
        {desc ? <div className="d rv">{desc}</div> : null}
      </div>
    </section>
  );
}
