import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { roundsApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";

export default function RoundDetailPage() {
  const { roundId } = useParams();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { data, error, loading, refresh } = useAsync(async () => {
    const { data: response } = await roundsApi.applications(roundId);
    return response;
  }, [roundId]);

  const rows = data?.applications || [];
  const selectedCount = selectedIds.size;

  const toggle = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (action) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    try {
      await action(roundId, ids);
      setSelectedIds(new Set());
      refresh();
    } catch (err) {
      toast.error(err.message || "Unable to update round result");
    }
  };

  const runAttendanceBulk = async (action) => {
    const studentIds = rows
      .filter((row) => selectedIds.has(row._id) && row.student?._id)
      .map((row) => row.student._id);

    if (!studentIds.length) return;

    try {
      const { data: response } = await action(roundId, studentIds);
      toast.success(`Attendance updated for ${response.updated || studentIds.length} candidates`);
      setSelectedIds(new Set());
      refresh();
    } catch (err) {
      toast.error(err.message || "Unable to update attendance");
    }
  };

  const columns = useMemo(() => [
    {
      key: "select",
      header: "",
      render: (row) => (
        <input checked={selectedIds.has(row._id)} className="h-4 w-4 rounded border-border text-primary" onChange={() => toggle(row._id)} type="checkbox" />
      ),
    },
    { key: "usn", header: "USN", render: (row) => row.student?.usn || "-" },
    { key: "name", header: "Name", render: (row) => row.student?.name || "-" },
    { key: "department", header: "Department", render: (row) => row.student?.department || "-" },
    { key: "status", header: "Current Status", render: (row) => <Badge label={row.currentStatus} /> },
    { key: "attendanceStatus", header: "Attendance", render: (row) => <Badge label={row.attendanceStatus || "Not Marked"} /> },
    { key: "result", header: "Result", render: (row) => <Badge label={row.result} /> },
  ], [selectedIds]);

  if (loading) return <LoadingState label="Loading round detail" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <>
      <PageHeader
        description={`${data.round?.companyId?.companyName || "Company"} candidates appearing for this round.`}
        title={data.round?.roundName || "Round Detail"}
      />
      {selectedCount > 0 ? (
        <div className="sticky top-20 z-20 mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-lift sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-ink">{selectedCount} selected</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runAttendanceBulk(roundsApi.markPresent)} size="sm" variant="secondary">Mark Present</Button>
            <Button onClick={() => runAttendanceBulk(roundsApi.markAbsent)} size="sm" variant="secondary">Mark Absent</Button>
            <Button onClick={() => runAttendanceBulk(roundsApi.clearAttendance)} size="sm" variant="secondary">Clear Attendance</Button>
            <Button onClick={() => runBulk(roundsApi.bulkPass)} size="sm" variant="secondary">Pass Selected</Button>
            <Button onClick={() => runBulk(roundsApi.bulkReject)} size="sm" variant="secondary">Reject Selected</Button>
            <Button onClick={() => runBulk(roundsApi.bulkAbsent)} size="sm" variant="danger">Mark Absent</Button>
            <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="ghost">Clear</Button>
          </div>
        </div>
      ) : null}
      <DataTable
        columns={columns}
        empty={{ title: "No candidates found", description: "No students are currently associated with this round." }}
        rows={rows}
      />
    </>
  );
}
