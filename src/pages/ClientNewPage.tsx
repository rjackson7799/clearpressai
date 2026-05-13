import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ClientForm, type ClientFormValues } from "@/components/client/ClientForm";
import { useCreateClient } from "@/hooks/useClients";
import { BilingualLabel } from "@/components/shared/BilingualLabel";

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
    <div className="space-y-6">
      <h1 className="text-2xl">
        <BilingualLabel ja="新規クライアント" en="New Client" />
      </h1>
      <ClientForm
        onSubmit={handleSubmit}
        submitting={createClient.isPending}
        submitLabelJa="作成"
        submitLabelEn="Create"
      />
    </div>
  );
}
