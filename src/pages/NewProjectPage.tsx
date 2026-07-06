import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { NewProjectForm } from '@/components/project/NewProjectForm';
import { useCreateProject } from '@/hooks/useProjects';
import { pickLang } from '@/lib/bilingual';
import type { NewProjectFormValues } from '@/components/project/NewProjectForm.schema';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const createProject = useCreateProject();

  const handleSubmit = async (values: NewProjectFormValues) => {
    try {
      const { project } = await createProject.mutateAsync({
        client_id: values.client_id,
        name: values.name,
        urgency: values.urgency,
        deadline: values.deadline ? values.deadline : null,
        content_type: values.content_type,
        content_sub_type: values.content_sub_type,
        variation_axis: values.variation_axis,
        language: values.language,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">
          <BilingualLabel ja="新規プロジェクト" en="New Project" />
        </h1>
        <Button variant="outline" asChild>
          <Link to="/projects">
            <BilingualLabel ja="戻る" en="Back" />
          </Link>
        </Button>
      </div>
      <NewProjectForm
        onSubmit={handleSubmit}
        submitting={createProject.isPending}
      />
    </div>
  );
}
