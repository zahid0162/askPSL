import { useState } from 'react';
import { CheckSquare, Square, Search } from 'lucide-react';
import { ColumnAudit } from '../types/psl';

interface SchemaAuditPanelProps {
  audits: ColumnAudit[];
  activeColumns: string[];
  onToggleColumn: (columnName: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SchemaAuditPanel({
  audits,
  activeColumns,
  onToggleColumn,
  onSelectAll,
  onDeselectAll,
}: SchemaAuditPanelProps) {
  const [filterText, setFilterText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const activeSet = new Set(activeColumns);

  const filteredAudits = audits.filter((a) => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (
      filterText.trim() &&
      !a.name.toLowerCase().includes(filterText.trim().toLowerCase()) &&
      !a.description.toLowerCase().includes(filterText.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (audits.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="font-display text-sm font-semibold text-slate-900">
          No schema available
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Load PSL JSON files to inspect inferred ML column types, missingness rates, and cardinality.
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
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter columns..."
              className="w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'match', label: 'Match' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'engineered', label: 'ML Features' },
              { id: 'target', label: 'ML Targets' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 tabular-nums">
            {activeColumns.length} of {audits.length} selected for CSV export
          </span>
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap cursor-pointer"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap cursor-pointer"
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-12 px-4 py-2.5 font-semibold text-slate-700">
                Export
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">
                Column Name
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">
                Inferred ML Type
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-700 text-right">
                Unique Values
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-700 text-right">
                Missing %
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">
                Sample Value
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-700">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAudits.map((audit) => {
              const checked = activeSet.has(audit.name);
              return (
                <tr
                  key={audit.name}
                  onClick={() => onToggleColumn(audit.name)}
                  className={`cursor-pointer transition-colors ${
                    checked ? 'hover:bg-slate-50' : 'bg-slate-50/40 opacity-60 hover:opacity-85'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      aria-label={`Toggle ${audit.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleColumn(audit.name);
                      }}
                      className="text-emerald-700 flex items-center cursor-pointer"
                    >
                      {checked ? (
                        <CheckSquare className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                    {audit.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {audit.inferredType}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700 text-right tabular-nums">
                    {audit.uniqueCount.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-mono text-xs text-right tabular-nums ${
                      audit.missingPct > 50
                        ? 'text-amber-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {audit.missingPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 max-w-[180px] truncate">
                    {audit.sampleValue}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 min-w-[240px]">
                    {audit.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
