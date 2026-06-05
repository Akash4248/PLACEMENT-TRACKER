import { useEffect, useState } from "react";
import { FiActivity, FiAlertCircle, FiClock, FiDatabase, FiServer } from "react-icons/fi";
import apiClient from "../api/client";
import Card from "../components/ui/Card";
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

  const load = async () => {
    setLoading(true);
    setError("");
    const start = performance.now();

    try {
      const response = await apiClient.get("/system");
      setLatency(Math.round(performance.now() - start));
      setData(response.data);
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
    </>
  );
}
