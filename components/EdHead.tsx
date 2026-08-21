import type { ReactNode } from 'react';

export default function EdHead({ n, title, aside }: { n: ReactNode; title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="ed-head">
      <div className="n rv">{n}</div>
      <h2 className="h-l rv"><span className="clip">{title}</span></h2>
      <div className="aside body rv">{aside}</div>
    </div>
  );
}
