export type ExportGranularity =
  | 'ball_by_ball'
  | 'match_summary'
  | 'player_match'
  | 'generic_flatten';

export type MissingValueMode = 'empty' | 'zero_numeric' | 'nan_string';

export type ColumnPreset =
  | 'all'
  | 'win_probability'
  | 'score_prediction'
  | 'core_raw';

export interface ConversionConfig {
  granularity: ExportGranularity;
  includeEngineeredFeatures: boolean;
  includeMatchContext: boolean;
  includeSuperOvers: boolean;
  normalizeTeamNames: boolean;
  missingValueMode: MissingValueMode;
  preset: ColumnPreset;
  selectedColumns: string[] | null; // null means use all available columns for current config
  exportFilename: string;
}

export interface LoadedMatchFile {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  status: 'parsed' | 'error';
  schemaDetected: 'cricsheet_v1' | 'cricsheet_legacy' | 'generic_json' | 'unknown';
  errorMessage?: string;
  matchId: string;
  season: string;
  date: string;
  venue: string;
  city: string;
  team1: string;
  team2: string;
  winner: string;
  outcomeText: string;
  inningsCount: number;
  deliveriesCount: number;
  rawJson?: unknown;
}

export type InferredMlType =
  | 'numeric'
  | 'binary'
  | 'categorical'
  | 'datetime'
  | 'identifier'
  | 'text';

export interface ColumnAudit {
  name: string;
  inferredType: InferredMlType;
  nonNullCount: number;
  nullCount: number;
  missingPct: number;
  uniqueCount: number;
  sampleValue: string;
  description: string;
  category: 'match' | 'delivery' | 'engineered' | 'target' | 'player' | 'generic';
}

export type DatasetRow = Record<string, string | number | boolean | null>;

export interface ConversionDataset {
  rows: DatasetRow[];
  columns: string[];
  columnAudits: ColumnAudit[];
  stats: {
    totalFiles: number;
    parsedMatches: number;
    failedFiles: number;
    totalRows: number;
    totalColumns: number;
    seasons: string[];
    teams: string[];
    venues: string[];
    dateRange: { min: string; max: string } | null;
  };
}
