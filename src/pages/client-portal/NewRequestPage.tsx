/**
 * ClearPress AI - Client Portal New Request Page
 * Allows clients to submit PR work requests
 * Offers choice between Quick Request and Guided Request wizard
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClientIdForUser, useClient } from '@/hooks/use-clients';
import { useCreateClientProjectRequest } from '@/hooks/use-projects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientProjectRequestForm } from '@/components/projects/ClientProjectRequestForm';
import type { ClientRequestFormData } from '@/components/projects/schemas';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Success state component
function SuccessState({
  language,
  projectId,
}: {
  language: 'ja' | 'en';
  projectId: string;
}) {
  return (
    <div className="py-12 text-center animate-fade-up">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-xl font-display font-semibold mb-2">
        {language === 'ja'
          ? 'リクエストを送信しました'
          : 'Request Submitted Successfully'}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {language === 'ja'
          ? 'PRチームがリクエストを確認し、すぐに対応いたします。進捗はプロジェクト一覧からご確認いただけます。'
          : 'Our PR team will review your request and get started shortly. You can track progress from your projects list.'}
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link to={`/client/projects/${projectId}`}>
            {language === 'ja' ? 'リクエストを確認' : 'View Request'}
          </Link>
        </Button>
        <Button asChild>
          <Link to="/client/projects">
            {language === 'ja' ? 'プロジェクト一覧へ' : 'Go to Projects'}
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error state component
function ErrorState({
  language,
  message,
}: {
  language: 'ja' | 'en';
  message?: string;
}) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive/60 mb-3" />
          <p className="text-muted-foreground font-display">
            {message ||
              (language === 'ja'
                ? 'エラーが発生しました'
                : 'An error occurred')}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/client/projects">
              {language === 'ja' ? '戻る' : 'Go Back'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NewRequestPage() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(null);
  const [showQuickForm, setShowQuickForm] = useState(false);

  // Get client ID for the current user
  const { data: clientId, isLoading: isLoadingClientId } = useClientIdForUser();

  // Fetch client details to get the name
  const { data: client, isLoading: isLoadingClient } = useClient(clientId ?? undefined);

  // Create project request mutation
  const createRequest = useCreateClientProjectRequest();

  const isLoading = isLoadingClientId || isLoadingClient;

  // Handle form submission
  const handleSubmit = async (data: ClientRequestFormData) => {
    if (!clientId || !client) return;

    try {
      const project = await createRequest.mutateAsync({
        clientId,
        clientName: client.name,
        name: data.name,
        brief: data.brief,
        urgency: data.urgency,
        target_date: data.target_date || undefined,
        content_type_hint: data.content_type_hint,
      });

      setSubmittedProjectId(project.id);
    } catch (error) {
      // Error is handled by the hook's onError
      console.error('Failed to create request:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (showQuickForm) {
      setShowQuickForm(false);
    } else {
      navigate('/client/projects');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!clientId || !client) {
    return (
      <ErrorState
        language={language}
        message={
          language === 'ja'
            ? 'クライアントが設定されていません'
            : 'No client assigned'
        }
      />
    );
  }

  // Show success state after submission
  if (submittedProjectId) {
    return <SuccessState language={language} projectId={submittedProjectId} />;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back link */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {showQuickForm
            ? (language === 'ja' ? '戻る' : 'Back')
            : (language === 'ja' ? 'プロジェクト一覧' : 'Projects')}
        </Button>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            {language === 'ja' ? '新規PRリクエスト' : 'New PR Request'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ja'
              ? 'PRチームへ依頼を送信します'
              : 'Submit a request to the PR team'}
          </p>
        </div>
      </div>

      {/* Choice between Quick and Guided request */}
      {!showQuickForm ? (
        <div className="space-y-6">
          <p className="text-center text-muted-foreground">
            {t('clientRequest.chooseMethod')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guided Request Card - Recommended */}
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50',
                'relative overflow-hidden'
              )}
              onClick={() => navigate('/client/request-new/guided')}
            >
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary text-primary-foreground">
                  {t('clientRequest.recommended')}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  {t('clientRequest.guidedRequest')}
                </CardTitle>
                <CardDescription>
                  {t('clientRequest.guidedRequestDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {language === 'ja' ? 'テンプレートで素早く開始' : 'Quick start with templates'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {language === 'ja' ? '詳細な要件を段階的に入力' : 'Step-by-step detailed requirements'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {language === 'ja' ? 'ファイルのアップロード対応' : 'File upload support'}
                  </li>
                </ul>
                <Button className="w-full mt-4">
                  {t('clientRequest.guidedRequest')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Request Card */}
            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-muted-foreground/30"
              onClick={() => setShowQuickForm(true)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-3">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">
                  {t('clientRequest.quickRequest')}
                </CardTitle>
                <CardDescription>
                  {t('clientRequest.quickRequestDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    {language === 'ja' ? 'シンプルなフォーム' : 'Simple form'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    {language === 'ja' ? '基本情報のみ入力' : 'Basic information only'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    {language === 'ja' ? '数分で完了' : 'Complete in minutes'}
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-4">
                  {t('clientRequest.quickRequest')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Form */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base font-medium">
                {language === 'ja' ? '依頼内容' : 'Request Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ClientProjectRequestForm
                onSubmit={handleSubmit}
                isSubmitting={createRequest.isPending}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>

          {/* Help text */}
          <p className="text-xs text-muted-foreground text-center">
            {language === 'ja'
              ? 'リクエストを送信すると、PRチームに通知が届きます。担当者から連絡があるまでお待ちください。'
              : 'Once submitted, our PR team will be notified and a team member will reach out to you shortly.'}
          </p>
        </>
      )}
    </div>
  );
}

export default NewRequestPage;
