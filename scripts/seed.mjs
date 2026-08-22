/* Populates Neon with the demo content (ported from
   thaj-site/server/seed.js) and creates the admin user from env.
   Idempotent — safe to re-run.
   Usage: npm run seed */
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/seed.mjs');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const P = (i) => `assets/pieces/${String(i + 1).padStart(2, '0')}.jpg`;

const COLLECTIONS = [
  { key: 'signature', sort: 0, name_en: 'Signature', name_ar: 'التوقيع', ar: 'التوقيع', image: P(9),
    line_en: 'The first silence', line_ar: 'الصمت الأول',
    concept_en: 'The founding chapter. Black upon black — texture doing the work colour usually does. Every piece here is cut from a single fall of fabric so the silhouette never breaks at the waist.',
    concept_ar: 'الفصل التأسيسي. أسود فوق أسود — الملمس هو اللي بيقوم بدور اللون. كل قطعة هنا مقصوصة من سقوط واحد للقماش، فالسيلويت ما بينكسرش عند الخصر.',
    mood_en: 'Architectural · Nocturnal · Absolute', mood_ar: 'معماري · ليلي · مطلق' },
  { key: 'resort', sort: 1, name_en: 'Resort 26', name_ar: 'مصيف ٢٦', ar: 'مصيف', image: P(6),
    line_en: 'Painted light', line_ar: 'ضوء مرسوم',
    concept_en: 'Linen and voile printed by hand, each length slightly different from the last. Made for long afternoons and the hour before the light goes.',
    concept_ar: 'كتان وفوال مطبوعين باليد، كل قطعة مختلفة شوية عن اللي قبلها. مصمّمة لأصائل طويلة وللساعة اللي قبل ما الضوء يروح.',
    mood_en: 'Sunlit · Loose · Painterly', mood_ar: 'مشمس · فضفاض · تصويري' },
  { key: 'evening', sort: 2, name_en: 'Evening', name_ar: 'سهرة', ar: 'سهرة', image: P(4),
    line_en: 'After dark', line_ar: 'بعد المغيب',
    concept_en: 'Silk-satin, guipure and crepe. Pieces that hold a room without raising their voice — reserved for the hours when the house dresses.',
    concept_ar: 'ساتان حرير، وقيبور، وكريب. قطع بتملأ المكان من غير ما ترفع صوتها — محجوزة للساعات اللي البيت بيتزيّن فيها.',
    mood_en: 'Liquid · Quiet · Ceremonial', mood_ar: 'سائل · هادئ · احتفالي' },
  { key: 'ramadan', sort: 3, name_en: 'Ramadan', name_ar: 'رمضان', ar: 'رمضان', image: P(8),
    line_en: 'Ivory nights', line_ar: 'ليالٍ عاجية',
    concept_en: 'Ivory, cream and champagne in textured jacquard. Cut generously for a month spent sitting, standing, receiving.',
    concept_ar: 'عاجي وكريمي وشمبانيا في جاكار مُحبّك. مقصوصة بسخاء لشهر بيتقضّى في القعدة والوقوف واستقبال الناس.',
    mood_en: 'Warm · Generous · Still', mood_ar: 'دافئ · سخي · ساكن' }
];

const PIECES = [
  { id: 'najma', img: 0, ed: 'ED. 001', name_en: 'NAJMA', name_ar: 'نجمة', price: 2450, coll_key: 'signature',
    fabric: 'Jacquard', sil: 'Straight fall', colour: 'Black', occ: 'Occasion',
    mat_en: 'Black jacquard, gold-plated clasp', mat_ar: 'جاكار أسود، مشبك مطلي بالذهب',
    silf_en: 'Open abaya, straight fall', silf_ar: 'عباية مفتوحة، سقوط مستقيم',
    pal_en: 'Onyx / Gold', pal_ar: 'عقيق / ذهبي', availability: 'Available',
    desc_en: 'A single fall of black jacquard, closed at the chest with a gold-plated clasp cast in the shape of a star. Nothing else interrupts the line.',
    desc_ar: 'سقوط واحد من الجاكار الأسود، مقفول عند الصدر بمشبك مطلي بالذهب على شكل نجمة. مافيش أي حاجة تانية بتقطع الخط.',
    story_en: ['The jacquard is woven with a leaf motif that only appears when the light moves across it. From three metres away the piece reads as flat black; from one it does not.', 'The clasp is the only ornament, and it is the only ornament the piece needs.'],
    story_ar: ['الجاكار منسوج برسمة ورق شجر ما بتبانش غير لما الضوء يعدّي عليها. من على بعد تلات أمتار القطعة أسود سادة؛ من على متر واحد لأ.', 'المشبك هو الزخرفة الوحيدة، وهو الزخرفة الوحيدة اللي القطعة محتاجاها.'] },
  { id: 'fahm', img: 9, ed: 'ED. 002', name_en: 'FAHM', name_ar: 'فحم', price: 2200, coll_key: 'signature',
    fabric: 'Jacquard', sil: 'Column', colour: 'Black', occ: 'Everyday',
    mat_en: 'Crushed jacquard, pearl buttons', mat_ar: 'جاكار مكرمش، أزرار لؤلؤ',
    silf_en: 'Column, bishop sleeve', silf_ar: 'عمودي، كم أسقفي',
    pal_en: 'Onyx', pal_ar: 'عقيق', availability: 'Available',
    desc_en: 'Crushed jacquard that holds its creases on purpose. A column silhouette with a bishop sleeve gathered at the cuff.',
    desc_ar: 'جاكار مكرمش بيحتفظ بكرمشته بقصد. سيلويت عمودي بكم أسقفي مجمّع عند الأسورة.',
    story_en: ['Crushing is done after dyeing, by hand, in small lengths — which is why no two pieces fall in exactly the same way.', 'The pearl buttons run from throat to hip and are functional to the last.'],
    story_ar: ['الكرمشة بتتعمل بعد الصباغة، باليد، في أطوال صغيرة — عشان كده مافيش قطعتين بيسقطوا بنفس الطريقة بالظبط.', 'أزرار اللؤلؤ ماشية من الرقبة للورك، وكلها شغّالة لآخر واحد.'] },
  { id: 'layla', img: 1, ed: 'ED. 003', name_en: 'LAYLA', name_ar: 'ليلى', price: 2850, coll_key: 'signature',
    fabric: 'Crepe', sil: 'Fitted placket', colour: 'Black', occ: 'Evening',
    mat_en: 'Crepe with guipure lace', mat_ar: 'كريب مع دانتيل قيبور',
    silf_en: 'Fitted placket, flared cuff', silf_ar: 'صدر مضبوط، أسورة واسعة',
    pal_en: 'Onyx / Ecru', pal_ar: 'عقيق / إكرو', availability: 'Two remaining',
    desc_en: 'Heavy crepe with guipure lace set into the chest panel and the cuff. The lace is applied, not printed, and edged by hand.',
    desc_ar: 'كريب تقيل مع دانتيل قيبور مركّب في بانل الصدر والأسورة. الدانتيل مركّب مش مطبوع، ومحوّط باليد.',
    story_en: ['Each chest panel takes an afternoon to set. The lace is positioned against the body of the wearer, not against a pattern block.', 'Two remain from the first run of twelve.'],
    story_ar: ['كل بانل صدر بياخد أصيلة كاملة عشان يتركّب. الدانتيل بيتظبط على جسم اللابسة، مش على باترون.', 'باقي قطعتين من أول تشغيلة اتعملت منها اتناشر.'] },
  { id: 'harir', img: 4, ed: 'ED. 004', name_en: 'HARIR', name_ar: 'حرير', price: 3400, coll_key: 'evening',
    fabric: 'Silk', sil: 'Draped khimar', colour: 'Blush', occ: 'Evening',
    mat_en: 'Silk-satin, matte reverse', mat_ar: 'ساتان حرير، ظهر مطفي',
    silf_en: 'Draped khimar', silf_ar: 'خمار منسدل',
    pal_en: 'Blush / Rose', pal_ar: 'وردي فاتح / وردي', availability: 'By request',
    desc_en: 'Silk-satin cut on the bias so it pours rather than hangs. Worn matte-side out for daylight, satin-side out after dark.',
    desc_ar: 'ساتان حرير مقصوص على الباياس عشان ينسكب مش يتعلّق. بتتلبس بالوش المطفي بالنهار، وبالوش اللامع بالليل.',
    story_en: ['The bias cut costs nearly twice the fabric of a straight cut. It is the reason the piece moves the way it does.', 'Made to order — allow three weeks.'],
    story_ar: ['القص على الباياس بيستهلك تقريبًا ضعف قماش القص المستقيم. وده السبب إن القطعة بتتحرك بالشكل ده.', 'بتتعمل حسب الطلب — احسب تلات أسابيع.'] },
  { id: 'khamri', img: 7, ed: 'ED. 005', name_en: 'KHAMRI', name_ar: 'خمري', price: 2650, coll_key: 'evening',
    fabric: 'Crepe', sil: 'Open abaya', colour: 'Burgundy', occ: 'Occasion',
    mat_en: 'Crinkle crepe, lace cuff', mat_ar: 'كريب كرينكل، أسورة دانتيل',
    silf_en: 'Open abaya, wide sleeve', silf_ar: 'عباية مفتوحة، كم واسع',
    pal_en: 'Burgundy / Linen', pal_ar: 'خمري / كتاني', availability: 'Available',
    desc_en: 'Deep burgundy crinkle crepe with a wide sleeve and a lace cuff. Worn open over ivory linen in the campaign.',
    desc_ar: 'كريب كرينكل خمري غامق بكم واسع وأسورة دانتيل. في الحملة اتلبست مفتوحة فوق كتان عاجي.',
    story_en: ['Burgundy was matched to a swatch of Nejd carpet wool held in the atelier since the first season.', 'The sleeve is wide enough to fall clear of the wrist when the arm is raised.'],
    story_ar: ['الخمري اتظبط على عيّنة صوف سجاد نجدي متحفوظة في الأتيليه من أول موسم.', 'الكم واسع كفاية إنه يبعد عن الرسغ لما الذراع ترتفع.'] },
  { id: 'warda', img: 3, ed: 'ED. 006', name_en: 'WARDA', name_ar: 'وردة', price: 1950, coll_key: 'resort',
    fabric: 'Voile', sil: 'Open abaya', colour: 'Rose', occ: 'Day',
    mat_en: 'Hand-painted stripe voile', mat_ar: 'فوال مقلّم مرسوم باليد',
    silf_en: 'Open abaya, belted set', silf_ar: 'عباية مفتوحة، طقم بحزام',
    pal_en: 'Rose / Sage', pal_ar: 'وردي / مريمي', availability: 'Available',
    desc_en: 'Voile painted in a soft rose and sage stripe, each length brushed by hand so the stripe wanders slightly.',
    desc_ar: 'فوال مرسوم بقلم وردي هادي ومريمي، كل طول متفرشح باليد فالقلم بيتمايل شوية.',
    story_en: ['The stripe is painted wet-on-wet, which is why the colours bleed into one another rather than meeting at a line.', 'Sold with the belted ivory set worn beneath.'],
    story_ar: ['القلم بيتحطّ لون على لون وهو لسه مبلول، عشان كده الألوان بتسيح في بعض بدل ما تتقابل عند خط.', 'بتتباع مع الطقم العاجي بالحزام اللي تحتها.'] },
  { id: 'zaytoon', img: 6, ed: 'ED. 007', name_en: 'ZAYTOON', name_ar: 'زيتون', price: 2100, coll_key: 'resort',
    fabric: 'Linen', sil: 'Open abaya', colour: 'Olive', occ: 'Day',
    mat_en: 'Brushstroke stripe linen', mat_ar: 'كتان بقلم فرشاة',
    silf_en: 'Open abaya, belted set', silf_ar: 'عباية مفتوحة، طقم بحزام',
    pal_en: 'Olive / Ivory', pal_ar: 'زيتي / عاجي', availability: 'Available',
    desc_en: 'Washed linen carrying a broad olive brushstroke. Structured at the shoulder, unstructured everywhere after.',
    desc_ar: 'كتان مغسول شايل ضربة فرشاة زيتية عريضة. مبنية عند الكتف، وسايبة في كل حتة بعد كده.',
    story_en: ['Linen is washed three times before cutting so the piece does not change shape after the first wear.', 'The brushstroke is registered to the shoulder seam, so it reads as one continuous mark across the back.'],
    story_ar: ['الكتان بيتغسل تلات مرات قبل القص عشان القطعة ما تغيّرش شكلها بعد أول لبسة.', 'ضربة الفرشاة مظبوطة على درزة الكتف، فبتتقرا كعلامة واحدة متصلة على الضهر.'] },
  { id: 'sadaf', img: 8, ed: 'ED. 008', name_en: 'SADAF', name_ar: 'صدف', price: 2750, coll_key: 'ramadan',
    fabric: 'Jacquard', sil: 'Three-piece set', colour: 'Ivory', occ: 'Ramadan',
    mat_en: 'Textured ivory jacquard', mat_ar: 'جاكار عاجي مُحبّك',
    silf_en: 'Three-piece set', silf_ar: 'طقم ثلاث قطع',
    pal_en: 'Ivory / Cream', pal_ar: 'عاجي / كريمي', availability: 'Pre-order',
    desc_en: 'A three-piece in textured ivory jacquard: abaya, shirt and wide trouser, intended to be broken up and worn apart.',
    desc_ar: 'طقم تلات قطع من جاكار عاجي محبّك: عباية وقميص وبنطلون واسع، متصمّم إنه يتفكّ ويتلبس منفصل.',
    story_en: ['Ivory is the hardest colour to cut cleanly — every seam shows. This is the reason it is the last piece the atelier makes each season.', 'Pre-order now for delivery before the month begins.'],
    story_ar: ['العاجي أصعب لون في القص النضيف — كل درزة بتبان. عشان كده هو آخر قطعة الأتيليه بيعملها كل موسم.', 'احجزي دلوقتي للتسليم قبل ما الشهر يبدأ.'] },
  { id: 'ramad', img: 10, ed: 'ED. 009', name_en: 'RAMAD', name_ar: 'رماد', price: 1750, coll_key: 'resort',
    fabric: 'Linen', sil: 'Open abaya', colour: 'Grey', occ: 'Everyday',
    mat_en: 'Striped washed linen', mat_ar: 'كتان مغسول مقلّم',
    silf_en: 'Open abaya, volume sleeve', silf_ar: 'عباية مفتوحة، كم ضخم',
    pal_en: 'Ash / Black', pal_ar: 'رمادي / أسود', availability: 'Available',
    desc_en: 'The everyday piece. Fine ash stripe on washed linen, with a volume sleeve that collapses when the arm is down.',
    desc_ar: 'قطعة اليوم العادي. قلم رمادي رفيع على كتان مغسول، بكم ضخم بيقع لما الذراع تنزل.',
    story_en: ['Designed to be the piece kept by the door.', 'It creases. It is meant to.'],
    story_ar: ['متصمّمة تكون القطعة اللي متعلّقة جنب الباب.', 'بتتكرمش. ودي نية مش عيب.'] },
  { id: 'tibr', img: 5, ed: 'ED. 010', name_en: 'TIBR', name_ar: 'تِبر', price: 1650, coll_key: 'evening',
    fabric: 'Crinkle', sil: 'Draped khimar', colour: 'Tobacco', occ: 'Everyday',
    mat_en: 'Pleated crinkle', mat_ar: 'كرينكل مبليسيه',
    silf_en: 'Draped khimar', silf_ar: 'خمار منسدل',
    pal_en: 'Tobacco', pal_ar: 'تبغي', availability: 'Available',
    desc_en: 'A pleated crinkle khimar in tobacco. One length of cloth, one seam, no fastening.',
    desc_ar: 'خمار كرينكل مبليسيه بلون التبغ. طول قماش واحد، درزة واحدة، من غير أي قفل.',
    story_en: ['The simplest piece the house makes and the hardest to get right: the whole thing is the drape.', 'Packs to nothing. Travels well.'],
    story_ar: ['أبسط قطعة البيت بيعملها وأصعب واحدة تطلع مظبوطة: القطعة كلها هي الانسدال.', 'بتتطوي على ولا حاجة. ممتازة في السفر.'] },
  { id: 'sahra', img: 2, ed: 'ED. 011', name_en: 'SAHRA', name_ar: 'صحراء', price: 3200, coll_key: 'signature',
    fabric: 'Print', sil: 'Cape', colour: 'Monochrome', occ: 'Occasion',
    mat_en: 'Printed monochrome bisht', mat_ar: 'بشت مطبوع أبيض وأسود',
    silf_en: 'Cape over column', silf_ar: 'كاب فوق عمودي',
    pal_en: 'Onyx / Chalk', pal_ar: 'عقيق / طباشيري', availability: 'Archive only',
    desc_en: 'A printed bisht worn as a cape over a black column. The print was developed from a photograph of salt flats north of Riyadh.',
    desc_ar: 'بشت مطبوع بيتلبس ككاب فوق قطعة عمودية سودا. الطبعة اتطوّرت من صورة لسبخات ملح شمال الرياض.',
    story_en: ['Twelve were made. None remain for sale — the piece is held in the archive and shown by appointment.', 'The print is registered so the pattern is never cut through the centre back.'],
    story_ar: ['اتعمل منها اتناشر. مافيش ولا واحدة للبيع — القطعة متحفوظة في الأرشيف وبتتعرض بموعد.', 'الطبعة مظبوطة عشان الرسمة ما تتقصّش أبدًا في نص الضهر.'] }
];

const JOURNAL = [
  { id: 'j1', sort: 0, img: 9, cat_en: 'The Atelier', cat_ar: 'الأتيليه', title_en: 'What a seam is for', title_ar: 'الدرزة بتعمل إيه',
    body_en: ["A seam is not a place where two pieces of cloth are joined. It is a decision about where the eye will stop.",
      "In an abaya, where the body is not described, the seam is the only line available. Move it two centimetres and the whole silhouette changes character — one position reads severe, the next reads soft, and nothing else about the garment has changed at all.",
      "This is why the atelier cuts a toile in calico for every new piece and hangs it for a week before a single length of the real fabric is touched. Calico is honest. It does not flatter, it does not drape its way out of a bad decision, and it shows you exactly where the eye lands.",
      "Most of the work of the house happens in that week."],
    body_ar: ["الدرزة مش مكان بيتجمع فيه قطعتين قماش. الدرزة قرار عن المكان اللي العين هتقف عنده.",
      "في العباية، اللي مابتوصفش الجسم، الدرزة هي الخط الوحيد المتاح. حرّكها سنتيمترين وشخصية السيلويت كلها تتغيّر — موضع بيتقرا صارم، واللي بعده بيتقرا ناعم، ومافيش أي حاجة تانية في القطعة اتغيّرت.",
      "عشان كده الأتيليه بيقص تواليه من الكاليكو لكل قطعة جديدة، ويعلّقها أسبوع قبل ما إيد تلمس متر واحد من القماش الحقيقي. الكاليكو أمين. مابيجاملش، ومابيهربش من قرار وحش بالانسدال، وبيوريك بالظبط العين بتقع فين.",
      "معظم شغل البيت بيحصل في الأسبوع ده."] },
  { id: 'j2', sort: 1, img: 2, cat_en: 'The Silhouette', cat_ar: 'السيلويت', title_en: 'On movement, and why we photograph it', title_ar: 'عن الحركة، وليه بنصوّرها',
    body_en: ["A still photograph of an abaya tells you almost nothing. The garment is designed for the moment after the still — the turn, the step, the arm raised to open a door.",
      "We photograph movement because movement is the product. The weight of a fabric is not a number on a label; it is how long the hem takes to settle after you stop walking.",
      "Heavy crepe settles immediately. Voile takes almost a full second. Neither is better. They are different instruments."],
    body_ar: ["الصورة الثابتة للعباية مابتقولش حاجة تقريبًا. القطعة متصمّمة للحظة اللي بعد الثبات — اللفة، الخطوة، الذراع اللي بترتفع تفتح باب.",
      "بنصوّر الحركة لأن الحركة هي المنتج. وزن القماش مش رقم على تيكت؛ هو المدة اللي الذيل بياخدها عشان يستقر بعد ما تبطّلي مشي.",
      "الكريب التقيل بيستقر فورًا. الفوال بياخد ثانية كاملة تقريبًا. ولا واحد أحسن من التاني. دول آلتين مختلفتين."] },
  { id: 'j3', sort: 2, img: 6, cat_en: 'Materials', cat_ar: 'الخامات', title_en: 'Three washes before cutting', title_ar: 'تلات غسلات قبل القص',
    body_en: ["Linen shrinks. Everyone knows this, and most of the industry solves it by cutting large and hoping.",
      "We wash three times before the pattern touches the cloth. The first wash takes out the mill finish, the second takes out the shrinkage, and the third tells us what the fabric will actually be for the rest of its life.",
      "It costs a week and a percentage of every roll. What it buys is a garment that is the same shape in year three as it was on the first day."],
    body_ar: ["الكتان بيكشّ. كل الناس عارفة كده، ومعظم الصناعة بتحلّها بإنها تقص كبير وتتمنى خير.",
      "إحنا بنغسل تلات مرات قبل ما الباترون يلمس القماش. الغسلة الأولى بتشيل تشطيب المصنع، والتانية بتشيل الكشّة، والتالتة بتقولنا القماش ده هيبقى إيه فعلًا لباقي عمره.",
      "ده بيكلّف أسبوع ونسبة من كل توب. واللي بنشتريه بيه إن القطعة تفضل بنفس شكلها في السنة التالتة زي أول يوم."] },
  { id: 'j4', sort: 3, img: 4, cat_en: 'Culture', cat_ar: 'ثقافة', title_en: 'Against the cliché', title_ar: 'ضد الكليشيه',
    body_en: ["There is a version of Saudi design that exists mostly for export: gold everywhere, calligraphy applied like a stamp, the desert used as a backdrop for things that have nothing to do with it.",
      "We are not interested in it. Not because it is inauthentic — some of it is sincere — but because it describes the region from outside.",
      "The reference points of this house are closer and less photogenic: the proportion of a doorway in old Riyadh, the specific grey of a shaded courtyard at two in the afternoon, the way a carpet's burgundy has faded unevenly on one side.",
      "These are harder to put on a moodboard. They are also the only things worth building on."],
    body_ar: ["في نسخة من التصميم السعودي موجودة أساسًا للتصدير: دهب في كل حتة، وخط عربي متحطّ زي الختم، والصحرا مستخدمة كخلفية لحاجات مالهاش علاقة بيها.",
      "إحنا مش مهتمين بيها. مش لأنها مش أصيلة — بعضها صادق — لكن لأنها بتوصف المنطقة من بره.",
      "المراجع بتاعة البيت ده أقرب وأقل تصويرية: نسبة مدخل باب في الرياض القديمة، الرمادي المحدّد لفناء مظلّل الساعة اتنين بعد الضهر، وطريقة ما الخمري في سجادة بهت من ناحية واحدة أكتر من التانية.",
      "الحاجات دي أصعب إنك تحطها على مودبورد. وهي كمان الحاجات الوحيدة اللي تستاهل تبني عليها."] }
];

const ORDERS = [
  { order_number: 'THAJ-2026-0184', customer_name: 'Client of the house', email: 'you@domain.com', phone: '+966500000000',
    items: [{ id: 'najma', size: '54', qty: 1 }], total: 2450, status: 'Delivered' },
  { order_number: 'THAJ-2026-0151', customer_name: 'Client of the house', email: 'you@domain.com', phone: '+966500000000',
    items: [{ id: 'zaytoon', size: '56', qty: 1 }, { id: 'tibr', size: 'Made to measure', qty: 1 }], total: 3750, status: 'Delivered' },
  { order_number: 'THAJ-2026-0207', customer_name: 'Client of the house', email: 'you@domain.com', phone: '+966500000000',
    items: [{ id: 'sadaf', size: '54', qty: 1 }], total: 2750, status: 'In atelier' }
];

const SETTINGS = {
  hero_eyebrow_en: 'Autumn 2026 · The Signature Chapter', hero_eyebrow_ar: 'خريف ٢٠٢٦ · فصل التوقيع',
  hero_title_en: 'Where the seam is the only line.', hero_title_ar: 'حيث الدرزة هي الخط الوحيد.',
  contact_email: 'atelier@thaj.house',
  contact_location_en: 'Riyadh · By appointment', contact_location_ar: 'الرياض · بموعد',
  egp_per_sar: '13.5',
  deposit_percent: '50',
  vodafone_cash_number: '', vodafone_cash_name: '',
  instapay_handle: '', instapay_name: '',
  admin_whatsapp_number: ''
};

// Egypt's 27 governorates. Prices are starting defaults grouped by rough
// distance tier from Cairo — the admin owns them from here on via
// /admin/shipping and can change any of them at any time.
const GOVERNORATES = [
  ['cairo', 'Cairo', 'القاهرة', 50], ['giza', 'Giza', 'الجيزة', 50], ['qalyubia', 'Qalyubia', 'القليوبية', 50],
  ['alexandria', 'Alexandria', 'الإسكندرية', 70], ['dakahlia', 'Dakahlia', 'الدقهلية', 70],
  ['sharqia', 'Sharqia', 'الشرقية', 70], ['kafr-el-sheikh', 'Kafr El Sheikh', 'كفر الشيخ', 70],
  ['gharbia', 'Gharbia', 'الغربية', 70], ['monufia', 'Monufia', 'المنوفية', 70], ['beheira', 'Beheira', 'البحيرة', 70],
  ['damietta', 'Damietta', 'دمياط', 70], ['port-said', 'Port Said', 'بورسعيد', 70], ['ismailia', 'Ismailia', 'الإسماعيلية', 70],
  ['suez', 'Suez', 'السويس', 70], ['north-sinai', 'North Sinai', 'شمال سيناء', 150], ['south-sinai', 'South Sinai', 'جنوب سيناء', 150],
  ['beni-suef', 'Beni Suef', 'بني سويف', 90], ['fayoum', 'Fayoum', 'الفيوم', 90], ['minya', 'Minya', 'المنيا', 90],
  ['assiut', 'Assiut', 'أسيوط', 120], ['sohag', 'Sohag', 'سوهاج', 120], ['qena', 'Qena', 'قنا', 120],
  ['luxor', 'Luxor', 'الأقصر', 120], ['aswan', 'Aswan', 'أسوان', 120],
  ['red-sea', 'Red Sea', 'البحر الأحمر', 150], ['new-valley', 'New Valley', 'الوادي الجديد', 150], ['matrouh', 'Matrouh', 'مطروح', 150]
];

async function run() {
  for (const c of COLLECTIONS) {
    await sql`INSERT INTO collections (key,sort,name_en,name_ar,ar,line_en,line_ar,concept_en,concept_ar,mood_en,mood_ar,image)
      VALUES (${c.key},${c.sort},${c.name_en},${c.name_ar},${c.ar},${c.line_en},${c.line_ar},${c.concept_en},${c.concept_ar},${c.mood_en},${c.mood_ar},${c.image})
      ON CONFLICT (key) DO NOTHING`;
  }

  for (const p of PIECES) {
    await sql`INSERT INTO pieces
      (id,ed,name_en,name_ar,price,coll_key,fabric,sil,colour,occ,mat_en,mat_ar,silf_en,silf_ar,pal_en,pal_ar,availability,desc_en,desc_ar,story_en,story_ar,image)
      VALUES (${p.id},${p.ed},${p.name_en},${p.name_ar},${p.price},${p.coll_key},${p.fabric},${p.sil},${p.colour},${p.occ},
        ${p.mat_en},${p.mat_ar},${p.silf_en},${p.silf_ar},${p.pal_en},${p.pal_ar},${p.availability},${p.desc_en},${p.desc_ar},
        ${JSON.stringify(p.story_en)},${JSON.stringify(p.story_ar)},${P(p.img)})
      ON CONFLICT (id) DO NOTHING`;
  }

  for (const j of JOURNAL) {
    await sql`INSERT INTO journal (id,sort,cat_en,cat_ar,title_en,title_ar,body_en,body_ar,image)
      VALUES (${j.id},${j.sort},${j.cat_en},${j.cat_ar},${j.title_en},${j.title_ar},${JSON.stringify(j.body_en)},${JSON.stringify(j.body_ar)},${P(j.img)})
      ON CONFLICT (id) DO NOTHING`;
  }

  const [{ n: orderCount }] = await sql`SELECT COUNT(*)::int AS n FROM orders`;
  if (orderCount === 0) {
    for (const o of ORDERS) {
      await sql`INSERT INTO orders (order_number,customer_name,email,phone,items,total,status)
        VALUES (${o.order_number},${o.customer_name},${o.email},${o.phone},${JSON.stringify(o.items)},${o.total},${o.status})`;
    }
  }

  for (const [k, v] of Object.entries(SETTINGS)) {
    await sql`INSERT INTO settings (key,value) VALUES (${k},${v}) ON CONFLICT (key) DO NOTHING`;
  }

  for (const [i, [key, name_en, name_ar, price]] of GOVERNORATES.entries()) {
    await sql`INSERT INTO governorates (key,sort,name_en,name_ar,price,active)
      VALUES (${key},${i},${name_en},${name_ar},${price},true)
      ON CONFLICT (key) DO NOTHING`;
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@thaj.house').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'change-this-password';
  if (password === 'change-this-password' || password.length < 12) {
    console.warn('WARNING: ADMIN_PASSWORD is missing, default, or shorter than 12 characters.');
  }
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length === 0) {
    const hash = bcrypt.hashSync(password, 12);
    await sql`INSERT INTO users (email, password_hash, role) VALUES (${email}, ${hash}, 'admin')`;
    console.log(`Seeded admin user: ${email}`);
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  console.log('Seed complete.');
}

await run();
