import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ConversionConfig } from '../types/psl';

interface PythonSnippetPanelProps {
  config: ConversionConfig;
  activeColumns: string[];
  rowCount: number;
}

export function PythonSnippetPanel({
  config,
  activeColumns,
  rowCount,
}: PythonSnippetPanelProps) {
  const [copied, setCopied] = useState(false);

  const fileName = config.exportFilename.trim() || 'psl_matches_combined.csv';
  const hasDate = activeColumns.includes('date');
  const hasWinnerTarget = activeColumns.includes('is_batting_team_winner');
  const hasScoreTarget = activeColumns.includes('innings_final_score');

  const targetCol = hasWinnerTarget
    ? 'is_batting_team_winner'
    : hasScoreTarget
    ? 'innings_final_score'
    : activeColumns.includes('winner')
    ? 'winner'
    : activeColumns[activeColumns.length - 1] ?? 'target';

  const snippet = `import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

# 1. Load unified PSL CSV (${rowCount.toLocaleString()} rows, ${activeColumns.length} columns)
df = pd.read_csv("${fileName}"${hasDate ? ', parse_dates=["date"]' : ''})

print("Dataset shape:", df.shape)
print(df.head(3))

# 2. Prevent data leakage by grouping splits by match_id
${
  activeColumns.includes('match_id')
    ? `splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(splitter.split(df, groups=df["match_id"]))
train_df, test_df = df.iloc[train_idx], df.iloc[test_idx]`
    : `train_df = df.sample(frac=0.8, random_state=42)
test_df = df.drop(train_df.index)`
}

# 3. Example ML Feature & Target Setup
target_col = "${targetCol}"
clean_df = train_df.dropna(subset=[target_col])
numeric_cols = clean_df.select_dtypes(include="number").columns.drop(target_col, errors="ignore")

X_train = clean_df[numeric_cols].fillna(0)
y_train = clean_df[target_col]

print("Ready features:", list(numeric_cols))`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Python &amp; scikit-learn Quick-Start
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prevents match-level data leakage by splitting train/test sets with{' '}
            <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
              GroupShuffleSplit
            </code>{' '}
            on <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">match_id</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Copy Snippet</span>
            </>
          )}
        </button>
      </div>

      <pre className="overflow-x-auto bg-slate-950 p-5 font-mono text-xs leading-relaxed text-slate-100">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
