import { useCallback, useEffect, useState } from 'react';
import FinalCtaAndFooter from './components/FinalCtaAndFooter';
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import LanguagesSection from './components/LanguagesSection';
import LearningWorkspace from './components/LearningWorkspace';
import MeetSection from './components/MeetSection';
import Navbar from './components/Navbar';
import ProblemSection from './components/ProblemSection';
import ProductPreviewSection from './components/ProductPreviewSection';

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'workspace'>(() =>
    typeof window !== 'undefined' && window.location.hash === '#workspace'
      ? 'workspace'
      : 'landing'
  );
  const [initialTopicPrompt, setInitialTopicPrompt] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#workspace') {
        setActiveView('workspace');
      } else if (activeView === 'workspace' && window.location.hash !== '#workspace') {
        setActiveView('landing');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activeView]);

  const openWorkspace = useCallback((topicPrompt?: string) => {
    if (topicPrompt) {
      setInitialTopicPrompt(topicPrompt);
    }
    setActiveView('workspace');
    if (typeof window !== 'undefined') {
      if (window.location.hash !== '#workspace') {
        window.history.pushState(null, '', '#workspace');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const returnToLanding = useCallback(() => {
    setActiveView('landing');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '#home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  if (activeView === 'workspace') {
    return (
      <LearningWorkspace
        onBackToLanding={returnToLanding}
        initialTopicPrompt={initialTopicPrompt}
        onClearInitialPrompt={() => setInitialTopicPrompt(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden text-[var(--color-ink)]"
      style={{
        background:
          'linear-gradient(180deg, #E9E8F8 0%, #EEF0FA 28%, #E9E8F8 58%, #F2ECF6 82%, #E9E8F8 100%)',
      }}
    >
      <Navbar onStartLearning={() => openWorkspace()} />
      <main>
        <HeroSection onStartLearning={() => openWorkspace()} />
        <ProblemSection />
        <MeetSection />
        <HowItWorksSection />
        <LanguagesSection />
        <ProductPreviewSection onOpenWorkspace={(topic) => openWorkspace(topic)} />
      </main>
      <FinalCtaAndFooter onStartLearning={() => openWorkspace()} />
    </div>
  );
}
