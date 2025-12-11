'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Wallet,
  Trophy,
  Upload,
  User,
  Compass,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Onboarding steps configuration
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  targetSelector?: string; // CSS selector for spotlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PROVELT! 🎉',
    description: 'PROVELT is a Web3 social platform where you complete challenges, prove your achievements, and earn NFT badges. Let us show you around!',
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: 'wallet',
    title: 'Connect Your Wallet',
    description: 'First, connect your Solana wallet (like Phantom or Solflare). This is your identity on PROVELT - no email or password needed!',
    icon: <Wallet className="w-8 h-8" />,
    targetSelector: '[data-onboarding="wallet-button"]',
    position: 'bottom',
  },
  {
    id: 'explore',
    title: 'Explore Challenges',
    description: 'Browse available challenges in the Explore page. Find something interesting - fitness, coding, creativity, and more!',
    icon: <Compass className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-explore"]',
    position: 'bottom',
  },
  {
    id: 'challenges',
    title: 'Join a Challenge',
    description: 'Pick a challenge that interests you. Each challenge has requirements and rewards - complete them to earn points and NFT badges!',
    icon: <Trophy className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-challenges"]',
    position: 'bottom',
  },
  {
    id: 'submit',
    title: 'Submit Your Proof',
    description: 'Completed a challenge? Submit photo or video proof. Our community will verify your achievement!',
    icon: <Upload className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-submit"]',
    position: 'bottom',
  },
  {
    id: 'profile',
    title: 'Build Your Profile',
    description: 'Your profile showcases all your achievements, NFT badges, and stats. The more you prove, the more you earn!',
    icon: <User className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-profile"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'That\'s it! Start exploring challenges and prove what you can do. Your achievements live forever on the blockchain!',
    icon: <CheckCircle2 className="w-8 h-8" />,
  },
];

// Context for onboarding state
interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
  steps?: OnboardingStep[];
}

export function OnboardingProvider({ children, steps = DEFAULT_STEPS }: OnboardingProviderProps) {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    setMounted(true);
    const completed = localStorage.getItem('provelt_onboarding_completed');
    if (!completed) {
      setHasCompletedOnboarding(false);
      // Auto-start onboarding for new users after a short delay
      setTimeout(() => {
        setIsOnboarding(true);
      }, 1500);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOnboarding(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    setIsOnboarding(false);
    localStorage.setItem('provelt_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboarding(false);
    localStorage.setItem('provelt_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        steps,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        hasCompletedOnboarding,
      }}
    >
      {children}
      <OnboardingOverlay />
    </OnboardingContext.Provider>
  );
}

// Spotlight overlay component
function OnboardingOverlay() {
  const { 
    isOnboarding, 
    currentStep, 
    steps, 
    nextStep, 
    prevStep, 
    skipOnboarding 
  } = useOnboarding();
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[currentStep];

  // Find and highlight target element
  useEffect(() => {
    if (!isOnboarding || !step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(step.targetSelector!);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    
    // Re-calculate on resize/scroll
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);
    
    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
    };
  }, [isOnboarding, step]);

  if (!isOnboarding) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const hasTarget = !!step.targetSelector && !!targetRect;

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'top':
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`,
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight ring around target */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            <div className="absolute inset-0 rounded-xl border-2 border-brand-400 animate-pulse" />
            <div className="absolute inset-0 rounded-xl bg-brand-400/10" />
          </motion.div>
        )}

        {/* Arrow pointing to target */}
        {targetRect && step.position === 'bottom' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute"
            style={{
              top: targetRect.bottom + 4,
              left: targetRect.left + targetRect.width / 2 - 12,
            }}
          >
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-brand-500" />
          </motion.div>
        )}

        {/* Tooltip card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'absolute w-80 bg-surface-800 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden',
            !hasTarget && 'max-w-md'
          )}
          style={getTooltipStyle()}
        >
          {/* Header with icon */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-500/20 rounded-xl text-brand-400 shrink-0">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentStep ? 'bg-brand-500' : 'bg-surface-600'
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-surface-900/50 border-t border-surface-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-gray-400 hover:text-white"
            >
              {isLastStep ? 'Close' : 'Skip Tour'}
            </Button>
            
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="border-surface-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-brand-500 hover:bg-brand-600 text-white"
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Skip hint at bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <p className="text-sm text-gray-500">
            Press <kbd className="px-2 py-0.5 bg-surface-700 rounded text-xs">ESC</kbd> to skip
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to handle ESC key
export function useOnboardingKeyboard() {
  const { isOnboarding, skipOnboarding, nextStep } = useOnboarding();

  useEffect(() => {
    if (!isOnboarding) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipOnboarding();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        nextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboarding, skipOnboarding, nextStep]);
}

// Button to restart onboarding (for settings/help)
export function RestartOnboardingButton() {
  const { startOnboarding } = useOnboarding();

  return (
    <Button
      variant="outline"
      onClick={startOnboarding}
      className="border-surface-600"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Take the Tour
    </Button>
  );
}
