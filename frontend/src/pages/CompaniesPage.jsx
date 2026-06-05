import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
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
      package: Number(values.package),
    };
    try {
      if (initialValues?._id) await companiesApi.update(initialValues._id, payload);
      else await companiesApi.create(payload);
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
  const { data, error, loading, refresh } = useAsync(async () => {
    const { data: response } = await companiesApi.list();
    return response.companies || [];
  }, []);
  const rows = data || [];

  const columns = useMemo(() => [
    { key: "companyName", header: "Company", render: (row) => <div><p className="font-semibold">{row.companyName}</p><p className="text-xs text-muted">{row.location}</p></div> },
    { key: "package", header: "Package", render: (row) => `${formatCurrency(row.package)} LPA` },
    { key: "eligibilityCGPA", header: "Eligibility", render: (row) => `${row.eligibilityCGPA || 0}+ CGPA` },
    { key: "driveDate", header: "Drive Date", render: (row) => formatDate(row.driveDate) },
    { key: "status", header: "Status", render: (row) => <Badge label={row.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => { setEditing({ ...row, driveDate: row.driveDate?.slice(0, 10) || "" }); setModalOpen(true); }} size="sm" variant="secondary"><FiEdit2 /></Button>
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
    </>
  );
}
