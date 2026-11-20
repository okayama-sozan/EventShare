/**
 * D1 allows at most 100 bound parameters per statement, so multi-row inserts
 * must be split by `floor((100 - reserved) / columnsPerRow)` rows, where
 * `reserved` is the number of other parameters in the same statement.
 */
export function chunkForD1<T>(rows: T[], columnsPerRow: number, reserved = 0) {
  const size = Math.max(1, Math.floor((100 - reserved) / columnsPerRow));
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/** Tables introduced in `0002_series_tags_endorsements.sql`. */
const SERIES_FEATURE_TABLES = [
  "event_series",
  "series_watches",
  "tags",
  "event_tags",
  "event_endorsements",
] as const;

/**
 * True when a D1 / SQLite error means the Worker is ahead of the database
 * (migrations not applied on this binding).
 */
export function isMissingSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /no such table/i.test(message) || /no such column/i.test(message);
}

export function schemaBehindError(cause: unknown) {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(
    `D1 schema is behind the app (missing series/tags tables or columns). ` +
      `Run: npm run db:migrate:remote — then redeploy if needed. (${detail})`,
    { cause: cause instanceof Error ? cause : undefined },
  );
}

/**
 * Once per isolate: ensure the series/tags migration landed on this D1.
 * Cheap after the first call; fails fast with an actionable message when not.
 */
let schemaReady: Promise<void> | null = null;

export function ensureSeriesSchema(d1: D1Database) {
  schemaReady ??= (async () => {
    const placeholders = SERIES_FEATURE_TABLES.map(() => "?").join(", ");
    const result = await d1
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`,
      )
      .bind(...SERIES_FEATURE_TABLES)
      .all<{ name: string }>();
    const have = new Set((result.results ?? []).map((row) => row.name));
    const missing = SERIES_FEATURE_TABLES.filter((name) => !have.has(name));
    if (missing.length > 0) {
      throw schemaBehindError(new Error(`missing tables: ${missing.join(", ")}`));
    }
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}
