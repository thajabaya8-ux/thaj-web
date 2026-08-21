'use client';
/* Closes any open overlay on navigation and re-runs the site's
   scroll-reveal (.rv → .in) animation for the newly mounted page —
   the client-side equivalent of observe()/go() in the old app.js/core.js. */
import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSite } from '@/lib/siteContext';

export default function RouteEffects() {
  const pathname = usePathname();
  const { setDrawerOpen, setSearchOpen, setMenuOpen } = useSite();

  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, [pathname, setDrawerOpen, setSearchOpen, setMenuOpen]);

  useLayoutEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll<HTMLElement>('.rv:not(.in)').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 5) * 60}ms`;
      io.observe(el);
    });
    const hero = document.getElementById('hero');
    const heroTimer = hero ? setTimeout(() => hero.classList.add('in'), 60) : null;
    document.querySelectorAll<HTMLElement>('.lbar b').forEach((b) => { b.style.width = b.dataset.w || ''; });
    return () => { io.disconnect(); if (heroTimer) clearTimeout(heroTimer); };
  }, [pathname]);

  return null;
}
