import { Download } from 'lucide-react';

export type WorkspaceTab = 'preview' | 'schema' | 'matches' | 'python';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  canDownload: boolean;
  rowCount: number;
  onDownloadCsv: () => void;
}

export function TopBar({
  activeTab,
  onTabChange,
  canDownload,
  rowCount,
  onDownloadCsv,
}: TopBarProps) {
  const navItems: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'preview', label: 'CSV Preview' },
    { id: 'schema', label: 'Schema & ML Audit' },
    { id: 'matches', label: 'Match Files' },
    { id: 'python', label: 'Python Snippet' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-8 border-b border-slate-200 bg-white px-6">
      <button
        type="button"
        onClick={() => onTabChange('preview')}
        className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
      >
        PSL Data Studio
      </button>

      <nav
        aria-label="Workspace views"
        className="hidden md:flex items-center gap-6 text-sm font-medium"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative py-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-700" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={!canDownload}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            canDownload
              ? 'bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {canDownload
              ? `Download CSV (${rowCount.toLocaleString()})`
              : 'Download CSV'}
          </span>
        </button>
      </div>
    </header>
  );
}
