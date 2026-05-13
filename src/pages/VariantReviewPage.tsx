import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";

export default function VariantReviewPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">
          <BilingualLabel ja="バリアント レビュー" en="Variant Review" />
        </h1>
        <Button variant="outline" asChild>
          <Link to="/projects">
            <BilingualLabel ja="戻る" en="Back" />
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        <BilingualLabel ja="準備中" en="Coming soon" /> ({id})
      </p>
    </div>
  );
}
