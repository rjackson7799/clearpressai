import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientsTable } from "@/components/client/ClientsTable";

export default function ClientsListPage() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <PageHeader
        title={<BilingualLabel ja="クライアント" en="Clients" />}
        subtitle={
          <BilingualLabel
            ja="クライアントのブランドボイスプロファイルを管理します。"
            en="Manage your client brand voice profiles."
          />
        }
        actions={
          <Button asChild>
            <Link to="/clients/new">
              <BilingualLabel ja="新規作成" en="New" />
            </Link>
          </Button>
        }
      />
      <ClientsTable />
      <p className="sr-only">{t("clients.title")}</p>
    </PageShell>
  );
}
