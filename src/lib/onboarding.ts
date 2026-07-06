export type OnboardingStepKey =
  | 'client'
  | 'samples'
  | 'project'
  | 'approve'
  | 'deliver';

export interface OnboardingStep {
  key: OnboardingStepKey;
  jaLabel: string;
  enLabel: string;
  jaHint: string;
  enHint: string;
  to: string;
  done: boolean;
}

export interface OnboardingInput {
  hasClient: boolean;
  hasSamples: boolean;
  hasProject: boolean;
  hasApproved: boolean;
  hasDelivered: boolean;
  firstClientId?: string | null;
}

export interface OnboardingResult {
  steps: OnboardingStep[];
  /** Index of the first incomplete step, or -1 when all are done. */
  activeIndex: number;
  allDone: boolean;
}

export function computeOnboardingSteps(
  input: OnboardingInput,
): OnboardingResult {
  const samplesTo = input.firstClientId
    ? `/clients/${input.firstClientId}`
    : '/clients';

  const steps: OnboardingStep[] = [
    {
      key: 'client',
      jaLabel: 'クライアントを作成',
      enLabel: 'Create a client',
      jaHint: '最初のクライアントを登録します。',
      enHint: 'Register your first client.',
      to: '/clients/new',
      done: input.hasClient,
    },
    {
      key: 'samples',
      jaLabel: 'ブランドボイス資料を追加',
      enLabel: 'Add brand voice samples',
      jaHint: 'クライアントの過去の文章をアップロードし、ブランドボイスを抽出します。',
      enHint: "Upload the client's past writing to extract their brand voice.",
      to: samplesTo,
      done: input.hasSamples,
    },
    {
      key: 'project',
      jaLabel: '最初のプロジェクトを作成',
      enLabel: 'Create your first project',
      jaHint: 'ブリーフを入力してコンテンツの生成を開始します。',
      enHint: 'Write a brief to start generating content.',
      to: '/projects/new',
      done: input.hasProject,
    },
    {
      key: 'approve',
      jaLabel: 'バリアントをレビューして承認',
      enLabel: 'Review & approve variants',
      jaHint: '生成されたバリアントを比較し、1つを承認します。',
      enHint: 'Compare the generated variants and approve one.',
      to: '/projects',
      done: input.hasApproved,
    },
    {
      key: 'deliver',
      jaLabel: 'クライアントに配信',
      enLabel: 'Deliver to the client',
      jaHint: '承認済みのコンテンツをメールで送付します。',
      enHint: 'Email the approved content to the client.',
      to: '/projects',
      done: input.hasDelivered,
    },
  ];

  const activeIndex = steps.findIndex((s) => !s.done);
  return { steps, activeIndex, allDone: activeIndex === -1 };
}
