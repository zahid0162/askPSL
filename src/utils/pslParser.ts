import {
  ColumnAudit,
  ColumnPreset,
  ConversionConfig,
  ConversionDataset,
  DatasetRow,
  InferredMlType,
  LoadedMatchFile,
} from '../types/psl';

const TEAM_ALIASES: Record<string, string> = {
  'lahore qalandars': 'Lahore Qalandars',
  'karachi kings': 'Karachi Kings',
  'islamabad united': 'Islamabad United',
  'peshawar zalmi': 'Peshawar Zalmi',
  'quetta gladiators': 'Quetta Gladiators',
  'multan sultans': 'Multan Sultans',
  'hyderabad kingsmen': 'Hyderabad Kingsmen',
};

export function normalizeTeamName(name: string, normalize: boolean): string {
  const cleaned = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  if (!normalize) return cleaned;
  const key = cleaned.toLowerCase();
  return TEAM_ALIASES[key] ?? cleaned;
}

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function extractMatchId(fileName: string, json: Record<string, unknown>): string {
  const info = (json.info as Record<string, unknown> | undefined) ?? {};
  const meta = (json.meta as Record<string, unknown> | undefined) ?? {};
  if (info.match_id !== undefined) return String(info.match_id);
  if (json.match_id !== undefined) return String(json.match_id);
  if (meta.match_id !== undefined) return String(meta.match_id);
  const base = fileName.replace(/\.json$/i, '').split('/').pop() ?? fileName;
  return base;
}

export function detectJsonSchema(
  json: unknown
): 'cricsheet_v1' | 'cricsheet_legacy' | 'generic_json' | 'unknown' {
  if (!json || typeof json !== 'object') return 'unknown';
  if (Array.isArray(json)) return 'generic_json';
  const obj = json as Record<string, unknown>;
  if (obj.info && Array.isArray(obj.innings)) {
    const firstInnings = obj.innings[0] as Record<string, unknown> | undefined;
    if (!firstInnings) return 'cricsheet_v1';
    if (Array.isArray(firstInnings.overs)) return 'cricsheet_v1';
    const values = Object.values(firstInnings);
    if (
      values.length > 0 &&
      typeof values[0] === 'object' &&
      values[0] !== null &&
      Array.isArray((values[0] as Record<string, unknown>).deliveries)
    ) {
      return 'cricsheet_legacy';
    }
    return 'cricsheet_v1';
  }
  return 'generic_json';
}

interface NormalizedDelivery {
  over: number;
  ballInOver: number;
  actualDelivery: string;
  batter: string;
  bowler: string;
  nonStriker: string;
  runsBatter: number;
  runsExtras: number;
  runsTotal: number;
  wides: number;
  noballs: number;
  byes: number;
  legbyes: number;
  penalty: number;
  extraType: string;
  isWicket: number;
  wicketKind: string;
  playerOut: string;
  fielder: string;
  isReview: number;
  reviewBy: string;
  reviewDecision: string;
}

interface PowerplayWindow {
  from: number;
  to: number;
  type: string;
}

interface NormalizedInnings {
  inningsNumber: number;
  team: string;
  isSuperOver: boolean;
  targetRuns: number | null;
  powerplays: PowerplayWindow[];
  deliveries: NormalizedDelivery[];
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
}

interface NormalizedMatchInfo {
  matchId: string;
  season: string;
  date: string;
  city: string;
  venue: string;
  stage: string;
  matchNumber: string;
  team1: string;
  team2: string;
  tossWinner: string;
  tossDecision: string;
  winner: string;
  outcomeResult: string;
  outcomeMethod: string;
  winByRuns: number | null;
  winByWickets: number | null;
  playerOfMatch: string;
  oversLimit: number;
  ballsPerOver: number;
  peopleRegistry: Record<string, string>;
  innings: NormalizedInnings[];
}

function parseDeliveryObj(
  del: Record<string, unknown>,
  overNum: number,
  ballIndex: number
): NormalizedDelivery {
  const runs = (del.runs as Record<string, unknown> | undefined) ?? {};
  const extras = (del.extras as Record<string, unknown> | undefined) ?? {};

  const wides = safeNum(extras.wides, 0);
  const noballs = safeNum(extras.noballs, 0);
  const byes = safeNum(extras.byes, 0);
  const legbyes = safeNum(extras.legbyes, 0);
  const penalty = safeNum(extras.penalty, 0);

  const extraKeys = Object.keys(extras).filter((k) => safeNum(extras[k], 0) > 0);
  const extraType = extraKeys.length > 0 ? extraKeys.join('+') : 'none';

  // Cricsheet v1 uses wickets[], legacy uses wicket (single object)
  let wicketsList: Array<Record<string, unknown>> = [];
  if (Array.isArray(del.wickets)) {
    wicketsList = del.wickets.filter(
      (w): w is Record<string, unknown> => Boolean(w && typeof w === 'object')
    );
  } else if (del.wicket && typeof del.wicket === 'object') {
    wicketsList = [del.wicket as Record<string, unknown>];
  }

  const primaryWicket = wicketsList[0];
  let fielderStr = '';
  if (primaryWicket) {
    if (Array.isArray(primaryWicket.fielders)) {
      fielderStr = primaryWicket.fielders
        .map((f) =>
          typeof f === 'string'
            ? f
            : safeStr((f as Record<string, unknown>)?.name)
        )
        .filter(Boolean)
        .join(', ');
    } else if (typeof primaryWicket.fielders === 'string') {
      fielderStr = primaryWicket.fielders;
    }
  }

  const batter = safeStr(del.batter ?? del.batsman);
  const nonStriker = safeStr(del.non_striker);
  const bowler = safeStr(del.bowler);
  const actualDelivery = safeStr(del.actual_delivery) || `${overNum}.${ballIndex}`;

  const reviewObj =
    del.review && typeof del.review === 'object'
      ? (del.review as Record<string, unknown>)
      : null;

  const runsBatter = safeNum(runs.batter ?? runs.batsman, 0);
  const runsExtras = safeNum(runs.extras, 0);
  const runsTotal = safeNum(runs.total, runsBatter + runsExtras);

  return {
    over: overNum,
    ballInOver: ballIndex,
    actualDelivery,
    batter,
    bowler,
    nonStriker,
    runsBatter,
    runsExtras,
    runsTotal,
    wides,
    noballs,
    byes,
    legbyes,
    penalty,
    extraType,
    isWicket: wicketsList.length > 0 ? 1 : 0,
    wicketKind: primaryWicket ? safeStr(primaryWicket.kind) : '',
    playerOut: primaryWicket ? safeStr(primaryWicket.player_out) : '',
    fielder: fielderStr,
    isReview: reviewObj ? 1 : 0,
    reviewBy: reviewObj ? safeStr(reviewObj.by) : '',
    reviewDecision: reviewObj ? safeStr(reviewObj.decision) : '',
  };
}

function normalizeCricsheetMatch(
  fileName: string,
  rawJson: Record<string, unknown>,
  schema: 'cricsheet_v1' | 'cricsheet_legacy',
  normalizeTeams: boolean
): NormalizedMatchInfo {
  const info = (rawJson.info as Record<string, unknown> | undefined) ?? {};
  const event = (info.event as Record<string, unknown> | undefined) ?? {};
  const outcome = (info.outcome as Record<string, unknown> | undefined) ?? {};
  const outcomeBy = (outcome.by as Record<string, unknown> | undefined) ?? {};
  const toss = (info.toss as Record<string, unknown> | undefined) ?? {};

  const dates = Array.isArray(info.dates) ? info.dates.map(String) : [];
  const primaryDate = dates[0] ?? safeStr(info.date);

  let season = safeStr(info.season);
  if (!season && primaryDate) {
    season = primaryDate.slice(0, 4);
  }

  const teams = Array.isArray(info.teams)
    ? info.teams.map((t) => normalizeTeamName(String(t), normalizeTeams))
    : [];

  const team1 = teams[0] ?? '';
  const team2 = teams[1] ?? '';

  const pomArr = Array.isArray(info.player_of_match)
    ? info.player_of_match.map(String)
    : [];

  const oversLimit = safeNum(info.overs, 20);
  const ballsPerOver = safeNum(info.balls_per_over, 6);
  const registryObj = (info.registry as Record<string, unknown> | undefined) ?? {};
  const rawPeople = (registryObj.people as Record<string, unknown> | undefined) ?? {};
  const peopleRegistry: Record<string, string> = {};
  for (const [personName, personId] of Object.entries(rawPeople)) {
    peopleRegistry[personName] = safeStr(personId);
  }

  const rawInnings = Array.isArray(rawJson.innings) ? rawJson.innings : [];
  const normalizedInnings: NormalizedInnings[] = [];

  rawInnings.forEach((innRaw, idx) => {
    if (!innRaw || typeof innRaw !== 'object') return;
    const innObj = innRaw as Record<string, unknown>;

    let innContent = innObj;
    let isSuperOver = Boolean(innObj.super_over);

    if (schema === 'cricsheet_legacy' && !Array.isArray(innObj.overs)) {
      const entries = Object.entries(innObj);
      if (entries.length > 0) {
        const [label, content] = entries[0];
        if (label.toLowerCase().includes('super over')) {
          isSuperOver = true;
        }
        if (content && typeof content === 'object') {
          innContent = content as Record<string, unknown>;
        }
      }
    }

    const team = normalizeTeamName(safeStr(innContent.team), normalizeTeams);
    const targetObj = (innContent.target as Record<string, unknown> | undefined) ?? {};
    const targetRuns =
      targetObj.runs !== undefined ? safeNum(targetObj.runs) : null;

    const powerplays: PowerplayWindow[] = Array.isArray(innContent.powerplays)
      ? innContent.powerplays
          .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
          .map((p) => ({
            from: safeNum(p.from, 0),
            to: safeNum(p.to, 0),
            type: safeStr(p.type) || 'mandatory',
          }))
      : [];

    const deliveries: NormalizedDelivery[] = [];
    let totalRuns = 0;
    let totalWickets = 0;
    let legalBalls = 0;

    if (Array.isArray(innContent.overs)) {
      for (const overEntry of innContent.overs) {
        if (!overEntry || typeof overEntry !== 'object') continue;
        const overObj = overEntry as Record<string, unknown>;
        const overNum = safeNum(overObj.over, 0);
        const delList = Array.isArray(overObj.deliveries) ? overObj.deliveries : [];
        delList.forEach((delRaw, bIdx) => {
          if (!delRaw || typeof delRaw !== 'object') return;
          const parsed = parseDeliveryObj(
            delRaw as Record<string, unknown>,
            overNum,
            bIdx + 1
          );
          deliveries.push(parsed);
          totalRuns += parsed.runsTotal;
          totalWickets += parsed.isWicket;
          if (parsed.wides === 0 && parsed.noballs === 0) {
            legalBalls += 1;
          }
        });
      }
    } else if (Array.isArray(innContent.deliveries)) {
      const overCounts: Record<number, number> = {};
      for (const delItem of innContent.deliveries) {
        if (!delItem || typeof delItem !== 'object') continue;
        const entries = Object.entries(delItem as Record<string, unknown>);
        if (entries.length === 0) continue;
        const [ballKey, delBody] = entries[0];
        if (!delBody || typeof delBody !== 'object') continue;
        const overNum = Math.floor(Number(ballKey)) || 0;
        overCounts[overNum] = (overCounts[overNum] ?? 0) + 1;
        const parsed = parseDeliveryObj(
          delBody as Record<string, unknown>,
          overNum,
          overCounts[overNum]
        );
        deliveries.push(parsed);
        totalRuns += parsed.runsTotal;
        totalWickets += parsed.isWicket;
        if (parsed.wides === 0 && parsed.noballs === 0) {
          legalBalls += 1;
        }
      }
    }

    normalizedInnings.push({
      inningsNumber: idx + 1,
      team,
      isSuperOver,
      targetRuns,
      powerplays,
      deliveries,
      totalRuns,
      totalWickets,
      legalBalls,
    });
  });

  // Infer 2nd innings target if missing
  if (
    normalizedInnings.length >= 2 &&
    normalizedInnings[1].targetRuns === null &&
    !normalizedInnings[1].isSuperOver
  ) {
    normalizedInnings[1].targetRuns = normalizedInnings[0].totalRuns + 1;
  }

  return {
    matchId: extractMatchId(fileName, rawJson),
    season,
    date: primaryDate,
    city: safeStr(info.city),
    venue: safeStr(info.venue),
    stage: safeStr(event.stage),
    matchNumber: safeStr(event.match_number),
    team1,
    team2,
    tossWinner: normalizeTeamName(safeStr(toss.winner), normalizeTeams),
    tossDecision: safeStr(toss.decision),
    winner: normalizeTeamName(safeStr(outcome.winner), normalizeTeams),
    outcomeResult: safeStr(outcome.result),
    outcomeMethod: safeStr(outcome.method),
    winByRuns: outcomeBy.runs !== undefined ? safeNum(outcomeBy.runs) : null,
    winByWickets:
      outcomeBy.wickets !== undefined ? safeNum(outcomeBy.wickets) : null,
    playerOfMatch: pomArr.join(', '),
    oversLimit,
    ballsPerOver,
    peopleRegistry,
    innings: normalizedInnings,
  };
}

export function inspectMatchFile(
  id: string,
  fileName: string,
  fileSizeBytes: number,
  textContent: string
): LoadedMatchFile {
  try {
    const parsed = JSON.parse(textContent) as unknown;
    const schema = detectJsonSchema(parsed);

    if (schema === 'cricsheet_v1' || schema === 'cricsheet_legacy') {
      const norm = normalizeCricsheetMatch(
        fileName,
        parsed as Record<string, unknown>,
        schema,
        true
      );
      const deliveriesCount = norm.innings.reduce(
        (acc, inn) => acc + inn.deliveries.length,
        0
      );
      let outcomeText = norm.winner
        ? `${norm.winner} won`
        : norm.outcomeResult || 'No result';
      if (norm.winner && norm.winByRuns !== null) {
        outcomeText = `${norm.winner} won by ${norm.winByRuns} runs`;
      } else if (norm.winner && norm.winByWickets !== null) {
        outcomeText = `${norm.winner} won by ${norm.winByWickets} wkts`;
      }

      return {
        id,
        fileName,
        fileSizeBytes,
        status: 'parsed',
        schemaDetected: schema,
        matchId: norm.matchId,
        season: norm.season || 'Unknown',
        date: norm.date || '',
        venue: norm.venue || 'Unknown venue',
        city: norm.city || '',
        team1: norm.team1 || 'Team 1',
        team2: norm.team2 || 'Team 2',
        winner: norm.winner || '',
        outcomeText,
        inningsCount: norm.innings.length,
        deliveriesCount,
        rawJson: parsed,
      };
    }

    if (schema === 'generic_json') {
      const arrLen = Array.isArray(parsed)
        ? parsed.length
        : Object.keys(parsed as Record<string, unknown>).length;
      return {
        id,
        fileName,
        fileSizeBytes,
        status: 'parsed',
        schemaDetected: 'generic_json',
        matchId: fileName.replace(/\.json$/i, ''),
        season: 'Generic',
        date: '',
        venue: 'Custom JSON schema',
        city: '',
        team1: 'Custom',
        team2: 'JSON',
        winner: '',
        outcomeText: `${arrLen} top-level entries`,
        inningsCount: 0,
        deliveriesCount: arrLen,
        rawJson: parsed,
      };
    }

    return {
      id,
      fileName,
      fileSizeBytes,
      status: 'error',
      schemaDetected: 'unknown',
      errorMessage: 'JSON root must be an object or array.',
      matchId: fileName,
      season: '',
      date: '',
      venue: '',
      city: '',
      team1: '',
      team2: '',
      winner: '',
      outcomeText: 'Parse error',
      inningsCount: 0,
      deliveriesCount: 0,
    };
  } catch (err) {
    return {
      id,
      fileName,
      fileSizeBytes,
      status: 'error',
      schemaDetected: 'unknown',
      errorMessage:
        err instanceof Error ? err.message : 'Invalid JSON syntax',
      matchId: fileName,
      season: '',
      date: '',
      venue: '',
      city: '',
      team1: '',
      team2: '',
      winner: '',
      outcomeText: 'Invalid JSON',
      inningsCount: 0,
      deliveriesCount: 0,
    };
  }
}

function flattenGenericObject(
  obj: unknown,
  prefix = '',
  out: DatasetRow = {}
): DatasetRow {
  if (obj === null || obj === undefined) {
    if (prefix) out[prefix] = null;
    return out;
  }
  if (typeof obj !== 'object') {
    if (prefix) out[prefix] = obj as string | number | boolean;
    return out;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (prefix) out[prefix] = '';
    } else if (obj.every((item) => item === null || typeof item !== 'object')) {
      out[prefix] = obj.join(' | ');
    } else {
      obj.forEach((item, idx) => {
        flattenGenericObject(item, `${prefix}[${idx}]`, out);
      });
    }
    return out;
  }

  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${k}` : k;
    flattenGenericObject(v, nextKey, out);
  }
  return out;
}

const COLUMN_DESCRIPTIONS: Record<
  string,
  { desc: string; category: ColumnAudit['category'] }
> = {
  match_id: { desc: 'Unique match identifier (from Cricsheet ID or filename)', category: 'match' },
  season: { desc: 'PSL season year or edition', category: 'match' },
  date: { desc: 'Match date (YYYY-MM-DD)', category: 'match' },
  city: { desc: 'Host city', category: 'match' },
  venue: { desc: 'Stadium or cricket ground name', category: 'match' },
  stage: { desc: 'Tournament stage (Group, Qualifier, Eliminator, Final)', category: 'match' },
  match_number: { desc: 'Match sequence number in tournament', category: 'match' },
  team1: { desc: 'Listed home/first team', category: 'match' },
  team2: { desc: 'Listed away/second team', category: 'match' },
  toss_winner: { desc: 'Team that won the coin toss', category: 'match' },
  toss_decision: { desc: 'Toss choice: bat or field', category: 'match' },
  match_winner: { desc: 'Winning team name (blank for tie/no result)', category: 'target' },
  win_by_runs: { desc: 'Margin of victory in runs if defending team won', category: 'match' },
  win_by_wickets: { desc: 'Margin of victory in wickets if chasing team won', category: 'match' },
  player_of_match: { desc: 'Official Player of the Match awardee', category: 'match' },
  innings_number: { desc: 'Innings index (1 = 1st innings, 2 = 2nd innings, 3+ = Super Over)', category: 'delivery' },
  is_super_over: { desc: 'Binary indicator (1 = Super Over delivery, 0 = regulation)', category: 'delivery' },
  batting_team: { desc: 'Team currently batting on this delivery', category: 'delivery' },
  bowling_team: { desc: 'Team currently bowling on this delivery', category: 'delivery' },
  over: { desc: 'Zero-indexed over number (0 to 19 in T20)', category: 'delivery' },
  ball: { desc: 'Delivery sequence within the over (includes wides/noballs)', category: 'delivery' },
  actual_delivery: { desc: 'Official delivery code from JSON (e.g. 2.3 repeated on wides)', category: 'delivery' },
  legal_ball_number: { desc: 'Cumulative legal balls bowled in the innings (1 to 120)', category: 'engineered' },
  batter: { desc: 'Striker facing the delivery', category: 'delivery' },
  batter_id: { desc: 'Unique Cricsheet registry ID for striker', category: 'delivery' },
  bowler: { desc: 'Bowler delivering the ball', category: 'delivery' },
  bowler_id: { desc: 'Unique Cricsheet registry ID for bowler', category: 'delivery' },
  non_striker: { desc: 'Batter at the non-striker end', category: 'delivery' },
  runs_batter: { desc: 'Runs scored off the bat on this delivery', category: 'delivery' },
  runs_extras: { desc: 'Extra runs conceded on this delivery', category: 'delivery' },
  runs_total: { desc: 'Total runs added to team score (batter + extras)', category: 'delivery' },
  extra_type: { desc: 'Type of extra (none, wides, noballs, byes, legbyes, penalty)', category: 'delivery' },
  wides: { desc: 'Wide runs conceded on this delivery', category: 'delivery' },
  noballs: { desc: 'No-ball runs conceded on this delivery', category: 'delivery' },
  byes: { desc: 'Bye runs conceded on this delivery', category: 'delivery' },
  legbyes: { desc: 'Leg-bye runs conceded on this delivery', category: 'delivery' },
  penalty: { desc: 'Penalty runs awarded on this delivery', category: 'delivery' },
  is_wicket: { desc: 'Binary indicator (1 = wicket fell on this ball, 0 = no wicket)', category: 'delivery' },
  wicket_kind: { desc: 'Dismissal type (caught, bowled, lbw, run out, stumped, etc.)', category: 'delivery' },
  player_out: { desc: 'Name of dismissed batter if wicket fell', category: 'delivery' },
  fielder: { desc: 'Fielder(s) involved in dismissal if applicable', category: 'delivery' },
  is_review: { desc: 'Binary indicator (1 = DRS review occurred on this ball)', category: 'delivery' },
  review_by: { desc: 'Team that requested the DRS review', category: 'delivery' },
  review_decision: { desc: 'DRS review outcome (upheld, struck down)', category: 'delivery' },
  powerplay_type: { desc: 'Active powerplay window from JSON (mandatory, none, etc.)', category: 'delivery' },
  cumulative_runs: { desc: 'Running team score immediately after this delivery', category: 'engineered' },
  cumulative_wickets: { desc: 'Running wickets lost immediately after this delivery', category: 'engineered' },
  balls_remaining: { desc: 'Legal deliveries remaining in the innings (120 - legal_ball_number)', category: 'engineered' },
  current_run_rate: { desc: 'Innings scoring rate (runs per over) after this delivery', category: 'engineered' },
  target_runs: { desc: 'Chase target in 2nd innings (blank in 1st innings)', category: 'engineered' },
  runs_required: { desc: 'Runs still needed to win in 2nd innings after this ball', category: 'engineered' },
  required_run_rate: { desc: 'Required runs per over to reach target in 2nd innings', category: 'engineered' },
  phase: { desc: 'T20 match phase: Powerplay (0-5), Middle (6-14), Death (15-19)', category: 'engineered' },
  is_four: { desc: 'Binary flag: 1 if 4 runs off the bat', category: 'engineered' },
  is_six: { desc: 'Binary flag: 1 if 6 runs off the bat', category: 'engineered' },
  is_boundary: { desc: 'Binary flag: 1 if batter hit a 4 or 6', category: 'engineered' },
  is_dot_ball: { desc: 'Binary flag: 1 if legal ball with 0 total runs', category: 'engineered' },
  innings_final_score: { desc: 'ML Regression Target: Final total score of this innings', category: 'target' },
  innings_final_wickets: { desc: 'Final total wickets lost in this innings', category: 'target' },
  is_batting_team_winner: { desc: 'ML Classification Target: 1 if batting team won the match, 0 otherwise', category: 'target' },
};

export function getPresetColumns(
  preset: ColumnPreset,
  allColumns: string[]
): string[] | null {
  if (preset === 'all') return null;

  const sets: Record<Exclude<ColumnPreset, 'all'>, string[]> = {
    win_probability: [
      'match_id',
      'season',
      'venue',
      'innings_number',
      'batting_team',
      'bowling_team',
      'over',
      'ball',
      'legal_ball_number',
      'balls_remaining',
      'phase',
      'runs_total',
      'is_wicket',
      'cumulative_runs',
      'cumulative_wickets',
      'current_run_rate',
      'target_runs',
      'runs_required',
      'required_run_rate',
      'is_batting_team_winner',
    ],
    score_prediction: [
      'match_id',
      'season',
      'venue',
      'city',
      'toss_winner',
      'toss_decision',
      'innings_number',
      'batting_team',
      'bowling_team',
      'over',
      'ball',
      'legal_ball_number',
      'balls_remaining',
      'phase',
      'batter',
      'bowler',
      'runs_batter',
      'runs_extras',
      'runs_total',
      'is_wicket',
      'cumulative_runs',
      'cumulative_wickets',
      'current_run_rate',
      'innings_final_score',
    ],
    core_raw: [
      'match_id',
      'season',
      'date',
      'venue',
      'innings_number',
      'batting_team',
      'bowling_team',
      'over',
      'ball',
      'batter',
      'bowler',
      'non_striker',
      'runs_batter',
      'runs_extras',
      'runs_total',
      'extra_type',
      'is_wicket',
      'wicket_kind',
      'player_out',
      'match_winner',
    ],
  };

  const desired = new Set(sets[preset]);
  const filtered = allColumns.filter((c) => desired.has(c));
  return filtered.length > 0 ? filtered : null;
}

function inferMlType(
  colName: string,
  values: Array<string | number | boolean | null>
): InferredMlType {
  if (colName === 'match_id') return 'identifier';
  if (colName === 'date') return 'datetime';
  const nonNull = values.filter((v) => v !== null && v !== '');
  if (nonNull.length === 0) return 'text';

  let allNumeric = true;
  const unique = new Set<string>();
  for (let i = 0; i < Math.min(nonNull.length, 2000); i++) {
    const v = nonNull[i];
    unique.add(String(v));
    if (typeof v !== 'number' && (typeof v !== 'string' || isNaN(Number(v)))) {
      allNumeric = false;
    }
  }

  if (allNumeric) {
    const vals = Array.from(unique);
    if (
      vals.length <= 2 &&
      vals.every((x) => x === '0' || x === '1')
    ) {
      return 'binary';
    }
    return 'numeric';
  }

  if (unique.size <= 60 || colName.includes('team') || colName === 'venue' || colName === 'city') {
    return 'categorical';
  }
  return 'text';
}

export function buildDataset(
  files: LoadedMatchFile[],
  config: ConversionConfig
): ConversionDataset {
  const parsedFiles = files.filter((f) => f.status === 'parsed' && f.rawJson);
  const rows: DatasetRow[] = [];

  const seasonsSet = new Set<string>();
  const teamsSet = new Set<string>();
  const venuesSet = new Set<string>();
  const dates: string[] = [];

  for (const file of parsedFiles) {
    if (
      config.granularity !== 'generic_flatten' &&
      (file.schemaDetected === 'cricsheet_v1' ||
        file.schemaDetected === 'cricsheet_legacy')
    ) {
      const match = normalizeCricsheetMatch(
        file.fileName,
        file.rawJson as Record<string, unknown>,
        file.schemaDetected,
        config.normalizeTeamNames
      );

      if (match.season) seasonsSet.add(match.season);
      if (match.team1) teamsSet.add(match.team1);
      if (match.team2) teamsSet.add(match.team2);
      if (match.venue) venuesSet.add(match.venue);
      if (match.date) dates.push(match.date);

      if (config.granularity === 'ball_by_ball') {
        const totalScheduledBalls = match.oversLimit * match.ballsPerOver;

        for (const inn of match.innings) {
          if (!config.includeSuperOvers && inn.isSuperOver) continue;

          const bowlingTeam =
            inn.team === match.team1
              ? match.team2
              : inn.team === match.team2
              ? match.team1
              : match.team1 || match.team2 || '';

          let cumRuns = 0;
          let cumWickets = 0;
          let legalBalls = 0;

          for (const del of inn.deliveries) {
            cumRuns += del.runsTotal;
            cumWickets += del.isWicket;
            const isLegal = del.wides === 0 && del.noballs === 0;
            if (isLegal) legalBalls += 1;

            const row: DatasetRow = {};

            if (config.includeMatchContext) {
              row.match_id = match.matchId;
              row.season = match.season;
              row.date = match.date;
              row.city = match.city;
              row.venue = match.venue;
              row.stage = match.stage;
              row.match_number = match.matchNumber;
              row.team1 = match.team1;
              row.team2 = match.team2;
              row.toss_winner = match.tossWinner;
              row.toss_decision = match.tossDecision;
              row.match_winner = match.winner;
              row.win_by_runs = match.winByRuns;
              row.win_by_wickets = match.winByWickets;
              row.player_of_match = match.playerOfMatch;
            } else {
              row.match_id = match.matchId;
              row.season = match.season;
              row.date = match.date;
              row.venue = match.venue;
              row.match_winner = match.winner;
            }

            const actualNum = Number(del.actualDelivery);
            const activePowerplay = inn.powerplays.find(
              (pp) =>
                Number.isFinite(actualNum) &&
                actualNum >= pp.from &&
                actualNum <= pp.to
            );

            row.innings_number = inn.inningsNumber;
            row.is_super_over = inn.isSuperOver ? 1 : 0;
            row.batting_team = inn.team;
            row.bowling_team = bowlingTeam;
            row.over = del.over;
            row.ball = del.ballInOver;
            row.actual_delivery = del.actualDelivery;
            row.batter = del.batter;
            row.batter_id = match.peopleRegistry[del.batter] ?? '';
            row.bowler = del.bowler;
            row.bowler_id = match.peopleRegistry[del.bowler] ?? '';
            row.non_striker = del.nonStriker;
            row.runs_batter = del.runsBatter;
            row.runs_extras = del.runsExtras;
            row.runs_total = del.runsTotal;
            row.extra_type = del.extraType;
            row.wides = del.wides;
            row.noballs = del.noballs;
            row.byes = del.byes;
            row.legbyes = del.legbyes;
            row.penalty = del.penalty;
            row.is_wicket = del.isWicket;
            row.wicket_kind = del.wicketKind;
            row.player_out = del.playerOut;
            row.fielder = del.fielder;
            row.is_review = del.isReview;
            row.review_by = del.reviewBy;
            row.review_decision = del.reviewDecision;
            row.powerplay_type = activePowerplay ? activePowerplay.type : 'none';

            if (config.includeEngineeredFeatures) {
              const ballsRem = Math.max(0, totalScheduledBalls - legalBalls);
              const crr =
                legalBalls > 0
                  ? Number(((cumRuns / legalBalls) * 6).toFixed(2))
                  : 0;
              const targetRuns = inn.targetRuns;
              const runsReq =
                targetRuns !== null ? Math.max(0, targetRuns - cumRuns) : null;
              const rrr =
                targetRuns !== null && ballsRem > 0
                  ? Number((((runsReq ?? 0) / ballsRem) * 6).toFixed(2))
                  : targetRuns !== null && (runsReq ?? 0) === 0
                  ? 0
                  : null;

              const phase =
                del.over < 6
                  ? 'Powerplay'
                  : del.over < 15
                  ? 'Middle'
                  : 'Death';

              row.legal_ball_number = legalBalls;
              row.cumulative_runs = cumRuns;
              row.cumulative_wickets = cumWickets;
              row.balls_remaining = ballsRem;
              row.current_run_rate = crr;
              row.target_runs = targetRuns;
              row.runs_required = runsReq;
              row.required_run_rate = rrr;
              row.phase = phase;
              row.is_four = del.runsBatter === 4 ? 1 : 0;
              row.is_six = del.runsBatter === 6 ? 1 : 0;
              row.is_boundary =
                del.runsBatter === 4 || del.runsBatter === 6 ? 1 : 0;
              row.is_dot_ball = isLegal && del.runsTotal === 0 ? 1 : 0;
              row.innings_final_score = inn.totalRuns;
              row.innings_final_wickets = inn.totalWickets;
              row.is_batting_team_winner = match.winner
                ? match.winner === inn.team
                  ? 1
                  : 0
                : null;
            }

            rows.push(row);
          }
        }
      } else if (config.granularity === 'match_summary') {
        const inn1 = match.innings[0];
        const inn2 = match.innings[1];
        const formatOvers = (balls: number) =>
          Number(`${Math.floor(balls / 6)}.${balls % 6}`);

        const row: DatasetRow = {
          match_id: match.matchId,
          season: match.season,
          date: match.date,
          city: match.city,
          venue: match.venue,
          stage: match.stage,
          match_number: match.matchNumber,
          team1: match.team1,
          team2: match.team2,
          toss_winner: match.tossWinner,
          toss_decision: match.tossDecision,
          innings1_team: inn1?.team ?? '',
          innings1_runs: inn1 ? inn1.totalRuns : null,
          innings1_wickets: inn1 ? inn1.totalWickets : null,
          innings1_overs: inn1 ? formatOvers(inn1.legalBalls) : null,
          innings1_run_rate:
            inn1 && inn1.legalBalls > 0
              ? Number(((inn1.totalRuns / inn1.legalBalls) * 6).toFixed(2))
              : null,
          innings2_team: inn2?.team ?? '',
          innings2_runs: inn2 ? inn2.totalRuns : null,
          innings2_wickets: inn2 ? inn2.totalWickets : null,
          innings2_overs: inn2 ? formatOvers(inn2.legalBalls) : null,
          innings2_run_rate:
            inn2 && inn2.legalBalls > 0
              ? Number(((inn2.totalRuns / inn2.legalBalls) * 6).toFixed(2))
              : null,
          winner: match.winner,
          outcome_result: match.outcomeResult || (match.winner ? 'win' : ''),
          outcome_method: match.outcomeMethod,
          win_by_runs: match.winByRuns,
          win_by_wickets: match.winByWickets,
          player_of_match: match.playerOfMatch,
          is_chase_successful:
            match.winner && inn2 ? (match.winner === inn2.team ? 1 : 0) : null,
          toss_winner_won_match:
            match.winner && match.tossWinner
              ? match.winner === match.tossWinner
                ? 1
                : 0
              : null,
        };
        rows.push(row);
      } else if (config.granularity === 'player_match') {
        interface PlayerAccum {
          player: string;
          team: string;
          opposition: string;
          battingInnings: number | null;
          runsScored: number;
          ballsFaced: number;
          fours: number;
          sixes: number;
          wasOut: number;
          dismissalKind: string;
          ballsBowled: number;
          runsConceded: number;
          wicketsTaken: number;
          dotsBowled: number;
          widesConceded: number;
          noballsConceded: number;
        }
        const playerMap = new Map<string, PlayerAccum>();
        const getOrInit = (player: string, team: string, opposition: string) => {
          const key = `${team}::${player}`;
          let entry = playerMap.get(key);
          if (!entry) {
            entry = {
              player,
              team,
              opposition,
              battingInnings: null,
              runsScored: 0,
              ballsFaced: 0,
              fours: 0,
              sixes: 0,
              wasOut: 0,
              dismissalKind: '',
              ballsBowled: 0,
              runsConceded: 0,
              wicketsTaken: 0,
              dotsBowled: 0,
              widesConceded: 0,
              noballsConceded: 0,
            };
            playerMap.set(key, entry);
          }
          return entry;
        };

        for (const inn of match.innings) {
          if (!config.includeSuperOvers && inn.isSuperOver) continue;
          const bowlingTeam =
            inn.team === match.team1 ? match.team2 : match.team1;

          for (const del of inn.deliveries) {
            const isLegal = del.wides === 0 && del.noballs === 0;
            if (del.batter) {
              const bat = getOrInit(del.batter, inn.team, bowlingTeam);
              bat.battingInnings = inn.inningsNumber;
              bat.runsScored += del.runsBatter;
              if (del.wides === 0) bat.ballsFaced += 1;
              if (del.runsBatter === 4) bat.fours += 1;
              if (del.runsBatter === 6) bat.sixes += 1;
            }
            if (del.isWicket && del.playerOut) {
              const outBat = getOrInit(del.playerOut, inn.team, bowlingTeam);
              outBat.wasOut = 1;
              outBat.dismissalKind = del.wicketKind;
            }
            if (del.bowler) {
              const bowl = getOrInit(del.bowler, bowlingTeam, inn.team);
              if (isLegal) bowl.ballsBowled += 1;
              // Bowler runs conceded excludes byes and legbyes
              const bowlerRuns =
                del.runsBatter + del.wides + del.noballs;
              bowl.runsConceded += bowlerRuns;
              bowl.widesConceded += del.wides > 0 ? 1 : 0;
              bowl.noballsConceded += del.noballs > 0 ? 1 : 0;
              if (isLegal && bowlerRuns === 0) bowl.dotsBowled += 1;
              if (
                del.isWicket &&
                !['run out', 'retired hurt', 'retired out', 'obstructing the field'].includes(
                  del.wicketKind.toLowerCase()
                )
              ) {
                bowl.wicketsTaken += 1;
              }
            }
          }
        }

        for (const p of playerMap.values()) {
          const strikeRate =
            p.ballsFaced > 0
              ? Number(((p.runsScored / p.ballsFaced) * 100).toFixed(2))
              : 0;
          const economy =
            p.ballsBowled > 0
              ? Number(((p.runsConceded / p.ballsBowled) * 6).toFixed(2))
              : 0;
          rows.push({
            match_id: match.matchId,
            season: match.season,
            date: match.date,
            venue: match.venue,
            player: p.player,
            team: p.team,
            opposition: p.opposition,
            batting_innings: p.battingInnings,
            runs_scored: p.runsScored,
            balls_faced: p.ballsFaced,
            fours: p.fours,
            sixes: p.sixes,
            strike_rate: strikeRate,
            was_out: p.wasOut,
            dismissal_kind: p.dismissalKind,
            balls_bowled: p.ballsBowled,
            overs_bowled: Number(`${Math.floor(p.ballsBowled / 6)}.${p.ballsBowled % 6}`),
            runs_conceded: p.runsConceded,
            wickets_taken: p.wicketsTaken,
            economy_rate: economy,
            dots_bowled: p.dotsBowled,
            wides_conceded: p.widesConceded,
            noballs_conceded: p.noballsConceded,
            is_player_of_match: match.playerOfMatch
              .split(',')
              .map((s) => s.trim())
              .includes(p.player)
              ? 1
              : 0,
            team_won: match.winner ? (match.winner === p.team ? 1 : 0) : null,
          });
        }
      }
    } else {
      // Generic JSON flattener fallback
      const raw = file.rawJson;
      if (Array.isArray(raw)) {
        raw.forEach((item, idx) => {
          const flat = flattenGenericObject(item);
          rows.push({
            source_file: file.fileName,
            record_index: idx,
            ...flat,
          });
        });
      } else if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        const arrayField = Object.entries(obj).find(([, v]) =>
          Array.isArray(v)
        );
        if (arrayField && Array.isArray(arrayField[1])) {
          const [arrKey, arrVal] = arrayField;
          arrVal.forEach((item, idx) => {
            const flat = flattenGenericObject(item);
            rows.push({
              source_file: file.fileName,
              collection: arrKey,
              record_index: idx,
              ...flat,
            });
          });
        } else {
          const flat = flattenGenericObject(obj);
          rows.push({
            source_file: file.fileName,
            ...flat,
          });
        }
      }
    }
  }

  // Collect ordered union of all columns
  const columnSet = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      columnSet.add(k);
    }
  }
  const allColumns = Array.from(columnSet);

  // Build column audits
  const columnAudits: ColumnAudit[] = allColumns.map((col) => {
    const vals: Array<string | number | boolean | null> = [];
    let nonNull = 0;
    let nullCount = 0;
    const uniqueSet = new Set<string>();
    let sample = '';

    for (let i = 0; i < rows.length; i++) {
      const v = rows[i][col] ?? null;
      vals.push(v);
      if (v === null || v === undefined || v === '') {
        nullCount++;
      } else {
        nonNull++;
        const s = String(v);
        if (uniqueSet.size < 10000) uniqueSet.add(s);
        if (!sample) sample = s;
      }
    }

    const meta = COLUMN_DESCRIPTIONS[col] ?? {
      desc: 'Extracted field from JSON record',
      category: 'generic' as const,
    };

    return {
      name: col,
      inferredType: inferMlType(col, vals),
      nonNullCount: nonNull,
      nullCount,
      missingPct:
        rows.length > 0
          ? Number(((nullCount / rows.length) * 100).toFixed(1))
          : 0,
      uniqueCount: uniqueSet.size,
      sampleValue: sample || '—',
      description: meta.desc,
      category: meta.category,
    };
  });

  const sortedDates = dates.filter(Boolean).sort();
  const dateRange =
    sortedDates.length > 0
      ? { min: sortedDates[0], max: sortedDates[sortedDates.length - 1] }
      : null;

  return {
    rows,
    columns: allColumns,
    columnAudits,
    stats: {
      totalFiles: files.length,
      parsedMatches: parsedFiles.length,
      failedFiles: files.filter((f) => f.status === 'error').length,
      totalRows: rows.length,
      totalColumns: allColumns.length,
      seasons: Array.from(seasonsSet).sort(),
      teams: Array.from(teamsSet).sort(),
      venues: Array.from(venuesSet).sort(),
      dateRange,
    },
  };
}

function escapeCsvCell(val: string): string {
  if (
    val.includes(',') ||
    val.includes('"') ||
    val.includes('\n') ||
    val.includes('\r')
  ) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function generateCsvBlob(
  dataset: ConversionDataset,
  activeColumns: string[],
  config: ConversionConfig
): Blob {
  const auditMap = new Map<string, ColumnAudit>();
  dataset.columnAudits.forEach((a) => auditMap.set(a.name, a));

  const chunks: string[] = [];
  chunks.push(activeColumns.map(escapeCsvCell).join(',') + '\n');

  const BATCH_SIZE = 2000;
  let buffer: string[] = [];

  for (let i = 0; i < dataset.rows.length; i++) {
    const row = dataset.rows[i];
    const lineCells: string[] = new Array(activeColumns.length);

    for (let c = 0; c < activeColumns.length; c++) {
      const col = activeColumns[c];
      const rawVal = row[col];

      if (rawVal === null || rawVal === undefined || rawVal === '') {
        if (config.missingValueMode === 'nan_string') {
          lineCells[c] = 'NaN';
        } else if (config.missingValueMode === 'zero_numeric') {
          const audit = auditMap.get(col);
          lineCells[c] =
            audit && (audit.inferredType === 'numeric' || audit.inferredType === 'binary')
              ? '0'
              : '';
        } else {
          lineCells[c] = '';
        }
      } else {
        lineCells[c] = escapeCsvCell(String(rawVal));
      }
    }

    buffer.push(lineCells.join(','));
    if (buffer.length >= BATCH_SIZE) {
      chunks.push(buffer.join('\n') + '\n');
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    chunks.push(buffer.join('\n') + '\n');
  }

  return new Blob(chunks, { type: 'text/csv;charset=utf-8;' });
}
