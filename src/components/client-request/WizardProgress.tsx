/**
 * ClearPress AI - Wizard Progress Component
 * Horizontal step indicator for the guided request wizard
 */

import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';
import type { RequestWizardStep } from '@/types/client-request';

interface WizardProgressProps {
  currentStep: RequestWizardStep;
  onStepClick?: (step: RequestWizardStep) => void;
  completedSteps?: RequestWizardStep[];
}

const STEPS: { key: RequestWizardStep; number: number }[] = [
  { key: 'template', number: 1 },
  { key: 'basic', number: 2 },
  { key: 'brief', number: 3 },
  { key: 'context', number: 4 },
  { key: 'review', number: 5 },
];

export function WizardProgress({
  currentStep,
  onStepClick,
  completedSteps = [],
}: WizardProgressProps) {
  const { t } = useLanguage();

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const isStepCompleted = (step: RequestWizardStep) =>
    completedSteps.includes(step);

  const isStepClickable = (stepKey: RequestWizardStep, index: number) => {
    // Can click on completed steps or the next step
    return (
      onStepClick &&
      (isStepCompleted(stepKey) || index <= currentStepIndex + 1)
    );
  };

  const getStepStatus = (stepKey: RequestWizardStep, index: number) => {
    if (stepKey === currentStep) return 'current';
    if (isStepCompleted(stepKey)) return 'completed';
    if (index < currentStepIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      {/* Mobile: Compact view */}
      <div className="flex items-center justify-between md:hidden px-4 py-3 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium">
          {t(`clientRequest.steps.${currentStep}`)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTranslation(t('clientRequest.stepOf'), {
            current: currentStepIndex + 1,
            total: STEPS.length,
          })}
        </span>
      </div>

      {/* Desktop: Full step indicator */}
      <nav aria-label="Progress" className="hidden md:block">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.key, index);
            const clickable = isStepClickable(step.key, index);
            const isLast = index === STEPS.length - 1;

            return (
              <li
                key={step.key}
                className={cn('flex items-center', !isLast && 'flex-1')}
              >
                {/* Step circle and label */}
                <button
                  type="button"
                  onClick={() => clickable && onStepClick?.(step.key)}
                  disabled={!clickable}
                  className={cn(
                    'group flex flex-col items-center gap-2 min-w-[80px]',
                    clickable && 'cursor-pointer',
                    !clickable && 'cursor-default'
                  )}
                >
                  {/* Circle */}
                  <span
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors',
                      status === 'current' &&
                        'border-primary bg-primary text-primary-foreground',
                      status === 'completed' &&
                        'border-primary bg-primary text-primary-foreground',
                      status === 'upcoming' &&
                        'border-muted-foreground/30 bg-background text-muted-foreground',
                      clickable &&
                        status === 'upcoming' &&
                        'group-hover:border-primary/50'
                    )}
                  >
                    {status === 'completed' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </span>

                  {/* Label */}
                  <span
                    className={cn(
                      'text-xs font-medium text-center transition-colors',
                      status === 'current' && 'text-primary',
                      status === 'completed' && 'text-foreground',
                      status === 'upcoming' && 'text-muted-foreground',
                      clickable &&
                        status === 'upcoming' &&
                        'group-hover:text-foreground'
                    )}
                  >
                    {t(`clientRequest.steps.${step.key}`)}
                  </span>
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors',
                      index < currentStepIndex
                        ? 'bg-primary'
                        : 'bg-muted-foreground/20'
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
