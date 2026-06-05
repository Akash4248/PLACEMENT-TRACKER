import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { FiDownload, FiEye } from "react-icons/fi";
import { companiesApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";
import { formatCurrency } from "../utils/formatters";

export default function CompanyAnalyticsPage() {
  const { companyId } = useParams();
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data, error, loading, refresh } = useAsync(async () => {
    const [analyticsResponse, funnelResponse, shortlistResponse] = await Promise.all([
      companiesApi.analytics(companyId),
      companiesApi.funnel(companyId),
      companiesApi.shortlist(companyId),
    ]);
    return {
      ...analyticsResponse.data,
      funnel: funnelResponse.data.funnel || {},
      shortlist: shortlistResponse.data,
    };
  }, [companyId]);

  if (loading) return <LoadingState label="Loading company analytics" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const company = data.company;
  const metrics = data.metrics || {};
  const shortlistSummary = data.shortlist?.summary || {};
  const shortlistedStudents = data.shortlist?.students || [];
  const funnelData = [
    { name: "Applied", value: data.funnel.applied || 0, fill: "#2563EB" },
    { name: "Aptitude", value: data.funnel.aptitude || 0, fill: "#3B82F6" },
    { name: "Coding", value: data.funnel.coding || 0, fill: "#60A5FA" },
    { name: "Technical", value: data.funnel.technical || 0, fill: "#93C5FD" },
    { name: "HR", value: data.funnel.hr || 0, fill: "#BFDBFE" },
    { name: "Selected", value: data.funnel.selected || 0, fill: "#16A34A" },
  ];

  return (
    <>
      <PageHeader
        description={`${formatCurrency(company.package)} LPA • ${company.allowedDepartments?.join(", ") || "All departments"} • ${company.minimumCGPA || company.eligibilityCGPA || 0}+ CGPA`}
        title={company.companyName}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Students", shortlistSummary.totalStudents],
          ["Eligible Students", shortlistSummary.eligibleStudents],
          ["Resume Submitted", shortlistSummary.resumeSubmitted],
          ["Resume Verified", shortlistSummary.resumeVerified],
          ["Shortlisted Students", shortlistSummary.shortlistedStudents],
        ].map(([label, value]) => (
          <Card className="p-5" key={label}>
            <p className="text-2xl font-bold text-ink">{value || 0}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </Card>
        ))}
      </div>
      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Eligibility-Based Shortlist</h2>
            <p className="mt-1 text-sm text-muted">Rule-based shortlist using CGPA, department, graduation year, and verified resume status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShortlistOpen(true)} variant="secondary"><FiEye />View Shortlisted Students</Button>
            <Button
              onClick={() => {
                const rows = shortlistedStudents.map((student) => ({
                  usn: student.usn,
                  name: student.name,
                  email: student.email,
                  department: student.department,
                  cgpa: student.cgpa,
                  graduationYear: student.graduationYear,
                }));
                const headers = Object.keys(rows[0] || { usn: "", name: "" });
                const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => `"${row[header] ?? ""}"`).join(","))].join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                const link = document.createElement("a");
                link.href = url;
                link.download = `${company.companyName}-shortlist.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              variant="secondary"
            >
              <FiDownload />Export Shortlist
            </Button>
            <Button
              loading={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  const response = await companiesApi.shortlistPdf(companyId);
                  const url = URL.createObjectURL(new Blob([response.data], { type: response.headers["content-type"] }));
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${company.companyName}-shortlist.pdf`;
                  link.click();
                  URL.revokeObjectURL(url);
                } finally {
                  setDownloading(false);
                }
              }}
            >
              <FiDownload />Download Shortlist PDF
            </Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["Applicants", metrics.applicants],
          ["Selected", metrics.selected],
          ["Rejected", metrics.rejected],
          ["Offers", metrics.offers],
          ["Selection Rate", `${metrics.selectionRate || 0}%`],
          ["Status", company.status],
        ].map(([label, value]) => (
          <Card className="p-5" key={label}>
            <p className="text-2xl font-bold text-ink">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-ink">Company Recruitment Funnel</h2>
          <div className="mt-4 h-80">
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
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-ink">Department Wise Selection</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentBreakdown || []}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="department" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip />
                <Bar dataKey="applicants" fill="#2563EB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="selected" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="mt-6">
        <DataTable
          columns={[
            { key: "department", header: "Department" },
            { key: "applicants", header: "Applicants" },
            { key: "selected", header: "Selected" },
            { key: "selectionRate", header: "Selection Rate", render: (row) => <Badge label={`${row.selectionRate}%`} /> },
          ]}
          empty={{ title: "No department data", description: "Applications will appear here once students apply." }}
          rows={(data.departmentBreakdown || []).map((row) => ({ ...row, _id: row.department }))}
        />
      </div>
      <Modal open={shortlistOpen} onClose={() => setShortlistOpen(false)} title="Shortlisted Students">
        <DataTable
          columns={[
            { key: "usn", header: "USN" },
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "department", header: "Department" },
            { key: "cgpa", header: "CGPA" },
            { key: "graduationYear", header: "Graduation Year" },
            { key: "resumeStatus", header: "Resume", render: (row) => <Badge label={row.resumeStatus} /> },
          ]}
          empty={{ title: "No shortlisted students", description: "Students must satisfy eligibility rules and have a verified resume." }}
          rows={shortlistedStudents}
        />
      </Modal>
    </>
  );
}
