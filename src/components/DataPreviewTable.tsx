import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ColumnAudit, ConversionConfig, DatasetRow } from '../types/psl';

interface DataPreviewTableProps {
  rows: DatasetRow[];
  activeColumns: string[];
  columnAudits: ColumnAudit[];
  seasons: string[];
  config: ConversionConfig;
}

const PAGE_SIZE = 75;

export function DataPreviewTable({
  rows,
  activeColumns,
  columnAudits,
  seasons,
  config,
}: DataPreviewTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [inningsFilter, setInningsFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const auditMap = useMemo(() => {
    const map = new Map<string, ColumnAudit>();
    columnAudits.forEach((a) => map.set(a.name, a));
    return map;
  }, [columnAudits]);

  const hasSeasonCol = activeColumns.includes('season') || rows[0]?.season !== undefined;
  const hasInningsCol =
    activeColumns.includes('innings_number') || rows[0]?.innings_number !== undefined;

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (seasonFilter !== 'all' && String(row.season ?? '') !== seasonFilter) {
        return false;
      }
      if (
        inningsFilter !== 'all' &&
        String(row.innings_number ?? '') !== inningsFilter
      ) {
        return false;
      }
      if (!q) return true;
      for (let i = 0; i < activeColumns.length; i++) {
        const val = row[activeColumns[i]];
        if (val !== null && val !== undefined && String(val).toLowerCase().includes(q)) {
          return true;
        }
      }
      return false;
    });
  }, [rows, activeColumns, searchQuery, seasonFilter, inningsFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  const formatCell = (col: string, rawVal: string | number | boolean | null | undefined) => {
    if (rawVal === null || rawVal === undefined || rawVal === '') {
      if (config.missingValueMode === 'nan_string') return 'NaN';
      if (config.missingValueMode === 'zero_numeric') {
        const audit = auditMap.get(col);
        if (audit && (audit.inferredType === 'numeric' || audit.inferredType === 'binary')) {
          return '0';
        }
      }
      return '—';
    }
    return String(rawVal);
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="font-display text-sm font-semibold text-slate-900">
          No CSV rows generated yet
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Upload PSL JSON match files above or load the sample PSL dataset to inspect the output table.
        </p>
      </div>
    );
  }

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
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search batter, bowler, team, venue..."
              className="w-64 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>

          {hasSeasonCol && seasons.length > 0 && (
            <select
              aria-label="Filter by PSL season"
              value={seasonFilter}
              onChange={(e) => {
                setSeasonFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none"
            >
              <option value="all">All Seasons</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  Season {s}
                </option>
              ))}
            </select>
          )}

          {hasInningsCol && (
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              {[
                { id: 'all', label: 'All Innings' },
                { id: '1', label: '1st Inn' },
                { id: '2', label: '2nd Inn' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setInningsFilter(opt.id);
                    setPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    inningsFilter === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
          <span>{filteredRows.length.toLocaleString()} rows</span>
          <span aria-hidden="true">·</span>
          <span>{activeColumns.length} columns</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-12 border-r border-slate-200 px-3 py-2.5 font-mono text-[11px] font-medium text-slate-400 text-right tabular-nums">
                #
              </th>
              {activeColumns.map((col) => {
                const audit = auditMap.get(col);
                const isNum =
                  audit?.inferredType === 'numeric' ||
                  audit?.inferredType === 'binary';
                return (
                  <th
                    key={col}
                    className={`border-r border-slate-200/80 last:border-r-0 px-3 py-2.5 font-mono text-[11px] font-semibold text-slate-800 whitespace-nowrap ${
                      isNum ? 'text-right' : 'text-left'
                    }`}
                    title={audit?.description}
                  >
                    <div>{col}</div>
                    {audit && (
                      <div className="font-sans text-[10px] font-normal text-slate-400 mt-0.5">
                        {audit.inferredType}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((row, idx) => {
              const rowNumber = (safePage - 1) * PAGE_SIZE + idx + 1;
              return (
                <tr
                  key={rowNumber}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="border-r border-slate-100 px-3 py-2 font-mono text-[11px] text-slate-400 text-right tabular-nums whitespace-nowrap">
                    {rowNumber}
                  </td>
                  {activeColumns.map((col) => {
                    const audit = auditMap.get(col);
                    const isNum =
                      audit?.inferredType === 'numeric' ||
                      audit?.inferredType === 'binary';
                    const formatted = formatCell(col, row[col]);
                    const isMissing = formatted === '—';
                    return (
                      <td
                        key={col}
                        className={`border-r border-slate-100 last:border-r-0 px-3 py-2 whitespace-nowrap max-w-[240px] truncate ${
                          isNum
                            ? 'font-mono text-[11px] text-right tabular-nums'
                            : 'text-xs text-left'
                        } ${isMissing ? 'text-slate-300' : 'text-slate-700'}`}
                      >
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-600">
        <div className="tabular-nums">
          Showing{' '}
          <span className="font-medium text-slate-900">
            {filteredRows.length === 0
              ? 0
              : ((safePage - 1) * PAGE_SIZE + 1).toLocaleString()}
          </span>
          –
          <span className="font-medium text-slate-900">
            {Math.min(safePage * PAGE_SIZE, filteredRows.length).toLocaleString()}
          </span>{' '}
          of{' '}
          <span className="font-medium text-slate-900">
            {filteredRows.length.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Prev</span>
          </button>
          <span className="font-mono text-xs tabular-nums text-slate-700 px-1">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
