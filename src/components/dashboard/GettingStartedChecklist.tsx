import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import type { OnboardingStep } from '@/lib/onboarding';

interface Props {
  steps: OnboardingStep[];
  activeIndex: number;
  onDismiss: () => void;
}

export function GettingStartedChecklist({ steps, activeIndex, onDismiss }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BilingualLabel ja="はじめに" en="Getting started" />
        </CardTitle>
        <CardDescription>
          <BilingualLabel
            ja="ClearPress AI を使い始めるための手順です。"
            en="Follow these steps to get started with ClearPress AI."
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3">
          {steps.map((step, i) => {
            const isActive = i === activeIndex;
            return (
              <li key={step.key} className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle
                    className={
                      'mt-0.5 size-5 shrink-0 ' +
                      (isActive ? 'text-primary' : 'text-muted-foreground/40')
                    }
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className={
                      'text-sm font-medium ' +
                      (step.done
                        ? 'text-muted-foreground line-through'
                        : isActive
                          ? ''
                          : 'text-muted-foreground')
                    }
                  >
                    <BilingualLabel ja={step.jaLabel} en={step.enLabel} />
                  </div>
                  {isActive && (
                    <>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <BilingualLabel ja={step.jaHint} en={step.enHint} />
                      </p>
                      <Button asChild size="sm" className="mt-2">
                        <Link to={step.to}>
                          <BilingualLabel ja="開始 →" en="Start →" />
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          <BilingualLabel ja="非表示にする" en="Hide" />
        </button>
      </CardContent>
    </Card>
  );
}
