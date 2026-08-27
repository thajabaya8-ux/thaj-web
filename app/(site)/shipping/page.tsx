'use client';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function ShippingPage() {
  const { L, esc, settings } = useSite();
  const rows: [string, string][] = [
    [L('Deposit & confirmation', 'العربون والتأكيد'),
      L('A 50% deposit is paid at checkout by Vodafone Cash or InstaPay to confirm an order. The atelier reviews the payment before the piece is prepared; you\'ll hear back over WhatsApp once it\'s checked.', 'بيتحصّل عربون ٥٠٪ وقت الدفع عن طريق فودافون كاش أو InstaPay عشان يتأكد الطلب. الأتيليه بيراجع الدفع قبل ما القطعة تتجهّز، وهيوصلك رد على واتساب بعد المراجعة.')],
    [L('Delivery area', 'منطقة التوصيل'),
      L('Delivered across Egypt\'s governorates. The shipping fee depends on your governorate and is shown at checkout before you pay.', 'التوصيل متاح لكل محافظات مصر. رسوم الشحن بتختلف حسب المحافظة، وبتظهر لك وقت الدفع قبل ما تأكدي.')],
    [L('On delivery', 'عند التسليم'),
      L('The remaining balance is paid to the courier on delivery, in cash.', 'الباقي بيتدفع للمندوب وقت التسليم، كاش.')],
    [L('Returns & exchanges', 'الاسترجاع والاستبدال'),
      L(esc(settings.return_policy_en), esc(settings.return_policy_ar))]
  ];
  return (
    <>
      <Mast label={L('Shipping & Returns', 'الشحن والإرجاع')} title={L('How an order gets to you', 'إزاي الطلب بيوصلك')} />
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
