'use client';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function CarePage() {
  const { L } = useSite();
  const rows: [string, string][] = [
    [L('Cleaning', 'التنظيف'),
      L('Dry clean only. Crepe, jacquard, linen and plissé finishes can lose their shape or sheen in a washing machine.', 'تنظيف جاف فقط. أقمشة الكريب والجاكار والكتان والبليسيه ممكن تفقد شكلها أو لمعتها لو غسلت في الغسالة.')],
    [L('Ironing', 'الكي'),
      L('Iron on the reverse side, on a low-to-medium heat, with a pressing cloth between the iron and any embroidery or lace.', 'كوي من الوش التاني، على حرارة متوسطة إلى منخفضة، وحطي قطعة قماش بين المكواة وأي تطريز أو دانتيل.')],
    [L('Storage', 'التخزين'),
      L('Hang on a padded hanger, away from direct sunlight, so colour and drape hold. Avoid folding for long periods — it can leave creases in structured pieces.', 'علّقيها على شماعة مبطّنة، بعيد عن الشمس المباشرة، عشان اللون والسقوط يفضلوا زي ما هما. تجنّبي الطي لفترات طويلة — ممكن يسيب كسور في القطع المجسّمة.')],
    [L('Trousers (where included)', 'البنطلون (لو موجود)'),
      L('Care the same as the abaya — dry clean, and iron on the reverse side.', 'نفس عناية العباية — تنظيف جاف، وكي من الوش التاني.')],
    [L('A note on colour', 'ملاحظة عن اللون'),
      L('Deep, saturated shades (burgundy, navy, black) may release a small amount of dye on first clean — this is normal and settles after.', 'الدرجات الغامقة (الخمري، الكحلي، الأسود) ممكن يطلع منها لون بسيط أول تنظيفة — ده طبيعي وبيهدأ بعدها.')]
  ];
  return (
    <>
      <Mast label={L('Care & Repair', 'العناية والإصلاح')} title={L('Keeping a piece as it was named', 'إزاي تحافظي على القطعة زي ما اتسمّت')} />
      <section className="pad wrap-n">
        <div className="spec" style={{ marginTop: 0 }}>
          {rows.map(([k, v]) => (
            <div className="r" key={k} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <span className="k">{k}</span>
              <p className="body" style={{ maxWidth: '60ch' }}>{v}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
