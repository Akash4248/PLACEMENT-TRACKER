import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiCheckCircle, FiDownload, FiEdit2, FiEye, FiPlus, FiSearch, FiTrash2, FiUploadCloud, FiXCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { studentsApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import FormField, { inputClass } from "../components/ui/FormField";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import { ErrorState, LoadingState } from "../components/ui/StateBlock";
import UploadPreviewModal from "../components/ui/UploadPreviewModal";
import useAsync from "../hooks/useAsync";

function StudentForm({ initialValues, onCancel, onSaved }) {
  const [error, setError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
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
      let savedStudent;

      if (initialValues?._id) {
        const { data: response } = await studentsApi.update(initialValues._id, payload);
        savedStudent = response.student;
        toast.success("Student updated");
      } else {
        const { data: response } = await studentsApi.create(payload);
        savedStudent = response.student;
        toast.success("Student created");
      }

      if (resumeFile && savedStudent?._id) {
        await studentsApi.uploadResume(savedStudent._id, resumeFile);
        toast.success("Resume uploaded");
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
      <FormField label="Resume">
        <input
          accept=".pdf,.doc,.docx"
          className={inputClass}
          onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
          type="file"
        />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button loading={isSubmitting} type="submit">{initialValues?._id ? "Save Changes" : "Add Student"}</Button>
      </div>
    </form>
  );
}

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [minCGPA, setMinCGPA] = useState("");
  const [maxCGPA, setMaxCGPA] = useState("");
  const [resumeStatus, setResumeStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const pageSize = 20;
  const { data, error, loading, refresh } = useAsync(async () => {
    const { data: response } = await studentsApi.list({
      search: query || undefined,
      department: department || undefined,
      graduationYear: graduationYear || undefined,
      minCGPA: minCGPA || undefined,
      maxCGPA: maxCGPA || undefined,
      resumeStatus: resumeStatus || undefined,
      page,
      limit: pageSize,
    });
    return response;
  }, [query, department, graduationYear, minCGPA, maxCGPA, resumeStatus, page]);

  const uploadResume = async (student, file) => {
    if (!file) return;

    await studentsApi.uploadResume(student._id, file);
    toast.success("Resume uploaded");
    refresh();
  };

  const viewResume = async (student) => {
    const { data: file } = await studentsApi.resumeFile(student._id);
    const fileUrl = URL.createObjectURL(file);
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
  };

  const downloadResume = async (student) => {
    const [{ data: response }, { data: file }] = await Promise.all([
      studentsApi.resume(student._id),
      studentsApi.resumeFile(student._id, true),
    ]);
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = response.resumeFileName || `${student.usn}-resume`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileUrl);
  };

  const deleteResume = async (student) => {
    await studentsApi.deleteResume(student._id);
    toast.success("Resume deleted");
    refresh();
  };

  const rows = data?.students || [];
  const columns = useMemo(() => [
    { key: "usn", header: "USN" },
    { key: "name", header: "Name", render: (row) => <div><p className="font-semibold">{row.name}</p><p className="text-xs text-muted">{row.phone || "No phone"}</p></div> },
    { key: "email", header: "Email" },
    { key: "department", header: "Department" },
    { key: "cgpa", header: "CGPA", render: (row) => <span className="font-semibold">{row.cgpa}</span> },
    {
      key: "profile",
      header: "Profile",
      render: (row) => (
        <div className="min-w-28">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{row.profileStrength || 0}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${row.profileStrength || 0}%` }} />
          </div>
        </div>
      ),
    },
    { key: "resumeStatus", header: "Resume", render: (row) => <Badge label={row.resumeUrl ? row.resumeStatus : "Pending"} /> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:bg-slate-50">
            <FiUploadCloud />
            <input accept=".pdf,.doc,.docx" className="sr-only" onChange={(event) => uploadResume(row, event.target.files?.[0])} type="file" />
          </label>
          <Button disabled={!row.resumeUrl} onClick={() => viewResume(row)} size="sm" variant="secondary"><FiEye /></Button>
          <Button disabled={!row.resumeUrl} onClick={() => downloadResume(row)} size="sm" variant="secondary"><FiDownload /></Button>
          <Button disabled={!row.resumeUrl} onClick={() => deleteResume(row)} size="sm" variant="secondary"><FiTrash2 /></Button>
          <Button disabled={!row.resumeUrl} onClick={async () => { await studentsApi.verifyResume(row._id); toast.success("Resume verified"); refresh(); }} size="sm" variant="secondary"><FiCheckCircle className="text-success" /></Button>
          <Button disabled={!row.resumeUrl} onClick={async () => { await studentsApi.rejectResume(row._id); toast.success("Resume rejected"); refresh(); }} size="sm" variant="secondary"><FiXCircle className="text-danger" /></Button>
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
        <input className="w-full border-0 bg-transparent text-sm outline-none" onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search student" value={query} />
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <input className={inputClass} onChange={(event) => { setPage(1); setDepartment(event.target.value); }} placeholder="Department" value={department} />
        <input className={inputClass} onChange={(event) => { setPage(1); setGraduationYear(event.target.value); }} placeholder="Graduation year" type="number" value={graduationYear} />
        <input className={inputClass} onChange={(event) => { setPage(1); setMinCGPA(event.target.value); }} placeholder="Min CGPA" step="0.1" type="number" value={minCGPA} />
        <input className={inputClass} onChange={(event) => { setPage(1); setMaxCGPA(event.target.value); }} placeholder="Max CGPA" step="0.1" type="number" value={maxCGPA} />
        <select className={inputClass} onChange={(event) => { setPage(1); setResumeStatus(event.target.value); }} value={resumeStatus}>
          <option value="">All resume statuses</option>
          <option value="Pending">Pending</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <DataTable columns={columns} empty={{ title: "No students yet", description: "Add student records to start tracking applications." }} rows={rows} />
      <Pagination
        currentPage={data?.currentPage || page}
        onPageChange={setPage}
        pageSize={pageSize}
        totalPages={data?.totalPages || 1}
        totalRecords={data?.totalRecords || 0}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Student" : "Add Student"}>
        <StudentForm initialValues={editing} onCancel={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); refresh(); }} />
      </Modal>
      <UploadPreviewModal
        acceptedColumns={["usn", "name", "email", "department", "cgpa"]}
        onClose={() => setImportOpen(false)}
        onSubmit={async (file, onProgress) => {
          const { data: response } = await studentsApi.import(file, onProgress);
          setImportSummary(response);
          toast.success("Upload complete");
          refresh();
        }}
        open={importOpen}
        summary={importSummary}
        title="Import Students"
      />
    </>
  );
}
