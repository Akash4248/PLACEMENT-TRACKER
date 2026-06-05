import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiCheck, FiGift, FiPlus, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import { applicationsApi, companiesApi, studentsApi } from "../api/services";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FormField, { inputClass } from "../components/ui/FormField";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateBlock";
import UploadPreviewModal from "../components/ui/UploadPreviewModal";
import useAsync from "../hooks/useAsync";

const statuses = ["Applied", "In Process", "Selected", "Rejected", "Offer Received"];

function ApplicationForm({ companies, onCancel, onSaved, students }) {
  const [error, setError] = useState("");
  const { formState: { errors, isSubmitting }, handleSubmit, register } = useForm({
    defaultValues: { companyId: "", studentId: "" },
  });

  const onSubmit = async (values) => {
    setError("");
    try {
      await applicationsApi.create(values);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div> : null}
      <FormField error={errors.studentId?.message} label="Student">
        <select className={inputClass} {...register("studentId", { required: "Student is required" })}>
          <option value="">Select student</option>
          {students.map((student) => <option key={student._id} value={student._id}>{student.usn} - {student.name}</option>)}
        </select>
      </FormField>
      <FormField error={errors.companyId?.message} label="Company">
        <select className={inputClass} {...register("companyId", { required: "Company is required" })}>
          <option value="">Select company</option>
          {companies.map((company) => <option key={company._id} value={company._id}>{company.companyName}</option>)}
        </select>
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button loading={isSubmitting} type="submit">Create Application</Button>
      </div>
    </form>
  );
}

export default function ApplicationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSummary, setBulkSummary] = useState(null);
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

  const grouped = useMemo(() => {
    const map = Object.fromEntries(statuses.map((status) => [status, []]));
    (data?.applications || []).forEach((application) => {
      map[application.status || "Applied"]?.push(application);
    });
    return map;
  }, [data]);

  if (loading) return <LoadingState label="Loading applications" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <>
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setBulkSummary(null); setBulkOpen(true); }} variant="secondary"><FiUploadCloud />Bulk Upload Results</Button>
            <Button onClick={() => setModalOpen(true)}><FiPlus />New Application</Button>
          </div>
        }
        description="Track each candidate from applied through interviews, selections, rejections, and offers."
        title="Applications"
      />
      <div className="grid gap-4 xl:grid-cols-5">
        {statuses.map((status) => (
          <Card className="min-h-[520px] p-3" key={status}>
            <div className="mb-3 flex items-center justify-between px-1">
              <Badge label={status} />
              <span className="text-xs font-semibold text-muted">{grouped[status].length}</span>
            </div>
            <div className="space-y-3">
              {grouped[status].length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">No cards</div>
              ) : grouped[status].map((application) => (
                <div className="rounded-xl border border-border bg-white p-4 shadow-card" key={application._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{application.studentId?.name || "Student removed"}</h3>
                      <p className="mt-1 text-xs text-muted">{application.studentId?.usn || "No USN"}</p>
                    </div>
                    <Button onClick={async () => { await applicationsApi.remove(application._id); refresh(); }} size="sm" variant="ghost">
                      <FiTrash2 className="text-danger" />
                    </Button>
                  </div>
                  <p className="mt-3 text-sm font-medium text-ink">{application.companyId?.companyName || "Company removed"}</p>
                  <p className="mt-1 text-xs text-muted">Round {application.currentRound || 1}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {status !== "Selected" && status !== "Rejected" && status !== "Offer Received" ? (
                      <>
                        <Button onClick={async () => { await applicationsApi.updateResult(application._id, { attended: true, result: "PASS" }); refresh(); }} size="sm" variant="secondary"><FiCheck />Pass</Button>
                        <Button onClick={async () => { await applicationsApi.updateResult(application._id, { attended: true, result: "FAIL" }); refresh(); }} size="sm" variant="secondary"><FiX />Fail</Button>
                      </>
                    ) : null}
                    {status === "Selected" ? (
                      <Button onClick={async () => { await applicationsApi.markOffer(application._id); refresh(); }} size="sm"><FiGift />Offer</Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {data.applications.length === 0 ? (
        <Card className="mt-6">
          <EmptyState description="Create applications to populate the Kanban board." title="No applications yet" />
        </Card>
      ) : null}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Application">
        <ApplicationForm companies={data.companies} onCancel={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); refresh(); }} students={data.students} />
      </Modal>
      <UploadPreviewModal
        acceptedColumns={["USN", "ROUND_ID", "RESULT"]}
        onClose={() => setBulkOpen(false)}
        onSubmit={async (file, onProgress) => {
          const { data: response } = await applicationsApi.bulkResults(file, onProgress);
          setBulkSummary(response);
          refresh();
        }}
        open={bulkOpen}
        summary={bulkSummary}
        title="Bulk Upload Results"
      />
    </>
  );
}
