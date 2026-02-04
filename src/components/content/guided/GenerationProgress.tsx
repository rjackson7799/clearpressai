/**
 * GenerationProgress - Progress UI during variant generation
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { formatTranslation } from '@/lib/translations';

interface GenerationProgressProps {
  progress: number[];
  overallProgress: number;
  onCancel: () => void;
}

export function GenerationProgress({
  progress,
  overallProgress,
  onCancel,
}: GenerationProgressProps) {
  const { t } = useLanguage();

  const variantLabels = ['A', 'B', 'C'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 p-8 bg-card border rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{t('guidedContent.generatingTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('guidedContent.generatingDescription')}
            </p>
          </div>
        </div>

        {/* Individual Variant Progress */}
        <div className="space-y-4 mb-6">
          {progress.map((p, index) => {
            const isComplete = p >= 100;
            const displayProgress = Math.min(Math.round(p), 100);

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {formatTranslation(
                      isComplete
                        ? t('guidedContent.variantComplete')
                        : t('guidedContent.variantProgress'),
                      { number: variantLabels[index] }
                    )}
                  </span>
                  <span className="text-muted-foreground">{displayProgress}%</span>
                </div>
                <div className="relative">
                  <Progress value={displayProgress} className="h-2" />
                  {isComplete && (
                    <CheckCircle className="absolute -right-1 -top-1 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t('common.loading')}</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center mb-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>

        {/* Cancel Button */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
