import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface OnboardingState {
  loading: boolean;
  needsOnboarding: boolean;
  currentStep: number;
  stepsCompleted: string[];
  refresh: () => Promise<void>;
}

export function useOnboarding(): OnboardingState {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepsCompleted, setStepsCompleted] = useState<string[]>([]);

  const check = async () => {
    if (!user?.id) {
      setLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    try {
      // Check if onboarding record exists
      const { data: onboarding } = await supabase
        .from('onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!onboarding) {
        // No record — check if artist exists (maybe legacy user)
        const { data: artist } = await supabase
          .from('artists')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (artist) {
          // Artist exists, skip onboarding — create completed record
          await supabase.from('onboarding').insert({
            user_id: user.id,
            completed: true,
            current_step: 6,
            steps_completed: ['step_1', 'step_2', 'step_3', 'step_4', 'step_5'],
            artist_id: artist.id,
          });
          setNeedsOnboarding(false);
        } else {
          // No artist, no onboarding record — needs onboarding
          setNeedsOnboarding(true);
          setCurrentStep(1);
          setStepsCompleted([]);
        }
      } else if (onboarding.completed) {
        setNeedsOnboarding(false);
      } else {
        // Onboarding in progress
        setNeedsOnboarding(true);
        setCurrentStep(onboarding.current_step || 1);
        setStepsCompleted(onboarding.steps_completed || []);
      }
    } catch (err) {
      console.error('Error checking onboarding:', err);
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, [user?.id]);

  return {
    loading,
    needsOnboarding,
    currentStep,
    stepsCompleted,
    refresh: check,
  };
}
