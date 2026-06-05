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
import { companiesApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";
import { formatCurrency } from "../utils/formatters";

export default function CompanyAnalyticsPage() {
  const { companyId } = useParams();
  const { data, error, loading, refresh } = useAsync(async () => {
    const [analyticsResponse, funnelResponse] = await Promise.all([
      companiesApi.analytics(companyId),
      companiesApi.funnel(companyId),
    ]);
    return {
      ...analyticsResponse.data,
      funnel: funnelResponse.data.funnel || {},
    };
  }, [companyId]);

  if (loading) return <LoadingState label="Loading company analytics" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const company = data.company;
  const metrics = data.metrics || {};
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
    </>
  );
}
