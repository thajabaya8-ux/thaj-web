'use client';
/* ==========================================================
   THAJ — PWA install prompt
   Sits in the root layout, outside both SiteProvider and
   AdminProvider (same reasoning as AuthForm.tsx), so language is read
   straight off <html lang> rather than through either context — both
   contexts already keep that attribute in sync on every language
   change, this just reads it once when the prompt is about to show.

   Chrome/Android fire beforeinstallprompt when the PWA criteria are
   met (manifest + service worker + HTTPS); it's suppressed by default
   here so the banner below can trigger the exact same native prompt
   on its own schedule instead of Chrome's mini-infobar appearing
   whenever it feels like it. iOS Safari never fires that event at
   all — there's no programmatic install there, just a Share-sheet
   action, so it gets its own instructional banner instead.
   ========================================================== */
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'thaj-pwa-dismissed';
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function dismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) < DISMISS_DAYS * 86400000;
  } catch { return false; }
}

function dismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* best-effort */ }
}

export default function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    if (dismissedRecently()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone;
    if (isIos) {
      const t = setTimeout(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowIosHint(true);
      }, 4000);
      return () => { window.removeEventListener('beforeinstallprompt', onPrompt); clearTimeout(t); };
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!prompt && !showIosHint) return null;
  const ar = document.documentElement.lang === 'ar';
  const L = <T,>(e: T, a: T) => (ar ? a : e);

  const onInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    dismiss();
  };
  const onClose = () => { setPrompt(null); setShowIosHint(false); dismiss(); };

  return (
    <div className="pwa-banner" dir={ar ? 'rtl' : 'ltr'}>
      <img src="/assets/logo/icon-192.png" alt="" width={36} height={36} />
      <div className="pwa-banner-body">
        <b>{L('Install THAJ', 'ثبّتي تطبيق ثاج')}</b>
        <span>
          {prompt
            ? L('Add it to your home screen for quick access.', 'ضيفيه لشاشتك الرئيسية عشان توصليله بسرعة.')
            : L('Tap Share, then "Add to Home Screen".', 'دوسي على أيقونة المشاركة، بعدين "إضافة إلى الشاشة الرئيسية".')}
        </span>
      </div>
      {prompt && <button type="button" className="btn" onClick={onInstall}>{L('Install', 'تثبيت')}</button>}
      <button type="button" className="pwa-banner-close" onClick={onClose} aria-label={L('Dismiss', 'إغلاق')}>×</button>
    </div>
  );
}
