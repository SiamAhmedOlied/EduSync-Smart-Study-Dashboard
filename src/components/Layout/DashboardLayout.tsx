import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { gsap } from 'gsap';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    // Initialize smooth scrolling
    import('lenis').then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    });
  }, []);

  useEffect(() => {
    // Animate main content margin when sidebar changes
    gsap.to('.main-content', {
      marginLeft: sidebarExpanded ? '240px' : '64px',
      duration: 0.3,
      ease: 'power2.out'
    });
  }, [sidebarExpanded]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isExpanded={sidebarExpanded} 
        onToggle={() => setSidebarExpanded(!sidebarExpanded)} 
      />
      <main className="main-content min-h-screen transition-all duration-300">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;