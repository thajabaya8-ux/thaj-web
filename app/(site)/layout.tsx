import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteProvider } from '@/lib/siteContext';
import { getSiteData } from '@/lib/api';
import Curtain from '@/components/Curtain';
import Header from '@/components/Header';
import MobileMenu from '@/components/MobileMenu';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SearchOverlay from '@/components/SearchOverlay';
import SocialFab from '@/components/SocialFab';
import Toast from '@/components/Toast';
import RouteEffects from '@/components/RouteEffects';

// title.template lets every route below just set title:'Shop' (etc.) and
// have it resolve to "Shop — THAJ" automatically, instead of repeating
// "— THAJ" in every route's own metadata.
export const metadata: Metadata = {
  title: { default: 'THAJ — Maison', template: '%s — THAJ' },
  description: 'THAJ — an abaya fashion house in Riyadh. Pieces catalogued and editioned, cut in Riyadh and finished by hand.'
};

// Most pages under this layout have no dynamic segment or cookie/header
// read, so Next would otherwise prerender them once at build time and
// serve that same snapshot until the next deploy — a piece added (or
// hidden) through the live admin panel wouldn't show up on the site
// until someone redeployed. Forcing this layout dynamic makes every page
// under it read the database fresh on each request instead.
export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { pieces, collections, settings } = await getSiteData();

  return (
    <SiteProvider
      initialPieces={pieces}
      initialCollections={collections}
      initialSettings={settings}
    >
      <RouteEffects />
      <Curtain />
      <Header />
      <MobileMenu />
      <main id="view">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <SocialFab />
      <Toast />
    </SiteProvider>
  );
}
