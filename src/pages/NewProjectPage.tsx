import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { NewProjectForm } from '@/components/project/NewProjectForm';
import { GenerationSummary } from '@/components/project/GenerationSummary';
import { useCreateProject } from '@/hooks/useProjects';
import { pickLang } from '@/lib/bilingual';
import {
  newProjectFormSchema,
  type NewProjectFormValues,
} from '@/components/project/NewProjectForm.schema';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const createProject = useCreateProject();

  const form = useForm<NewProjectFormValues>({
    resolver: zodResolver(newProjectFormSchema),
    defaultValues: {
      client_id: '',
      name: '',
      content_type: 'press_release',
      content_sub_type: 'auto',
      urgency: 'standard',
      deadline: '',
      language: 'ja',
      target_audience: 'news_media',
      drug_lifecycle_status: 'pre_approval',
      distribution_channel: 'pr_times',
      length_tier: 'standard',
      length_target_chars: null,
      enforce_hard_cap: false,
      variant_count: 3,
      brief_free_text: '',
      brief_key_messages: [],
      brief_quotes: [],
      brief_data_points: [],
      brief_constraints: '',
    },
  });

  const handleSubmit = async (values: NewProjectFormValues) => {
    try {
      const { project } = await createProject.mutateAsync({
        client_id: values.client_id,
        name: values.name,
        urgency: values.urgency,
        deadline: values.deadline ? values.deadline : null,
        content_type: values.content_type,
        content_sub_type: values.content_sub_type,
        language: values.language,
        target_audience: values.target_audience,
        drug_lifecycle_status: values.drug_lifecycle_status,
        distribution_channel: values.distribution_channel,
        length_tier: values.length_tier,
        length_target_chars: values.length_target_chars,
        enforce_hard_cap: values.enforce_hard_cap,
        variant_count: values.variant_count,
        brief_free_text: values.brief_free_text,
        brief_key_messages: values.brief_key_messages,
        brief_quotes: values.brief_quotes,
        brief_data_points: values.brief_data_points,
        brief_constraints: values.brief_constraints
          ? values.brief_constraints
          : null,
      });
      toast.success(
        pickLang(i18n.language, 'プロジェクトを作成しました', 'Project created'),
      );
      navigate(`/projects/${project.id}/review`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100dvh-4rem)] bg-muted/40 p-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <BilingualLabel ja="プロジェクト / 新規" en="Projects / New" />
            </p>
            <h1 className="text-2xl font-semibold">
              <BilingualLabel ja="新規プロジェクト" en="New Project" />
            </h1>
            <p className="text-sm text-muted-foreground">
              <BilingualLabel
                ja="読者と制約を設定 — ClearPressがオンボイスでコンプライアンスに配慮したドラフトを生成します。"
                en="Set the audience and constraints — ClearPress generates on-voice, compliance-aware drafts."
              />
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/projects">
              <BilingualLabel ja="戻る" en="Back" />
            </Link>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <NewProjectForm />
              <aside className="h-fit lg:sticky lg:top-6">
                <GenerationSummary submitting={createProject.isPending} />
              </aside>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
