import { FiAlertCircle, FiInbox, FiLoader } from "react-icons/fi";
import Button from "./Button";
import Card from "./Card";

export function LoadingState({ label = "Loading data" }) {
  return (
    <Card className="flex min-h-64 items-center justify-center p-8">
      <div className="flex items-center gap-3 text-sm font-medium text-muted">
        <FiLoader className="h-5 w-5 animate-spin text-primary" />
        {label}
      </div>
    </Card>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card className="flex min-h-64 items-center justify-center p-8 text-center">
      <div>
        <FiAlertCircle className="mx-auto h-8 w-8 text-danger" />
        <h3 className="mt-3 text-sm font-semibold text-ink">Unable to load this page</h3>
        <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
        {onRetry ? (
          <Button className="mt-4" onClick={onRetry} variant="secondary">
            Retry
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export function EmptyState({ action, description, title = "No records found" }) {
  return (
    <div className="flex min-h-48 items-center justify-center p-8 text-center">
      <div>
        <FiInbox className="mx-auto h-8 w-8 text-slate-400" />
        <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
