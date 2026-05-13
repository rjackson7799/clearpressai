import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { ClientsTable } from "@/components/client/ClientsTable";

export default function ClientsListPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">
          <BilingualLabel ja="クライアント" en="Clients" />
        </h1>
        <Button asChild>
          <Link to="/clients/new">
            <BilingualLabel ja="新規作成" en="New" />
          </Link>
        </Button>
      </div>
      <ClientsTable />
      <p className="sr-only">{t("clients.title")}</p>
    </div>
  );
}
