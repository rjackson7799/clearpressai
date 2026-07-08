import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/client/ClientForm";
import type { ClientFormValues } from "@/components/client/ClientForm.schema";
import { useCreateClient } from "@/hooks/useClients";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ClientNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createClient = useCreateClient();

  const handleSubmit = async (values: ClientFormValues) => {
    try {
      const client = await createClient.mutateAsync({
        name: values.name,
        name_en: values.name_en || null,
        industry: values.industry || "pharmaceutical",
        primary_contact_name: values.primary_contact_name || null,
        primary_contact_email: values.primary_contact_email || null,
        notes: values.notes || null,
      });
      toast.success(t("clients.createdToast"));
      navigate(`/clients/${client.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <PageShell className="max-w-2xl">
      <PageHeader
        breadcrumb={<BilingualLabel ja="クライアント / 新規" en="Clients / New" />}
        title={<BilingualLabel ja="新規クライアント" en="New Client" />}
        actions={
          <Button variant="outline" asChild>
            <Link to="/clients">
              <BilingualLabel ja="戻る" en="Back" />
            </Link>
          </Button>
        }
      />
      <ClientForm
        onSubmit={handleSubmit}
        submitting={createClient.isPending}
        submitLabelJa="作成"
        submitLabelEn="Create"
      />
    </PageShell>
  );
}
