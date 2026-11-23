import { useState } from 'react';
import { Trash2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LoadedMatchFile } from '../types/psl';

interface MatchesSummaryPanelProps {
  files: LoadedMatchFile[];
  onRemoveFile: (id: string) => void;
}

export function MatchesSummaryPanel({
  files,
  onRemoveFile,
}: MatchesSummaryPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'parsed' | 'error'>(
    'all'
  );

  const filtered = files.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      f.fileName.toLowerCase().includes(q) ||
      f.team1.toLowerCase().includes(q) ||
      f.team2.toLowerCase().includes(q) ||
      f.venue.toLowerCase().includes(q) ||
      f.season.toLowerCase().includes(q) ||
      f.matchId.toLowerCase().includes(q)
    );
  });

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="font-display text-sm font-semibold text-slate-900">
          No match files loaded
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Add PSL .json files or a .zip archive to review per-file validation and match metadata.
        </p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by file, team, season, venue..."
              className="w-64 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            {(
              [
                { id: 'all', label: 'All Files' },
                { id: 'parsed', label: 'Valid' },
                { id: 'error', label: 'Errors' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 tabular-nums">
          {filtered.length.toLocaleString()} of {files.length.toLocaleString()} files
        </div>
      </div>

      <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">Source File</th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">Season / Date</th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">Matchup</th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">Venue</th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">Outcome / Note</th>
              <th className="px-4 py-2.5 font-semibold text-slate-700 text-right">
                Deliveries
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-700 text-right">
                Size
              </th>
              <th className="w-12 px-4 py-2.5 font-semibold text-slate-700 text-right">
                Remove
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {f.status === 'parsed' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Valid</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Error</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-800 max-w-[200px] truncate">
                  {f.fileName}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                  {f.season}
                  {f.date ? ` · ${f.date}` : ''}
                </td>
                <td className="px-4 py-2.5 text-xs font-medium text-slate-900 whitespace-nowrap">
                  {f.status === 'parsed'
                    ? `${f.team1} vs ${f.team2}`
                    : '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[200px] truncate">
                  {f.venue || '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[220px] truncate">
                  {f.status === 'error' ? (
                    <span className="text-red-700">{f.errorMessage}</span>
                  ) : (
                    f.outcomeText
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-700 text-right tabular-nums">
                  {f.deliveriesCount.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 text-right tabular-nums">
                  {formatBytes(f.fileSizeBytes)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    aria-label={`Remove ${f.fileName}`}
                    onClick={() => onRemoveFile(f.id)}
                    className="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
