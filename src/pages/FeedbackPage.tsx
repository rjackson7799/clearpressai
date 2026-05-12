import { useParams } from "react-router-dom";

export default function FeedbackPage() {
  const { token } = useParams<{ token: string }>();
  return (
    <div className="p-8">
      <div>Feedback / フィードバック</div>
      <div className="text-sm text-muted-foreground">token: {token}</div>
    </div>
  );
}
