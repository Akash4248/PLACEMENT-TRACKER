import Card from "./Card";
import { EmptyState } from "./StateBlock";

export default function DataTable({ columns, empty, rows }) {
  return (
    <Card className="overflow-hidden">
      {rows.length === 0 ? (
        <EmptyState {...empty} />
      ) : (
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                {columns.map((column) => (
                  <th className="px-5 py-3 font-semibold" key={column.key}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr className="bg-white transition hover:bg-slate-50" key={row._id}>
                  {columns.map((column) => (
                    <td className="px-5 py-4 align-middle text-ink" key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
