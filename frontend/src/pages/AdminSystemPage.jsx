import { useEffect, useState } from "react";
import { FiActivity, FiAlertCircle, FiClock, FiDatabase, FiServer } from "react-icons/fi";
import apiClient from "../api/client";
import { auditApi } from "../api/services";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";

function Metric({ icon: Icon, label, value }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminSystemPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logError, setLogError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const start = performance.now();

    try {
      const [response, logsResponse] = await Promise.allSettled([
        apiClient.get("/system"),
        auditApi.list({ limit: 25 }),
      ]);

      if (response.status === "rejected") throw response.reason;

      setLatency(Math.round(performance.now() - start));
      setData(response.value.data);
      if (logsResponse.status === "fulfilled") {
        setLogs(logsResponse.value.data.logs || []);
        setLogError("");
      } else {
        setLogs([]);
        setLogError(logsResponse.reason?.message || "Unable to load activity feed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading system status" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        description="Hidden operational dashboard for health, request volume, errors, and environment visibility."
        title="System Debug"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FiServer} label="Backend Status" value={data.backendStatus} />
        <Metric icon={FiDatabase} label="Database Status" value={data.databaseStatus} />
        <Metric icon={FiActivity} label="API Latency" value={`${latency}ms`} />
        <Metric icon={FiClock} label="Server Uptime" value={`${Math.round(data.serverUptime)}s`} />
        <Metric icon={FiActivity} label="Total Requests" value={data.totalRequests} />
        <Metric icon={FiAlertCircle} label="Error Count" value={data.errorCount} />
        <Metric icon={FiServer} label="Environment" value={data.environment} />
        <Metric icon={FiClock} label="Last Request" value={data.lastRequestAt ? new Date(data.lastRequestAt).toLocaleTimeString() : "-"} />
      </div>
      <Card className="mt-6 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">Admin Activity Feed</h2>
          <p className="mt-1 text-sm text-muted">Recent write actions captured by the backend audit trail.</p>
        </div>
        {logError ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{logError}</div>
        ) : (
          <DataTable
            columns={[
              { key: "createdAt", header: "Time", render: (row) => new Date(row.createdAt).toLocaleString() },
              { key: "action", header: "Action" },
              { key: "entity", header: "Entity" },
              { key: "user", header: "User", render: (row) => row.user?.email || row.user?.name || "System" },
            ]}
            empty={{ title: "No activity yet", description: "Create, update, import, or upload records to populate the activity feed." }}
            rows={logs}
          />
        )}
      </Card>
    </>
  );
}
