import { describe, expect, it } from "vitest";
import { isMissingSchemaError, schemaBehindError } from "../app/.server/db/utils";

describe("isMissingSchemaError", () => {
  it("detects missing table / column from D1 messages", () => {
    expect(isMissingSchemaError(new Error("D1_ERROR: no such table: event_series: SQLITE_ERROR"))).toBe(
      true,
    );
    expect(isMissingSchemaError(new Error("no such column: match_key"))).toBe(true);
    expect(isMissingSchemaError(new Error("FOREIGN KEY constraint failed"))).toBe(false);
  });
});

describe("schemaBehindError", () => {
  it("mentions the migrate command", () => {
    const err = schemaBehindError(new Error("missing tables: event_series"));
    expect(err.message).toContain("npm run db:migrate:remote");
    expect(err.message).toContain("missing tables: event_series");
  });
});
