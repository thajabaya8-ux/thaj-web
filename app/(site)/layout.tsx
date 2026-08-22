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

export const metadata: Metadata = {
  title: 'THAJ — Maison',
  description: 'THAJ — an abaya fashion house in Riyadh. Eleven pieces, catalogued and editioned.'
};

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { pieces, collections, journal, orders, settings } = await getSiteData();

  return (
    <SiteProvider
      initialPieces={pieces}
      initialCollections={collections}
      initialJournal={journal}
      initialOrders={orders}
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
