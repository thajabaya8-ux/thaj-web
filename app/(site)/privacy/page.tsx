'use client';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function PrivacyPage() {
  const { L, settings } = useSite();
  const rows: [string, string][] = [
    [L('What\'s collected', 'البيانات اللي بتتجمّع'),
      L('At checkout: your name, phone, email and delivery address, so an order can be reviewed, confirmed over WhatsApp, and delivered. A payment receipt photo is kept to verify the deposit.', 'وقت الدفع: اسمك ورقم موبايلك وإيميلك وعنوان التوصيل، عشان الطلب يتراجع ويتأكد على واتساب ويتوصّل. وبنحتفظ بصورة إيصال الدفع للتأكد من العربون.')],
    [L('How it\'s used', 'إزاي بتتستخدم'),
      L('Only to process and deliver your order, and to reach you about it. It is never sold, and is only shared with the courier delivering your package.', 'بس عشان نجهّز ونوصّل طلبك، ونتواصل معاكي بخصوصه. مبتتباعش، وبتتشارك بس مع شركة الشحن اللي هتوصّل الطرد.')],
    [L('Browsing', 'التصفح'),
      L('The site uses Meta Pixel to understand which pages and pieces are viewed, so we can measure and improve how the shop performs — no payment details ever pass through it.', 'الموقع بيستخدم Meta Pixel عشان نفهم أي صفحات وقطع بتتشاف، وده بيساعدنا نحسّن أداء المتجر — تفاصيل الدفع مبتعديش من خلاله خالص.')],
    [L('Account & selections', 'الحساب والاختيارات'),
      L('Saved pieces and cart selections are kept in your browser only — they are not stored on our servers and are not tied to your identity.', 'القطع المحفوظة واختيارات السلة بتتخزن في المتصفح بتاعك بس — مش متخزنة عندنا ومش مربوطة بهويتك.')],
    [L('Your data, your call', 'بياناتك، وقرارك'),
      L('Ask at any time to see, correct, or delete what we hold about your orders.', 'اطلبي في أي وقت تشوفي أو تصحّحي أو تمسحي البيانات المحفوظة عن طلباتك.')],
    [L('Contact', 'التواصل'),
      settings.contact_email || L('Reach the atelier through the contact details in the footer.', 'تواصلي مع الأتيليه من بيانات التواصل في أسفل الصفحة.')]
  ];
  return (
    <>
      <Mast label={L('Privacy', 'الخصوصية')} title={L('What we hold, and why', 'اللي بنحتفظ بيه، وليه')} />
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
