import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiBarChart2, FiEdit2, FiEye, FiPlus, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { companiesApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import FormField, { inputClass, textareaClass } from "../components/ui/FormField";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";
import { formatCurrency, formatDate } from "../utils/formatters";

function CompanyForm({ initialValues, onCancel, onSaved }) {
  const [error, setError] = useState("");
  const { formState: { errors, isSubmitting }, handleSubmit, register } = useForm({
    defaultValues: initialValues || {
      companyName: "",
      description: "",
      driveDate: "",
      eligibilityCGPA: "",
      minimumCGPA: "",
      allowedDepartments: "",
      allowedGraduationYears: "",
      location: "",
      package: "",
      status: "Upcoming",
    },
  });

  const onSubmit = async (values) => {
    setError("");
    const payload = {
      ...values,
      eligibilityCGPA: Number(values.eligibilityCGPA || 0),
      minimumCGPA: Number(values.minimumCGPA || values.eligibilityCGPA || 0),
      allowedDepartments: values.allowedDepartments
        ? values.allowedDepartments.split(",").map((department) => department.trim()).filter(Boolean)
        : [],
      allowedGraduationYears: values.allowedGraduationYears
        ? values.allowedGraduationYears.split(",").map((year) => Number(year.trim())).filter(Boolean)
        : [],
      package: Number(values.package),
    };
    try {
      if (initialValues?._id) {
        await companiesApi.update(initialValues._id, payload);
        toast.success("Company updated");
      } else {
        await companiesApi.create(payload);
        toast.success("Company created");
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField error={errors.companyName?.message} label="Company Name">
          <input className={inputClass} {...register("companyName", { required: "Company name is required" })} />
        </FormField>
        <FormField error={errors.package?.message} label="Package (LPA)">
          <input className={inputClass} step="0.1" type="number" {...register("package", { required: "Package is required" })} />
        </FormField>
        <FormField error={errors.location?.message} label="Location">
          <input className={inputClass} {...register("location", { required: "Location is required" })} />
        </FormField>
        <FormField label="Eligibility CGPA">
          <input className={inputClass} step="0.1" type="number" {...register("eligibilityCGPA")} />
        </FormField>
        <FormField label="Minimum CGPA">
          <input className={inputClass} step="0.1" type="number" {...register("minimumCGPA")} />
        </FormField>
        <FormField label="Allowed Departments">
          <input className={inputClass} placeholder="CSE, ISE, AIML" {...register("allowedDepartments")} />
        </FormField>
        <FormField label="Allowed Graduation Years">
          <input className={inputClass} placeholder="2025, 2026" {...register("allowedGraduationYears")} />
        </FormField>
        <FormField label="Drive Date">
          <input className={inputClass} type="date" {...register("driveDate")} />
        </FormField>
        <FormField label="Status">
          <select className={inputClass} {...register("status")}>
            <option>Upcoming</option>
            <option>Ongoing</option>
            <option>Completed</option>
          </select>
        </FormField>
      </div>
      <FormField label="Description">
        <textarea className={textareaClass} {...register("description")} />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button loading={isSubmitting} type="submit">{initialValues?._id ? "Save Changes" : "Add Company"}</Button>
      </div>
    </form>
  );
}

export default function CompaniesPage() {
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eligibilityCompany, setEligibilityCompany] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");
  const { data, error, loading, refresh } = useAsync(async () => {
    const { data: response } = await companiesApi.list();
    return response.companies || [];
  }, []);
  const rows = data || [];

  const viewEligibility = async (company) => {
    setEligibilityCompany(company);
    setEligibility(null);
    setEligibilityError("");
    setEligibilityLoading(true);

    try {
      const { data: response } = await companiesApi.eligibleStudents(company._id);
      setEligibility(response);
    } catch (err) {
      setEligibilityError(err.message);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const columns = useMemo(() => [
    { key: "companyName", header: "Company", render: (row) => <div><p className="font-semibold">{row.companyName}</p><p className="text-xs text-muted">{row.location}</p></div> },
    { key: "package", header: "Package", render: (row) => `${formatCurrency(row.package)} LPA` },
    { key: "eligibilityCGPA", header: "Eligibility", render: (row) => `${row.minimumCGPA || row.eligibilityCGPA || 0}+ CGPA` },
    { key: "driveDate", header: "Drive Date", render: (row) => formatDate(row.driveDate) },
    { key: "status", header: "Status", render: (row) => <Badge label={row.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => { setEditing({ ...row, driveDate: row.driveDate?.slice(0, 10) || "", allowedDepartments: row.allowedDepartments?.join(", ") || "", allowedGraduationYears: row.allowedGraduationYears?.join(", ") || "" }); setModalOpen(true); }} size="sm" variant="secondary"><FiEdit2 /></Button>
          <Button onClick={() => viewEligibility(row)} size="sm" variant="secondary"><FiEye /></Button>
          <Link className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:bg-slate-50" to={`/companies/${row._id}/analytics`}><FiBarChart2 /></Link>
          <Button onClick={async () => { await companiesApi.remove(row._id); refresh(); }} size="sm" variant="ghost"><FiTrash2 className="text-danger" /></Button>
        </div>
      ),
    },
  ], [refresh]);

  if (loading) return <LoadingState label="Loading companies" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <>
      <PageHeader
        action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus />Add Company</Button>}
        description="Maintain recruiting companies, packages, eligibility rules, and drive status."
        title="Companies"
      />
      <DataTable columns={columns} empty={{ title: "No companies yet", description: "Create a company drive before adding rounds or applications." }} rows={rows} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Company" : "Add Company"}>
        <CompanyForm initialValues={editing} onCancel={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); refresh(); }} />
      </Modal>
      <Modal open={Boolean(eligibilityCompany)} onClose={() => setEligibilityCompany(null)} title={`Eligible Students - ${eligibilityCompany?.companyName || ""}`}>
        {eligibilityLoading ? <LoadingState label="Checking eligibility" /> : null}
        {eligibilityError ? <ErrorState message={eligibilityError} onRetry={() => viewEligibility(eligibilityCompany)} /> : null}
        {eligibility ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-slate-50 p-4">
                <p className="text-2xl font-bold text-success">{eligibility.eligibleCount}</p>
                <p className="text-sm text-muted">Eligible Students</p>
              </div>
              <div className="rounded-xl border border-border bg-slate-50 p-4">
                <p className="text-2xl font-bold text-danger">{eligibility.notEligibleCount}</p>
                <p className="text-sm text-muted">Not Eligible Students</p>
              </div>
            </div>
            <DataTable
              columns={[
                { key: "usn", header: "USN" },
                { key: "name", header: "Name" },
                { key: "department", header: "Department" },
                { key: "cgpa", header: "CGPA" },
              ]}
              empty={{ title: "No eligible students", description: "No students match this company's eligibility rule." }}
              rows={eligibility.students || []}
            />
            <DataTable
              columns={[
                { key: "usn", header: "USN" },
                { key: "name", header: "Name" },
                { key: "department", header: "Department" },
                { key: "cgpa", header: "CGPA" },
              ]}
              empty={{ title: "No ineligible students", description: "Every student currently matches this eligibility rule." }}
              rows={eligibility.notEligibleStudents || []}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
