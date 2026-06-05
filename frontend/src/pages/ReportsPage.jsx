import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiAward, FiBriefcase, FiDownload, FiFileText, FiUsers } from "react-icons/fi";
import { applicationsApi, companiesApi, studentsApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";
import { formatCurrency } from "../utils/formatters";

const COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#6366F1"];

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

export default function ReportsPage() {
  const { data, error, loading, refresh } = useAsync(async () => {
    const [applicationsRes, studentsRes, companiesRes] = await Promise.all([
      applicationsApi.list(),
      studentsApi.list(),
      companiesApi.list(),
    ]);
    return {
      applications: applicationsRes.data.applications || [],
      companies: companiesRes.data.companies || [],
      students: studentsRes.data.students || [],
    };
  }, []);

  if (loading) return <LoadingState label="Compiling reports" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const statusCounts = ["Applied", "In Process", "Selected", "Rejected", "Offer Received"].map((status) => ({
    name: status,
    value: data.applications.filter((application) => application.status === status).length,
  }));

  const companyCounts = data.companies.map((company) => ({
    company: company.companyName,
    applications: data.applications.filter((application) => application.companyId?._id === company._id).length,
    package: company.package,
  }));

  const selected = data.applications.filter((application) => application.status === "Selected" || application.status === "Offer Received");
  const offerRate = data.applications.length ? Math.round((selected.length / data.applications.length) * 100) : 0;
  const avgPackage = data.companies.length
    ? (data.companies.reduce((sum, company) => sum + Number(company.package || 0), 0) / data.companies.length).toFixed(1)
    : 0;

  const columns = [
    { key: "student", header: "Student", render: (row) => <div><p className="font-semibold">{row.studentId?.name || "Unknown"}</p><p className="text-xs text-muted">{row.studentId?.department || "No department"}</p></div> },
    { key: "company", header: "Company", render: (row) => row.companyId?.companyName || "Unknown" },
    { key: "round", header: "Current Round", render: (row) => row.currentRound || 1 },
    { key: "status", header: "Status", render: (row) => <Badge label={row.status} /> },
  ];

  return (
    <>
      <PageHeader
        action={<Button variant="secondary"><FiDownload />Export View</Button>}
        description="Review placement outcomes, company participation, and student progress."
        title="Reports"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FiUsers} label="Registered Students" value={data.students.length} />
        <Metric icon={FiBriefcase} label="Recruiting Companies" value={data.companies.length} />
        <Metric icon={FiFileText} label="Applications" value={data.applications.length} />
        <Metric icon={FiAward} label="Offer Rate" value={`${offerRate}%`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Company Application Volume</h2>
            <p className="mt-1 text-sm text-muted">Applications received per company drive.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyCounts}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="company" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip />
                <Bar dataKey="applications" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Result Mix</h2>
            <p className="mt-1 text-sm text-muted">Distribution across application stages.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts} dataKey="value" outerRadius={95}>
                  {statusCounts.map((entry, index) => <Cell fill={COLORS[index % COLORS.length]} key={entry.name} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-muted">
            Average package across active companies is <span className="font-semibold text-ink">{formatCurrency(avgPackage)} LPA</span>.
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          empty={{ title: "No report data", description: "Applications will appear here after students apply to companies." }}
          rows={data.applications}
        />
      </div>
    </>
  );
}
