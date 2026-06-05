import { useState } from "react";
import { FiCheckCircle, FiUploadCloud } from "react-icons/fi";
import Button from "./Button";
import Card from "./Card";
import Modal from "./Modal";
import { EmptyState } from "./StateBlock";
import { parseSpreadsheetPreview } from "../../utils/spreadsheet";

export default function UploadPreviewModal({
  acceptedColumns,
  onClose,
  onSubmit,
  open,
  summary,
  title,
}) {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setFile(null);
    setPreviewRows([]);
    setError("");
    setUploading(false);
    setProgress(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (event) => {
    const nextFile = event.target.files?.[0];
    setFile(nextFile || null);
    setError("");
    setProgress(0);

    if (!nextFile) {
      setPreviewRows([]);
      return;
    }

    try {
      const rows = await parseSpreadsheetPreview(nextFile);
      setPreviewRows(rows.slice(0, 10));
    } catch (err) {
      setPreviewRows([]);
      setError(err.message || "Unable to preview this file");
    }
  };

  const submit = async () => {
    if (!file) {
      setError("Please select a CSV or Excel file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await onSubmit(file, (event) => {
        if (event.total) {
          setProgress(
            Math.round((event.loaded * 100) / event.total)
          );
        }
      });
      setProgress(100);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-5">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-8 text-center transition hover:border-primary hover:bg-blue-50">
          <FiUploadCloud className="h-8 w-8 text-primary" />
          <span className="mt-3 text-sm font-semibold text-ink">
            Upload CSV or Excel file
          </span>
          <span className="mt-1 text-xs text-muted">
            Required columns: {acceptedColumns.join(", ")}
          </span>
          <input
            accept=".csv,.xls,.xlsx"
            className="sr-only"
            onChange={handleFile}
            type="file"
          />
        </label>

        {file ? (
          <div className="rounded-xl border border-border bg-white p-3 text-sm text-muted">
            Selected:{" "}
            <span className="font-semibold text-ink">
              {file.name}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        ) : null}

        {uploading || progress > 0 ? (
          <div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-muted">
              <span>Upload progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {summary ? (
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-success">
              <FiCheckCircle className="h-4 w-4" />
              Import summary
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(summary)
                .filter(([key, value]) =>
                  typeof value === "number" &&
                  key !== "success"
                )
                .map(([key, value]) => (
                  <div
                    className="rounded-xl bg-slate-50 p-3"
                    key={key}
                  >
                    <p className="text-xl font-bold text-ink">
                      {value}
                    </p>
                    <p className="text-xs capitalize text-muted">
                      {key}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        ) : null}

        {previewRows.length ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Preview first 10 rows
            </h3>
            <div className="max-h-72 overflow-auto rounded-xl border border-border thin-scrollbar">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-slate-50 text-muted">
                  <tr>
                    {Object.keys(previewRows[0]).map(
                      (key) => (
                        <th
                          className="px-3 py-2 font-semibold uppercase"
                          key={key}
                        >
                          {key}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows.map((row, index) => (
                    <tr key={index}>
                      {Object.keys(previewRows[0]).map(
                        (key) => (
                          <td
                            className="px-3 py-2 text-ink"
                            key={key}
                          >
                            {String(row[key] ?? "")}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            description="Select a file to preview the first rows before submitting."
            title="No preview yet"
          />
        )}

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleClose}
            type="button"
            variant="secondary"
          >
            Close
          </Button>
          <Button
            loading={uploading}
            onClick={submit}
            type="button"
          >
            Submit Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}
