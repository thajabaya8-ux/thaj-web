'use client';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function TermsPage() {
  const { L, settings } = useSite();
  const rows: [string, string][] = [
    [L('Orders & pricing', 'الطلبات والأسعار'),
      L('Prices are shown in each piece\'s own currency and are current at the time of viewing. Placing an order does not reserve a piece until the deposit is paid and approved.', 'الأسعار معروضة بعملة كل قطعة زي ما هي وقت الاطلاع عليها. الطلب مبيحجزش القطعة إلا بعد ما العربون يتدفع ويتاعتمد.')],
    [L('Payment', 'الدفع'),
      L('A 50% deposit is collected by Vodafone Cash or InstaPay to confirm an order, reviewed manually by the atelier. The remaining balance is paid on delivery.', 'بيتحصّل عربون ٥٠٪ عن طريق فودافون كاش أو InstaPay لتأكيد الطلب، وبتتم مراجعته يدويًا من الأتيليه. الباقي بيتدفع عند التسليم.')],
    [L('Availability', 'التوفر'),
      L('Each piece is made in a limited run. If a piece sells out between browsing and payment review, the deposit is refunded and you\'ll be offered an alternative where possible.', 'كل قطعة بتتصنع بعدد محدود. لو القطعة خلصت بين التصفح ومراجعة الدفع، العربون بيترجّع ونعرض عليك بديل لو متاح.')],
    [L('Cancellations', 'الإلغاء'),
      L('An order can be cancelled before it\'s shipped by getting in touch directly. Once cancelled, any deposit already paid is refunded.', 'الطلب ممكن يتلغى قبل الشحن بالتواصل المباشر. بعد الإلغاء، أي عربون اتدفع بيترجّع.')],
    [L('Returns & exchanges', 'الإرجاع والاستبدال'),
      L('Covered in full on the Shipping & Returns page.', 'التفاصيل كاملة في صفحة الشحن والإرجاع.')],
    [L('Contact', 'التواصل'),
      settings.contact_email || L('Reach the atelier through the contact details in the footer.', 'تواصلي مع الأتيليه من بيانات التواصل في أسفل الصفحة.')]
  ];
  return (
    <>
      <Mast label={L('Terms', 'الشروط')} title={L('The terms of an order', 'شروط الطلب')} />
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
