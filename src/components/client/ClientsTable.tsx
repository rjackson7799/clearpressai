import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useDeleteClient } from "@/hooks/useClients";
import type { Client } from "@/types/domain";

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ClientsTable() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useClients();
  const deleteClient = useDeleteClient();
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p>{t("common.error")}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-base font-medium">{t("clients.empty")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("clients.emptyHint")}
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("clients.name")}</TableHead>
            <TableHead>{t("clients.nameEn")}</TableHead>
            <TableHead>{t("clients.industry")}</TableHead>
            <TableHead>{t("clients.primaryContactName")}</TableHead>
            <TableHead>{t("clients.updatedAt")}</TableHead>
            <TableHead className="w-32 text-right">{t("clients.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((client) => (
            <TableRow
              key={client.id}
              className="cursor-pointer"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {client.name_en ?? "—"}
              </TableCell>
              <TableCell>
                {client.industry === "pharmaceutical"
                  ? t("clients.industry_pharmaceutical")
                  : client.industry}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.primary_contact_name ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(client.updated_at, i18n.language)}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete(client)}
                >
                  {t("common.delete")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clients.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clients.confirmDeleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  await deleteClient.mutateAsync(pendingDelete.id);
                  toast.success(t("clients.deletedToast"));
                  setPendingDelete(null);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
