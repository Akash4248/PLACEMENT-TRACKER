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
import { motion } from "framer-motion";
import { FiBriefcase, FiCheckCircle, FiFileText, FiGift, FiTrendingUp, FiUsers, FiXCircle } from "react-icons/fi";
import { dashboardApi } from "../api/services";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";

const COLORS = ["#2563EB", "#DC2626", "#F59E0B", "#6366F1"];

function KpiCard({ icon: Icon, label, value, trend }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl font-bold text-ink">{value ?? 0}</p>
            <p className="mt-1 text-sm font-medium text-muted">{label}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-success">
          <FiTrendingUp className="h-3.5 w-3.5" />
          {trend}
        </div>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data, error, loading, refresh } = useAsync(async () => {
    const [statsResponse, analyticsResponse] = await Promise.all([
      dashboardApi.stats(),
      dashboardApi.companyAnalytics(),
    ]);

    return {
      analytics: analyticsResponse.data.analytics || [],
      stats: statsResponse.data.stats || {},
    };
  }, []);

  if (loading) return <LoadingState label="Loading dashboard" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const stats = data.stats;
  const chartData = data.analytics.map((item, index) => ({
    company: item._id?.companyName || `Company ${index + 1}`,
    selected: item.selected,
    totalApplicants: item.totalApplicants,
  }));
  const statusData = [
    { name: "Selected", value: stats.selected || 0 },
    { name: "Rejected", value: stats.rejected || 0 },
    { name: "In Process", value: stats.inProcess || 0 },
    { name: "Offer Received", value: stats.offerReceived || 0 },
  ];

  return (
    <>
      <PageHeader
        description="A real-time view of placement activity, pipeline health, and offer outcomes."
        title="Dashboard"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={FiUsers} label="Students" trend="+12% this term" value={stats.totalStudents} />
        <KpiCard icon={FiBriefcase} label="Companies" trend="+8% drives" value={stats.totalCompanies} />
        <KpiCard icon={FiFileText} label="Applications" trend="+18% activity" value={stats.totalApplications} />
        <KpiCard icon={FiCheckCircle} label="Selected" trend="On track" value={stats.selected} />
        <KpiCard icon={FiXCircle} label="Rejected" trend="Reviewed" value={stats.rejected} />
        <KpiCard icon={FiGift} label="Offers" trend="Finalized" value={stats.offerReceived} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Selection Statistics</h2>
            <p className="mt-1 text-sm text-muted">Company-wise applicant selections.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="company" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip />
                <Bar dataKey="selected" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Recruitment Pipeline</h2>
            <p className="mt-1 text-sm text-muted">Application distribution by result state.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={70} outerRadius={105} paddingAngle={3}>
                  {statusData.map((entry, index) => (
                    <Cell fill={COLORS[index % COLORS.length]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {statusData.map((item, index) => (
              <div className="flex items-center gap-2 text-sm text-muted" key={item.name}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index] }} />
                {item.name}: <span className="font-semibold text-ink">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
