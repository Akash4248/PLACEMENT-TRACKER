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
import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiFilter,
  FiPieChart,
  FiUsers,
} from "react-icons/fi";
import { useMemo, useState } from "react";
import { applicationsApi, companiesApi, reportsApi, studentsApi } from "../api/services";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FormField, { inputClass } from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";
import { formatCurrency } from "../utils/formatters";

const COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#6366F1"];

function downloadBlob(response, filename) {
  const blob = new Blob([response.data], {
    type: response.headers["content-type"],
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportCard({ children, description, icon: Icon, title }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <Card className="p-5">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Card>
  );
}

export default function ReportsPage() {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [downloading, setDownloading] = useState("");
  const [notice, setNotice] = useState(null);

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

  const departments = useMemo(
    () => [...new Set((data?.students || []).map((student) => student.department).filter(Boolean))].sort(),
    [data]
  );

  const runDownload = async (key, filename, loader) => {
    setDownloading(key);
    setNotice(null);
    try {
      const response = await loader();
      downloadBlob(response, filename);
      setNotice({ type: "success", message: `${filename} generated successfully.` });
    } catch (err) {
      setNotice({ type: "error", message: err.message || "Unable to generate report." });
    } finally {
      setDownloading("");
    }
  };

  if (loading) return <LoadingState label="Preparing Reports Center" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const selected = data.applications.filter(
    (application) => application.status === "Selected" || application.status === "Offer Received"
  );
  const rejected = data.applications.filter((application) => application.status === "Rejected");
  const offers = data.applications.filter((application) => application.status === "Offer Received");
  const selectionRate = data.applications.length ? Math.round((selected.length / data.applications.length) * 100) : 0;
  const averagePackage = data.companies.length
    ? (data.companies.reduce((sum, company) => sum + Number(company.package || 0), 0) / data.companies.length).toFixed(1)
    : 0;
  const departmentChart = departments.map((department) => {
    const students = data.students.filter((student) => student.department === department);
    const selectedInDepartment = selected.filter((application) => application.studentId?.department === department);
    return {
      department,
      students: students.length,
      selected: selectedInDepartment.length,
      placementRate: students.length ? Math.round((selectedInDepartment.length / students.length) * 100) : 0,
    };
  });
  const companyChart = data.companies
    .map((company) => {
      const applications = data.applications.filter((application) => application.companyId?._id === company._id);
      const companySelected = applications.filter(
        (application) => application.status === "Selected" || application.status === "Offer Received"
      );
      return {
        company: company.companyName,
        applicants: applications.length,
        selected: companySelected.length,
        selectionRate: applications.length ? Math.round((companySelected.length / applications.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.selected - a.selected)
    .slice(0, 8);
  const statusCounts = ["Applied", "In Process", "Selected", "Rejected", "Offer Received"].map((status) => ({
    name: status,
    value: data.applications.filter((application) => application.status === status).length,
  }));

  return (
    <>
      <PageHeader
        description="Generate boardroom-ready placement reports for management reviews, department meetings, and recruiter analysis."
        title="Reports Center"
      />

      {notice ? (
        <div
          className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-success"
              : "border-red-100 bg-red-50 text-danger"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Students" value={data.students.length} />
        <Metric label="Companies" value={data.companies.length} />
        <Metric label="Applications" value={data.applications.length} />
        <Metric label="Selected" value={selected.length} />
        <Metric label="Rejected" value={rejected.length} />
        <Metric label="Offers" value={offers.length} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Management Analytics Snapshot</h2>
            <p className="mt-1 text-sm text-muted">
              Selection rate is <span className="font-semibold text-ink">{selectionRate}%</span>; average active package is{" "}
              <span className="font-semibold text-ink">{formatCurrency(averagePackage)} LPA</span>.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChart}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="department" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#2563EB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="selected" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Result Distribution</h2>
            <p className="mt-1 text-sm text-muted">Current placement outcome mix.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts} dataKey="value" outerRadius={95}>
                  {statusCounts.map((entry, index) => (
                    <Cell fill={COLORS[index % COLORS.length]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ReportCard
          description="Complete institutional placement report with executive summary, KPIs, departments, companies, funnel, and metadata."
          icon={FiFileText}
          title="Placement Analytics Report"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              loading={downloading === "placement-pdf"}
              onClick={() => runDownload("placement-pdf", "campustrack-placement-analytics.pdf", reportsApi.placementAnalyticsPdf)}
            >
              <FiDownload />Generate PDF
            </Button>
            <Button
              loading={downloading === "placement-xlsx"}
              onClick={() => runDownload("placement-xlsx", "campustrack-placement-analytics.xlsx", reportsApi.placementAnalyticsXlsx)}
              variant="secondary"
            >
              <FiDownload />Generate Excel
            </Button>
          </div>
        </ReportCard>

        <ReportCard
          description="Recruitment funnel report showing movement from application through interview rounds and selection."
          icon={FiPieChart}
          title="Recruitment Funnel Report"
        >
          <Button
            loading={downloading === "funnel-pdf"}
            onClick={() => runDownload("funnel-pdf", "campustrack-recruitment-funnel.pdf", reportsApi.funnelPdf)}
          >
            <FiDownload />Generate PDF
          </Button>
        </ReportCard>

        <ReportCard
          description="Company-specific management report with applicants, selected candidates, offers, and selection rates."
          icon={FiBriefcase}
          title="Company Report"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <FormField label="Company">
              <select className={inputClass} onChange={(event) => setSelectedCompany(event.target.value)} value={selectedCompany}>
                <option value="">Select company</option>
                {data.companies.map((company) => (
                  <option key={company._id} value={company._id}>{company.companyName}</option>
                ))}
              </select>
            </FormField>
            <Button
              className="self-end"
              disabled={!selectedCompany}
              loading={downloading === "company-pdf"}
              onClick={() => runDownload("company-pdf", "campustrack-company-report.pdf", () => reportsApi.companyPdf(selectedCompany))}
            >
              <FiDownload />PDF
            </Button>
          </div>
        </ReportCard>

        <ReportCard
          description="Department-level report suitable for HOD and placement review meetings."
          icon={FiBarChart2}
          title="Department Report"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <FormField label="Department">
              <select className={inputClass} onChange={(event) => setSelectedDepartment(event.target.value)} value={selectedDepartment}>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </FormField>
            <Button
              className="self-end"
              disabled={!selectedDepartment}
              loading={downloading === "department-pdf"}
              onClick={() => runDownload("department-pdf", `campustrack-${selectedDepartment}-department-report.pdf`, () => reportsApi.departmentPdf(selectedDepartment))}
            >
              <FiDownload />PDF
            </Button>
          </div>
        </ReportCard>

        <ReportCard
          description="Student placement journey report covering applications, companies, rounds, and current outcomes."
          icon={FiUsers}
          title="Student Report"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <FormField label="Student">
              <select className={inputClass} onChange={(event) => setSelectedStudent(event.target.value)} value={selectedStudent}>
                <option value="">Select student</option>
                {data.students.slice(0, 500).map((student) => (
                  <option key={student._id} value={student._id}>{student.usn} - {student.name}</option>
                ))}
              </select>
            </FormField>
            <Button
              className="self-end"
              disabled={!selectedStudent}
              loading={downloading === "student-pdf"}
              onClick={() => runDownload("student-pdf", "campustrack-student-report.pdf", () => reportsApi.studentPdf(selectedStudent))}
            >
              <FiDownload />PDF
            </Button>
          </div>
        </ReportCard>

        <ReportCard
          description="Top recruiter summary for quick management briefing and strategic recruiter follow-up."
          icon={FiCheckCircle}
          title="Top Recruiter Summary"
        >
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Applicants</th>
                  <th className="px-3 py-2">Selected</th>
                  <th className="px-3 py-2">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companyChart.map((company) => (
                  <tr key={company.company}>
                    <td className="px-3 py-2 font-semibold text-ink">{company.company}</td>
                    <td className="px-3 py-2 text-muted">{company.applicants}</td>
                    <td className="px-3 py-2 text-muted">{company.selected}</td>
                    <td className="px-3 py-2 font-semibold text-primary">{company.selectionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>
      </div>
    </>
  );
}
