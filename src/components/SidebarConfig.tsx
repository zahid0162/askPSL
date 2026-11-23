import {
  ColumnPreset,
  ConversionConfig,
  ExportGranularity,
  MissingValueMode,
} from '../types/psl';

interface SidebarConfigProps {
  config: ConversionConfig;
  onChange: (updater: (prev: ConversionConfig) => ConversionConfig) => void;
  onApplyPreset: (preset: ColumnPreset) => void;
}

export function SidebarConfig({
  config,
  onChange,
  onApplyPreset,
}: SidebarConfigProps) {
  const granularities: Array<{
    id: ExportGranularity;
    label: string;
    hint: string;
  }> = [
    {
      id: 'ball_by_ball',
      label: 'Ball-by-Ball (ML Standard)',
      hint: '1 row per delivery with match & state features',
    },
    {
      id: 'match_summary',
      label: 'Match-Level Summary',
      hint: '1 row per match with innings totals & outcomes',
    },
    {
      id: 'player_match',
      label: 'Player Match Performance',
      hint: '1 row per player per match (batting & bowling)',
    },
    {
      id: 'generic_flatten',
      label: 'Generic JSON Flatten',
      hint: 'Dot-notation flattener for custom JSON schemas',
    },
  ];

  const presets: Array<{ id: ColumnPreset; label: string }> = [
    { id: 'all', label: 'All Columns' },
    { id: 'win_probability', label: 'Win Probability ML' },
    { id: 'score_prediction', label: 'Score Prediction ML' },
    { id: 'core_raw', label: 'Core Raw Fields' },
  ];

  const missingModes: Array<{ id: MissingValueMode; label: string }> = [
    { id: 'empty', label: 'Blank (Standard CSV)' },
    { id: 'zero_numeric', label: '0 for Numeric / Blank Text' },
    { id: 'nan_string', label: 'NaN Literal' },
  ];

  return (
    <aside className="w-full lg:w-[276px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-5 space-y-6">
      <div>
        <h2 className="text-xs font-semibold text-slate-900 mb-3">
          Output Granularity
        </h2>
        <div className="space-y-1.5">
          {granularities.map((g) => {
            const active = config.granularity === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    granularity: g.id,
                    preset: 'all',
                    selectedColumns: null,
                  }))
                }
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-emerald-700 bg-emerald-50/50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-semibold leading-tight">
                  {g.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {g.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {config.granularity === 'ball_by_ball' && (
        <div className="border-t border-slate-100 pt-5">
          <h2 className="text-xs font-semibold text-slate-900 mb-3">
            ML Feature Engineering
          </h2>
          <div className="space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeEngineeredFeatures}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    includeEngineeredFeatures: e.target.checked,
                    selectedColumns: null,
                    preset: 'all',
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <div>
                <span className="block text-xs font-medium text-slate-800">
                  Compute Match State & Targets
                </span>
                <span className="block text-[11px] text-slate-500">
                  Cumulative runs/wickets, CRR, RRR, phase, target labels
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeMatchContext}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    includeMatchContext: e.target.checked,
                    selectedColumns: null,
                    preset: 'all',
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <div>
                <span className="block text-xs font-medium text-slate-800">
                  Include Full Match Context
                </span>
                <span className="block text-[11px] text-slate-500">
                  Toss, city, stage, win margins, Player of Match
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeSuperOvers}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    includeSuperOvers: e.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <div>
                <span className="block text-xs font-medium text-slate-800">
                  Include Super Overs
                </span>
                <span className="block text-[11px] text-slate-500">
                  Uncheck to keep 20-over regulation innings only
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {config.granularity !== 'generic_flatten' && (
        <div className="border-t border-slate-100 pt-5">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.normalizeTeamNames}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  normalizeTeamNames: e.target.checked,
                }))
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            <div>
              <span className="block text-xs font-medium text-slate-800">
                Standardize PSL Team Names
              </span>
              <span className="block text-[11px] text-slate-500">
                Trim whitespace and unify franchise capitalization
              </span>
            </div>
          </label>
        </div>
      )}

      {config.granularity === 'ball_by_ball' &&
        config.includeEngineeredFeatures && (
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-xs font-semibold text-slate-900 mb-2.5">
              ML Column Presets
            </h2>
            <div className="grid grid-cols-1 gap-1.5">
              {presets.map((p) => {
                const active = config.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onApplyPreset(p.id)}
                    className={`rounded-md px-3 py-1.5 text-left text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      <div className="border-t border-slate-100 pt-5 space-y-4">
        <div>
          <label
            htmlFor="missing-value-select"
            className="block text-xs font-semibold text-slate-900 mb-1.5"
          >
            Missing Value Encoding
          </label>
          <select
            id="missing-value-select"
            value={config.missingValueMode}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                missingValueMode: e.target.value as MissingValueMode,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-700 focus:outline-none"
          >
            {missingModes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="export-filename-input"
            className="block text-xs font-semibold text-slate-900 mb-1.5"
          >
            Export CSV Filename
          </label>
          <input
            id="export-filename-input"
            type="text"
            value={config.exportFilename}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                exportFilename: e.target.value,
              }))
            }
            placeholder="psl_matches_combined.csv"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-emerald-700 focus:outline-none"
          />
        </div>
      </div>
    </aside>
  );
}
