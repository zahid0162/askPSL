import { useCallback, useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  ColumnPreset,
  ConversionConfig,
  LoadedMatchFile,
} from './types/psl';
import {
  buildDataset,
  generateCsvBlob,
  getPresetColumns,
  inspectMatchFile,
} from './utils/pslParser';
import { SAMPLE_PSL_MATCHES } from './data/samplePslMatches';
import { TopBar, WorkspaceTab } from './components/TopBar';
import { SidebarConfig } from './components/SidebarConfig';
import { DropZonePanel } from './components/DropZonePanel';
import { DataPreviewTable } from './components/DataPreviewTable';
import { SchemaAuditPanel } from './components/SchemaAuditPanel';
import { MatchesSummaryPanel } from './components/MatchesSummaryPanel';
import { PythonSnippetPanel } from './components/PythonSnippetPanel';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const INITIAL_CONFIG: ConversionConfig = {
  granularity: 'ball_by_ball',
  includeEngineeredFeatures: true,
  includeMatchContext: true,
  includeSuperOvers: false,
  normalizeTeamNames: true,
  missingValueMode: 'empty',
  preset: 'all',
  selectedColumns: null,
  exportFilename: 'psl_matches_combined.csv',
};

export default function App() {
  const [files, setFiles] = useState<LoadedMatchFile[]>([]);
  const [config, setConfig] = useState<ConversionConfig>(INITIAL_CONFIG);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('preview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    currentFile: string;
  } | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [ingestWarning, setIngestWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/assets/aistudio/1527559_2dc2a17e.json')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = inspectMatchFile(
          'attached-1527559_2dc2a17e.json',
          '1527559_2dc2a17e.json',
          new Blob([text]).size,
          text
        );
        if (parsed.status === 'parsed') {
          setFiles((prev) => (prev.length === 0 ? [parsed] : prev));
        }
      })
      .catch(() => {
        // Optional attached fixture unavailable
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilesSelected = useCallback(async (incomingFiles: File[]) => {
    setIsProcessing(true);
    setIngestWarning(null);
    setExportNotice(null);

    try {
      const jsonEntries: Array<{
        name: string;
        size: number;
        readText: () => Promise<string>;
      }> = [];

      for (const file of incomingFiles) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.zip')) {
          try {
            const zip = await JSZip.loadAsync(file);
            zip.forEach((relativePath, zipEntry) => {
              if (
                !zipEntry.dir &&
                relativePath.toLowerCase().endsWith('.json') &&
                !relativePath.includes('__MACOSX/') &&
                !relativePath.split('/').pop()?.startsWith('._')
              ) {
                jsonEntries.push({
                  name: relativePath.split('/').pop() ?? relativePath,
                  size: 0,
                  readText: () => zipEntry.async('string'),
                });
              }
            });
          } catch {
            setIngestWarning(
              `Could not read ZIP archive "${file.name}". Please ensure it is a valid .zip file.`
            );
          }
        } else if (lower.endsWith('.json')) {
          jsonEntries.push({
            name: file.name,
            size: file.size,
            readText: () => file.text(),
          });
        }
      }

      if (jsonEntries.length === 0) {
        setIngestWarning(
          'No .json files were found in the selection. Select match .json files, a folder containing .json files, or a .zip archive.'
        );
        setIsProcessing(false);
        setProgress(null);
        return;
      }

      const newlyParsed: LoadedMatchFile[] = [];
      const CHUNK_SIZE = 20;

      for (let i = 0; i < jsonEntries.length; i += CHUNK_SIZE) {
        const slice = jsonEntries.slice(i, i + CHUNK_SIZE);
        const batchResults = await Promise.all(
          slice.map(async (entry, offset) => {
            const text = await entry.readText();
            const byteLen = entry.size || new Blob([text]).size;
            const id = `${entry.name}-${Date.now()}-${i + offset}-${Math.random()
              .toString(36)
              .slice(2, 7)}`;
            return inspectMatchFile(id, entry.name, byteLen, text);
          })
        );
        newlyParsed.push(...batchResults);
        setProgress({
          processed: Math.min(i + CHUNK_SIZE, jsonEntries.length),
          total: jsonEntries.length,
          currentFile: slice[slice.length - 1]?.name ?? '',
        });
        await new Promise((r) => setTimeout(r, 0));
      }

      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.fileName));
        const uniqueNew = newlyParsed.filter(
          (f) => !existingNames.has(f.fileName)
        );
        if (uniqueNew.length < newlyParsed.length) {
          const skipped = newlyParsed.length - uniqueNew.length;
          setIngestWarning(
            `Skipped ${skipped} duplicate file${skipped > 1 ? 's' : ''} already loaded in this session.`
          );
        }
        return [...prev, ...uniqueNew];
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  const handleLoadSampleData = useCallback(() => {
    setIngestWarning(null);
    setExportNotice(null);
    const parsedSamples: LoadedMatchFile[] = SAMPLE_PSL_MATCHES.map(
      (sample, idx) => {
        const rawText = JSON.stringify(sample.content);
        return inspectMatchFile(
          `sample-${idx}-${sample.fileName}`,
          sample.fileName,
          new Blob([rawText]).size,
          rawText
        );
      }
    );
    setFiles(parsedSamples);
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setExportNotice(null);
    setIngestWarning(null);
    setConfig((prev) => ({
      ...prev,
      preset: 'all',
      selectedColumns: null,
    }));
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const dataset = useMemo(
    () => buildDataset(files, config),
    [files, config]
  );

  const activeColumns = useMemo(() => {
    if (!config.selectedColumns) return dataset.columns;
    const available = new Set(dataset.columns);
    const filtered = config.selectedColumns.filter((c) => available.has(c));
    return filtered.length > 0 ? filtered : dataset.columns;
  }, [config.selectedColumns, dataset.columns]);

  const handleApplyPreset = useCallback(
    (preset: ColumnPreset) => {
      const cols = getPresetColumns(preset, dataset.columns);
      setConfig((prev) => ({
        ...prev,
        preset,
        selectedColumns: cols,
      }));
    },
    [dataset.columns]
  );

  const handleToggleColumn = useCallback(
    (colName: string) => {
      setConfig((prev) => {
        const current = prev.selectedColumns ?? dataset.columns;
        const exists = current.includes(colName);
        const next = exists
          ? current.filter((c) => c !== colName)
          : dataset.columns.filter(
              (c) => c === colName || current.includes(c)
            );
        return {
          ...prev,
          preset: 'all',
          selectedColumns: next,
        };
      });
    },
    [dataset.columns]
  );

  const handleSelectAllColumns = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      preset: 'all',
      selectedColumns: null,
    }));
  }, []);

  const handleDeselectAllColumns = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      preset: 'all',
      selectedColumns: dataset.columns.slice(0, 1),
    }));
  }, [dataset.columns]);

  const handleDownloadCsv = useCallback(() => {
    if (dataset.rows.length === 0 || activeColumns.length === 0) return;
    const blob = generateCsvBlob(dataset, activeColumns, config);
    const rawName = config.exportFilename.trim() || 'psl_matches_combined.csv';
    const fileName = rawName.toLowerCase().endsWith('.csv')
      ? rawName
      : `${rawName}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const sizeMb =
      blob.size >= 1024 * 1024
        ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(blob.size / 1024).toFixed(1)} KB`;
    setExportNotice(
      `Exported ${dataset.rows.length.toLocaleString()} rows × ${activeColumns.length} columns to ${fileName} (${sizeMb}).`
    );
  }, [dataset, activeColumns, config]);

  const mobileTabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'preview', label: 'CSV Preview' },
    { id: 'schema', label: 'Schema & ML Audit' },
    { id: 'matches', label: 'Match Files' },
    { id: 'python', label: 'Python Snippet' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canDownload={dataset.rows.length > 0 && activeColumns.length > 0}
        rowCount={dataset.rows.length}
        onDownloadCsv={handleDownloadCsv}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        <SidebarConfig
          config={config}
          onChange={setConfig}
          onApplyPreset={handleApplyPreset}
        />

        <main className="flex-1 min-w-0 p-5 lg:p-7 space-y-5 max-w-[1440px]">
          <DropZonePanel
            hasFiles={files.length > 0}
            isProcessing={isProcessing}
            progress={progress}
            onFilesSelected={handleFilesSelected}
            onLoadSampleData={handleLoadSampleData}
            onClearAll={handleClearAll}
          />

          {ingestWarning && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <span>{ingestWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => setIngestWarning(null)}
                className="text-xs font-medium text-amber-800 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {exportNotice && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>{exportNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setExportNotice(null)}
                className="text-xs font-medium text-emerald-800 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {files.length > 0 && (
            <>
              <section
                aria-label="Dataset summary metrics"
                className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200"
              >
                <div className="px-5 py-3.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Matches Parsed
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                    {dataset.stats.parsedMatches.toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                    {dataset.stats.failedFiles > 0
                      ? `${dataset.stats.failedFiles} failed files`
                      : `${dataset.stats.totalFiles} source files valid`}
                  </div>
                </div>

                <div className="px-5 py-3.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Unified CSV Rows
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                    {dataset.stats.totalRows.toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {config.granularity === 'ball_by_ball'
                      ? 'Delivery-level records'
                      : config.granularity === 'match_summary'
                      ? 'Match-level records'
                      : config.granularity === 'player_match'
                      ? 'Player-match records'
                      : 'Flattened JSON records'}
                  </div>
                </div>

                <div className="px-5 py-3.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Export Columns
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                    {activeColumns.length}
                    <span className="text-sm font-normal text-slate-400">
                      {' '}
                      / {dataset.stats.totalColumns}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {config.includeEngineeredFeatures &&
                    config.granularity === 'ball_by_ball'
                      ? 'ML features included'
                      : 'Custom column schema'}
                  </div>
                </div>

                <div className="px-5 py-3.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Coverage
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                    {dataset.stats.seasons.length > 0
                      ? `${dataset.stats.seasons.length} ${
                          dataset.stats.seasons.length === 1 ? 'Season' : 'Seasons'
                        }`
                      : 'Custom'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                    {dataset.stats.dateRange
                      ? `${dataset.stats.dateRange.min} to ${dataset.stats.dateRange.max}`
                      : `${dataset.stats.teams.length} teams`}
                  </div>
                </div>
              </section>

              <div className="flex md:hidden items-center gap-1 overflow-x-auto rounded-lg bg-slate-200/70 p-1">
                {mobileTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <DataPreviewTable
              rows={dataset.rows}
              activeColumns={activeColumns}
              columnAudits={dataset.columnAudits}
              seasons={dataset.stats.seasons}
              config={config}
            />
          )}

          {activeTab === 'schema' && (
            <SchemaAuditPanel
              audits={dataset.columnAudits}
              activeColumns={activeColumns}
              onToggleColumn={handleToggleColumn}
              onSelectAll={handleSelectAllColumns}
              onDeselectAll={handleDeselectAllColumns}
            />
          )}

          {activeTab === 'matches' && (
            <MatchesSummaryPanel
              files={files}
              onRemoveFile={handleRemoveFile}
            />
          )}

          {activeTab === 'python' && (
            <PythonSnippetPanel
              config={config}
              activeColumns={activeColumns}
              rowCount={dataset.rows.length}
            />
          )}
        </main>
      </div>
    </div>
  );
}
