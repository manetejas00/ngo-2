import React, { useEffect } from 'react';
import Header from '../components/Header';
import HeroCanvas from '../components/HeroCanvas';
import ScrollTypography from '../components/ScrollTypography';
import OverlappingFanStack from '../components/OverlappingFanStack';
import StickyPanels from '../components/StickyPanels';
import JourneyDeck from '../components/JourneyDeck';
import Stories from '../components/Stories';
import ImpactMetrics from '../components/ImpactMetrics';
import NewsRoom from '../components/NewsRoom';
import GetInvolved from '../components/GetInvolved';
import Footer from '../components/Footer';

export default function HomePage() {
  useEffect(() => {
    document.title = 'Avinya Care Foundation | No One Should Face A Health Crisis Alone';
  }, []);

  return (
    <div className="home-page-container">
      <Header />
      <main>
        <HeroCanvas />
        <ScrollTypography />
        <OverlappingFanStack />
        <StickyPanels />
        <JourneyDeck />
        <Stories />
        <ImpactMetrics />
        <NewsRoom />
        <GetInvolved />
      </main>
      <Footer />
    </div>
  );
}
