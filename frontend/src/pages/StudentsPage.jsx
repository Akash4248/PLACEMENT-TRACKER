import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiUploadCloud } from "react-icons/fi";
import { studentsApi } from "../api/services";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import FormField, { inputClass } from "../components/ui/FormField";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import UploadPreviewModal from "../components/ui/UploadPreviewModal";
import useAsync from "../hooks/useAsync";

function StudentForm({ initialValues, onCancel, onSaved }) {
  const [error, setError] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: initialValues || {
      cgpa: "",
      department: "",
      email: "",
      graduationYear: "",
      name: "",
      phone: "",
      skills: "",
      usn: "",
    },
  });

  const onSubmit = async (values) => {
    setError("");
    const payload = {
      ...values,
      cgpa: Number(values.cgpa),
      graduationYear: values.graduationYear ? Number(values.graduationYear) : undefined,
      skills: values.skills ? values.skills.split(",").map((skill) => skill.trim()).filter(Boolean) : [],
    };

    try {
      if (initialValues?._id) {
        await studentsApi.update(initialValues._id, payload);
      } else {
        await studentsApi.create(payload);
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
        <FormField error={errors.usn?.message} label="USN">
          <input className={inputClass} {...register("usn", { required: "USN is required" })} />
        </FormField>
        <FormField error={errors.name?.message} label="Name">
          <input className={inputClass} {...register("name", { required: "Name is required" })} />
        </FormField>
        <FormField error={errors.email?.message} label="Email">
          <input className={inputClass} type="email" {...register("email", { required: "Email is required" })} />
        </FormField>
        <FormField label="Phone">
          <input className={inputClass} {...register("phone")} />
        </FormField>
        <FormField error={errors.department?.message} label="Department">
          <input className={inputClass} {...register("department", { required: "Department is required" })} />
        </FormField>
        <FormField error={errors.cgpa?.message} label="CGPA">
          <input className={inputClass} step="0.01" type="number" {...register("cgpa", { required: "CGPA is required" })} />
        </FormField>
        <FormField label="Graduation Year">
          <input className={inputClass} type="number" {...register("graduationYear")} />
        </FormField>
        <FormField label="Skills">
          <input className={inputClass} placeholder="React, Java, SQL" {...register("skills")} />
        </FormField>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button loading={isSubmitting} type="submit">{initialValues?._id ? "Save Changes" : "Add Student"}</Button>
      </div>
    </form>
  );
}

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const { data, error, loading, refresh } = useAsync(async () => {
    const { data: response } = await studentsApi.list({ search: query });
    return response.students || [];
  }, [query]);

  const rows = data || [];
  const columns = useMemo(() => [
    { key: "usn", header: "USN" },
    { key: "name", header: "Name", render: (row) => <div><p className="font-semibold">{row.name}</p><p className="text-xs text-muted">{row.phone || "No phone"}</p></div> },
    { key: "email", header: "Email" },
    { key: "department", header: "Department" },
    { key: "cgpa", header: "CGPA", render: (row) => <span className="font-semibold">{row.cgpa}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => { setEditing({ ...row, skills: row.skills?.join(", ") || "" }); setModalOpen(true); }} size="sm" variant="secondary"><FiEdit2 /></Button>
          <Button onClick={async () => { await studentsApi.remove(row._id); refresh(); }} size="sm" variant="ghost"><FiTrash2 className="text-danger" /></Button>
        </div>
      ),
    },
  ], [refresh]);

  if (loading) return <LoadingState label="Loading students" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <>
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setImportSummary(null); setImportOpen(true); }} variant="secondary"><FiUploadCloud />Import Students</Button>
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus />Add Student</Button>
          </div>
        }
        description="Manage student records, eligibility details, and placement-ready profiles."
        title="Students"
      />
      <div className="mb-4 flex h-11 max-w-md items-center gap-2 rounded-xl border border-border bg-white px-3 shadow-card">
        <FiSearch className="h-4 w-4 text-muted" />
        <input className="w-full border-0 bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search student" value={query} />
      </div>
      <DataTable columns={columns} empty={{ title: "No students yet", description: "Add student records to start tracking applications." }} rows={rows} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Student" : "Add Student"}>
        <StudentForm initialValues={editing} onCancel={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); refresh(); }} />
      </Modal>
      <UploadPreviewModal
        acceptedColumns={["usn", "name", "email", "department", "cgpa"]}
        onClose={() => setImportOpen(false)}
        onSubmit={async (file, onProgress) => {
          const { data: response } = await studentsApi.import(file, onProgress);
          setImportSummary(response);
          refresh();
        }}
        open={importOpen}
        summary={importSummary}
        title="Import Students"
      />
    </>
  );
}
