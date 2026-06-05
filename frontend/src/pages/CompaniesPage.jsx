import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiBarChart2, FiEdit2, FiEye, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { companiesApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import FormField, { inputClass, textareaClass } from "../components/ui/FormField";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
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
          <input className={inputClass} {...register("companyName", {
            minLength: { message: "Company name must be at least 2 characters", value: 2 },
            required: "Company name is required",
          })} />
        </FormField>
        <FormField error={errors.package?.message} label="Package (LPA)">
          <input className={inputClass} step="0.1" type="number" {...register("package", {
            min: { message: "Package cannot be negative", value: 0 },
            required: "Package is required",
          })} />
        </FormField>
        <FormField error={errors.location?.message} label="Location">
          <input className={inputClass} {...register("location", {
            minLength: { message: "Location must be at least 2 characters", value: 2 },
            required: "Location is required",
          })} />
        </FormField>
        <FormField error={errors.eligibilityCGPA?.message} label="Eligibility CGPA">
          <input className={inputClass} step="0.1" type="number" {...register("eligibilityCGPA", {
            max: { message: "CGPA cannot exceed 10", value: 10 },
            min: { message: "CGPA cannot be negative", value: 0 },
          })} />
        </FormField>
        <FormField error={errors.minimumCGPA?.message} label="Minimum CGPA">
          <input className={inputClass} step="0.1" type="number" {...register("minimumCGPA", {
            max: { message: "CGPA cannot exceed 10", value: 10 },
            min: { message: "CGPA cannot be negative", value: 0 },
          })} />
        </FormField>
        <FormField label="Allowed Departments">
          <input className={inputClass} placeholder="CSE, ISE, AIML" {...register("allowedDepartments")} />
        </FormField>
        <FormField label="Allowed Graduation Years">
          <input className={inputClass} placeholder="2025, 2026" {...register("allowedGraduationYears")} />
        </FormField>
        <FormField error={errors.driveDate?.message} label="Drive Date">
          <input className={inputClass} type="date" {...register("driveDate", {
            validate: (value) => !value || !Number.isNaN(new Date(value).getTime()) || "Use a valid drive date",
          })} />
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
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    eligibilityCGPA: "",
    maxPackage: "",
    minPackage: "",
    query: "",
    status: "",
  });
  const [status, setStatus] = useState("");
  const [minPackage, setMinPackage] = useState("");
  const [maxPackage, setMaxPackage] = useState("");
  const [eligibilityCGPA, setEligibilityCGPA] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eligibilityCompany, setEligibilityCompany] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");
  const [filterError, setFilterError] = useState("");
  const pageSize = 20;
  const { data, error, loading, refresh } = useAsync(async () => {
    const { data: response } = await companiesApi.list({
      search: query || undefined,
      status: status || undefined,
      minPackage: minPackage || undefined,
      maxPackage: maxPackage || undefined,
      eligibilityCGPA: eligibilityCGPA || undefined,
      page,
      limit: pageSize,
    });
    return response;
  }, [query, status, minPackage, maxPackage, eligibilityCGPA, page]);
  const rows = data?.companies || [];

  const applyFilters = (event) => {
    event.preventDefault();
    setFilterError("");
    const min = filters.minPackage === "" ? null : Number(filters.minPackage);
    const max = filters.maxPackage === "" ? null : Number(filters.maxPackage);
    const cgpa = filters.eligibilityCGPA === "" ? null : Number(filters.eligibilityCGPA);

    if ((min !== null && min < 0) || (max !== null && max < 0)) {
      setFilterError("Package filters cannot be negative.");
      return;
    }

    if (min !== null && max !== null && min > max) {
      setFilterError("Minimum package cannot be greater than maximum package.");
      return;
    }

    if (cgpa !== null && (cgpa < 0 || cgpa > 10)) {
      setFilterError("Eligibility CGPA must be between 0 and 10.");
      return;
    }

    setPage(1);
    setQuery(filters.query.trim());
    setStatus(filters.status);
    setMinPackage(filters.minPackage);
    setMaxPackage(filters.maxPackage);
    setEligibilityCGPA(filters.eligibilityCGPA);
  };
  const clearFilters = () => {
    const emptyFilters = {
      eligibilityCGPA: "",
      maxPackage: "",
      minPackage: "",
      query: "",
      status: "",
    };
    setFilters(emptyFilters);
    setFilterError("");
    setPage(1);
    setQuery("");
    setStatus("");
    setMinPackage("");
    setMaxPackage("");
    setEligibilityCGPA("");
  };

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
      <form className="mb-4 space-y-3" onSubmit={applyFilters}>
        <div className="flex h-11 max-w-md items-center gap-2 rounded-xl border border-border bg-white px-3 shadow-card">
          <FiSearch className="h-4 w-4 text-muted" />
          <input className="w-full border-0 bg-transparent text-sm outline-none" onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Search company or location" value={filters.query} />
        </div>
        <div className="grid gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
          <select className={inputClass} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} value={filters.status}>
            <option value="">All statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          <input className={inputClass} onChange={(event) => setFilters((current) => ({ ...current, minPackage: event.target.value }))} placeholder="Min package" step="0.1" type="number" value={filters.minPackage} />
          <input className={inputClass} onChange={(event) => setFilters((current) => ({ ...current, maxPackage: event.target.value }))} placeholder="Max package" step="0.1" type="number" value={filters.maxPackage} />
          <input className={inputClass} onChange={(event) => setFilters((current) => ({ ...current, eligibilityCGPA: event.target.value }))} placeholder="Student CGPA eligibility" step="0.1" type="number" value={filters.eligibilityCGPA} />
          <Button type="submit" variant="secondary"><FiSearch />Search</Button>
          <Button onClick={clearFilters} type="button" variant="ghost">Clear</Button>
        </div>
        {filterError ? <p className="text-sm font-medium text-danger">{filterError}</p> : null}
      </form>
      <DataTable columns={columns} empty={{ title: "No companies yet", description: "Create a company drive before adding rounds or applications." }} rows={rows} />
      <Pagination
        currentPage={data?.currentPage || page}
        onPageChange={setPage}
        pageSize={pageSize}
        totalPages={data?.totalPages || 1}
        totalRecords={data?.totalRecords || 0}
      />
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
