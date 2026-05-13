import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { ClientForm } from "@/components/client/ClientForm";
import type { ClientFormValues } from "@/components/client/ClientForm.schema";
import {
  useClient,
  useDeleteClient,
  useUpdateClient,
} from "@/hooks/useClients";
import { ReadinessGate } from "@/components/brand-voice/ReadinessGate";
import { SampleUploader } from "@/components/brand-voice/SampleUploader";
import { SampleList } from "@/components/brand-voice/SampleList";
import { VoiceProfileEditor } from "@/components/brand-voice/VoiceProfileEditor";
import { GuidelinesPanel } from "@/components/brand-voice/GuidelinesPanel";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: client, isLoading, isError } = useClient(id);
  const updateClient = useUpdateClient(id ?? "");
  const deleteClient = useDeleteClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="space-y-2">
        <p>{t("common.error")}</p>
        <Button variant="outline" asChild>
          <Link to="/clients">{t("common.back")}</Link>
        </Button>
      </div>
    );
  }

  const handleUpdate = async (values: ClientFormValues) => {
    try {
      await updateClient.mutateAsync({
        name: values.name,
        name_en: values.name_en || null,
        industry: values.industry || "pharmaceutical",
        primary_contact_name: values.primary_contact_name || null,
        primary_contact_email: values.primary_contact_email || null,
        notes: values.notes || null,
      });
      toast.success(t("clients.updatedToast"));
      setEditing(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(id);
      toast.success(t("clients.deletedToast"));
      navigate("/clients");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">{client.name}</h1>
          {client.name_en && (
            <p className="text-muted-foreground">{client.name_en}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              {t("common.edit")}
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            {t("common.delete")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <BilingualLabel ja="詳細" en="Details" />
          </TabsTrigger>
          <TabsTrigger value="brandVoice">
            <BilingualLabel ja="ブランドボイス" en="Brand Voice" />
          </TabsTrigger>
          <TabsTrigger value="guidelines">
            <BilingualLabel ja="ガイドライン" en="Guidelines" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-6">
          {editing ? (
            <div className="space-y-4">
              <ClientForm
                defaultValues={{
                  name: client.name,
                  name_en: client.name_en ?? "",
                  industry: client.industry,
                  primary_contact_name: client.primary_contact_name ?? "",
                  primary_contact_email: client.primary_contact_email ?? "",
                  notes: client.notes ?? "",
                }}
                onSubmit={handleUpdate}
                submitting={updateClient.isPending}
              />
              <Button variant="ghost" onClick={() => setEditing(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <ClientDetailsReadOnly client={client} />
          )}
        </TabsContent>

        <TabsContent value="brandVoice" className="pt-6 space-y-6">
          <ReadinessGate clientId={id} />
          <SampleUploader clientId={id} />
          <SampleList clientId={id} />
          <VoiceProfileEditor clientId={id} />
        </TabsContent>

        <TabsContent value="guidelines" className="pt-6">
          <GuidelinesPanel clientId={id} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clients.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clients.confirmDeleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClientDetailsReadOnly({
  client,
}: {
  client: NonNullable<ReturnType<typeof useClient>["data"]>;
}) {
  const { t } = useTranslation();
  return (
    <dl className="grid max-w-2xl grid-cols-[12rem_1fr] gap-y-3 text-sm">
      <Row label={t("clients.name")} value={client.name} />
      <Row label={t("clients.nameEn")} value={client.name_en ?? "—"} />
      <Row
        label={t("clients.industry")}
        value={
          client.industry === "pharmaceutical"
            ? t("clients.industry_pharmaceutical")
            : client.industry
        }
      />
      <Row
        label={t("clients.primaryContactName")}
        value={client.primary_contact_name ?? "—"}
      />
      <Row
        label={t("clients.primaryContactEmail")}
        value={client.primary_contact_email ?? "—"}
      />
      <Row label={t("clients.notes")} value={client.notes ?? "—"} />
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap">{value}</dd>
    </>
  );
}

