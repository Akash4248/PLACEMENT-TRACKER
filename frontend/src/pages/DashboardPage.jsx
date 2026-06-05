import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { FiBriefcase, FiCheckCircle, FiFileText, FiGift, FiTrendingUp, FiUserCheck, FiUsers, FiXCircle } from "react-icons/fi";
import { companiesApi, dashboardApi } from "../api/services";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";
import { formatDate } from "../utils/formatters";

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

const daysRemaining = (value) => {
  const today = new Date();
  const date = new Date(value);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
};

export default function DashboardPage() {
  const { data, error, loading, refresh } = useAsync(async () => {
    const [
      statsResponse,
      analyticsResponse,
      departmentResponse,
      funnelResponse,
      companiesResponse,
    ] = await Promise.all([
      dashboardApi.stats(),
      dashboardApi.companyAnalytics(),
      dashboardApi.departmentAnalytics(),
      dashboardApi.funnel(),
      companiesApi.list(),
    ]);

    return {
      analytics: analyticsResponse.data.analytics || [],
      departmentAnalytics: departmentResponse.data.analytics || [],
      funnel: funnelResponse.data.funnel || {},
      companies: companiesResponse.data.companies || [],
      stats: statsResponse.data.stats || {},
    };
  }, []);

  if (loading) return <LoadingState label="Loading dashboard" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const stats = data.stats;
  const attendance = stats.attendance || {};
  const chartData = data.analytics.map((item, index) => ({
    company: item.companyName || `Company ${index + 1}`,
    selected: item.selected,
    totalApplicants: item.totalApplicants,
    selectionRate: item.selectionRate || 0,
  }));
  const statusData = [
    { name: "Selected", value: stats.selected || 0 },
    { name: "Rejected", value: stats.rejected || 0 },
    { name: "In Process", value: stats.inProcess || 0 },
    { name: "Offer Received", value: stats.offerReceived || 0 },
  ];
  const funnelData = [
    { name: "Applied", value: data.funnel.applied || 0, fill: "#2563EB" },
    { name: "Round 1", value: data.funnel.round1 || 0, fill: "#3B82F6" },
    { name: "Round 2", value: data.funnel.round2 || 0, fill: "#60A5FA" },
    { name: "Round 3", value: data.funnel.round3 || 0, fill: "#93C5FD" },
    { name: "Selected", value: data.funnel.selected || 0, fill: "#16A34A" },
  ];
  const upcomingDrives = data.companies
    .filter((company) => company.driveDate && daysRemaining(company.driveDate) >= 0)
    .sort((a, b) => new Date(a.driveDate) - new Date(b.driveDate))
    .slice(0, 10);
  const activeRecruitments = data.companies.filter((company) => company.status === "Ongoing" || company.status === "Upcoming").length;
  const topRecruiters = [...chartData].sort((a, b) => b.selected - a.selected).slice(0, 5);

  return (
    <>
      <PageHeader
        description="A real-time view of placement activity, pipeline health, and offer outcomes."
        title="Dashboard"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <KpiCard icon={FiUsers} label="Students" trend="+12% this term" value={stats.totalStudents} />
        <KpiCard icon={FiBriefcase} label="Companies" trend="+8% drives" value={stats.totalCompanies} />
        <KpiCard icon={FiFileText} label="Applications" trend="+18% activity" value={stats.totalApplications} />
        <KpiCard icon={FiCheckCircle} label="Selected" trend="On track" value={stats.selected} />
        <KpiCard icon={FiXCircle} label="Rejected" trend="Reviewed" value={stats.rejected} />
        <KpiCard icon={FiGift} label="Offers" trend="Finalized" value={stats.offerReceived} />
        <KpiCard icon={FiBriefcase} label="Upcoming Drives" trend="Scheduled" value={upcomingDrives.length} />
        <KpiCard icon={FiTrendingUp} label="Active Recruitments" trend="Open" value={activeRecruitments} />
        <KpiCard icon={FiUserCheck} label="Attendance Rate" trend={`${attendance.present || 0} present / ${attendance.absent || 0} absent`} value={`${attendance.attendanceRate || 0}%`} />
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Attendance Summary</h2>
            <p className="mt-1 text-sm text-muted">Interview attendance marked across all rounds.</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-3xl font-bold text-primary">{attendance.attendanceRate || 0}%</p>
            <p className="text-sm text-muted">Attendance Rate</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Total Attendance Records", attendance.totalCandidates || 0],
            ["Present Candidates", attendance.present || 0],
            ["Absent Candidates", attendance.absent || 0],
          ].map(([label, value]) => (
            <div className="rounded-xl border border-border bg-slate-50 p-4" key={label}>
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </div>
          ))}
        </div>
      </Card>

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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Department Analytics</h2>
            <p className="mt-1 text-sm text-muted">Student strength, selections, and placement rate by department.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentAnalytics}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="department" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#2563EB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="selected" fill="#16A34A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="placementRate" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Recruitment Funnel</h2>
            <p className="mt-1 text-sm text-muted">Candidate progression across the interview pipeline.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel data={funnelData} dataKey="value" nameKey="name">
                  <LabelList dataKey="name" fill="#0F172A" position="right" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-ink">Upcoming Drives</h2>
          <p className="mt-1 text-sm text-muted">Next 10 company drives sorted by date.</p>
        </div>
        {upcomingDrives.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {upcomingDrives.map((company) => (
              <div className="rounded-xl border border-border bg-slate-50 p-4" key={company._id}>
                <p className="text-sm font-semibold text-ink">{company.companyName}</p>
                <p className="mt-2 text-xs text-muted">{formatDate(company.driveDate)}</p>
                <p className="mt-3 text-sm font-semibold text-primary">
                  {daysRemaining(company.driveDate) === 0 ? "Today" : `${daysRemaining(company.driveDate)} days remaining`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No upcoming drives scheduled.
          </div>
        )}
      </Card>

      <Card className="mt-6 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-ink">Top Recruiting Companies</h2>
          <p className="mt-1 text-sm text-muted">Sorted by selected candidates.</p>
        </div>
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Applicants</th>
                <th className="px-4 py-3">Selected</th>
                <th className="px-4 py-3">Selection Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topRecruiters.map((company) => (
                <tr key={company.company}>
                  <td className="px-4 py-3 font-semibold text-ink">{company.company}</td>
                  <td className="px-4 py-3 text-muted">{company.totalApplicants}</td>
                  <td className="px-4 py-3 text-muted">{company.selected}</td>
                  <td className="px-4 py-3 text-primary font-semibold">{company.selectionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
