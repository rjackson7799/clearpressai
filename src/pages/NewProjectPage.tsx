import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";

export default function NewProjectPage() {
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
      <p className="text-sm text-muted-foreground">
        <BilingualLabel ja="準備中" en="Coming soon" />
      </p>
    </div>
  );
}
