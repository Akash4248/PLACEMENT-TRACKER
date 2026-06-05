import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { companiesApi, roundsApi } from "../api/services";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FormField, { inputClass } from "../components/ui/FormField";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateBlock";
import useAsync from "../hooks/useAsync";

function RoundForm({ companyId, initialValues, onCancel, onSaved }) {
  const [error, setError] = useState("");
  const { formState: { errors, isSubmitting }, handleSubmit, register } = useForm({
    defaultValues: initialValues || {
      roundName: "",
      roundType: "Technical",
      sequence: "",
    },
  });

  const onSubmit = async (values) => {
    setError("");
    const payload = { ...values, companyId, sequence: Number(values.sequence) };
    try {
      if (initialValues?._id) await roundsApi.update(initialValues._id, payload);
      else await roundsApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div> : null}
      <FormField error={errors.roundName?.message} label="Round Name">
        <input className={inputClass} {...register("roundName", { required: "Round name is required" })} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Round Type">
          <select className={inputClass} {...register("roundType")}>
            <option>Aptitude</option>
            <option>Coding</option>
            <option>Technical</option>
            <option>Group Discussion</option>
            <option>HR</option>
            <option>Other</option>
          </select>
        </FormField>
        <FormField error={errors.sequence?.message} label="Sequence">
          <input className={inputClass} type="number" {...register("sequence", { required: "Sequence is required" })} />
        </FormField>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button loading={isSubmitting} type="submit">{initialValues?._id ? "Save Changes" : "Add Round"}</Button>
      </div>
    </form>
  );
}

export default function RoundsPage() {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [rounds, setRounds] = useState([]);
  const [roundLoading, setRoundLoading] = useState(false);
  const [roundError, setRoundError] = useState("");
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: companies, error, loading, refresh } = useAsync(async () => {
    const { data } = await companiesApi.list();
    return data.companies || [];
  }, []);

  useEffect(() => {
    if (!companies?.length) return;
    setSelectedCompany((current) => current || companies[0]._id);
  }, [companies]);

  const loadRounds = async () => {
    if (!selectedCompany) return;
    setRoundLoading(true);
    setRoundError("");
    try {
      const { data } = await roundsApi.byCompany(selectedCompany);
      setRounds(data.rounds || []);
    } catch (err) {
      setRoundError(err.message);
    } finally {
      setRoundLoading(false);
    }
  };

  useEffect(() => {
    loadRounds();
  }, [selectedCompany]);

  if (loading) return <LoadingState label="Loading interview rounds" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <>
      <PageHeader
        action={<Button disabled={!selectedCompany} onClick={() => { setEditing(null); setModalOpen(true); }}><FiPlus />Add Round</Button>}
        description="Create the round sequence used to evaluate candidates for each company drive."
        title="Interview Rounds"
      />
      <Card className="mb-6 p-5">
        <FormField label="Company">
          <select className={inputClass} onChange={(event) => setSelectedCompany(event.target.value)} value={selectedCompany}>
            {companies.map((company) => <option key={company._id} value={company._id}>{company.companyName}</option>)}
          </select>
        </FormField>
      </Card>
      {roundLoading ? <LoadingState label="Loading rounds" /> : null}
      {roundError ? <ErrorState message={roundError} onRetry={loadRounds} /> : null}
      {!roundLoading && !roundError ? (
        <Card className="p-6">
          {rounds.length === 0 ? (
            <EmptyState description="Add the first round for this company to create its interview timeline." title="No rounds configured" />
          ) : (
            <div className="space-y-5">
              {rounds.map((round, index) => (
                <div className="flex gap-4" key={round._id}>
                  <div className="flex flex-col items-center">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{round.sequence}</div>
                    {index < rounds.length - 1 ? <div className="mt-2 h-full w-px bg-border" /> : null}
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-ink">{round.roundName}</h3>
                        <p className="mt-1 text-sm text-muted">{round.roundType}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => { setEditing(round); setModalOpen(true); }} size="sm" variant="secondary"><FiEdit2 /></Button>
                        <Button onClick={async () => { await roundsApi.remove(round._id); loadRounds(); }} size="sm" variant="ghost"><FiTrash2 className="text-danger" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Round" : "Add Round"}>
        <RoundForm companyId={selectedCompany} initialValues={editing} onCancel={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); loadRounds(); }} />
      </Modal>
    </>
  );
}
