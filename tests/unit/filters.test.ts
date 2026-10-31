import { describe, expect, it } from "vitest";
import { activeFilterCount, buildJobOrderBy, buildJobWhere, filtersToSearchParams, parseJobFilters } from "@/lib/jobs/filters";

describe("parseJobFilters", () => {
  it("applies defaults for an empty query", () => {
    const f = parseJobFilters({});
    expect(f).toMatchObject({ sort: "newest", page: 1, type: [], wp: [], exp: [], edu: [] });
    expect(f.q).toBeUndefined();
  });

  it("keeps only known list values and de-duplicates them", () => {
    const f = parseJobFilters({ type: "full-time,INTERNSHIP,bogus,full-time", wp: ["remote", "hybrid"] });
    expect(f.type).toEqual(["full-time", "internship"]);
    expect(f.wp).toEqual(["remote", "hybrid"]);
  });

  it("rejects invalid numbers, sorts and pages", () => {
    const f = parseJobFilters({ salary: "-5", posted: "2", sort: "drop table", page: "abc" });
    expect(f.salary).toBeUndefined();
    expect(f.posted).toBeUndefined();
    expect(f.sort).toBe("newest");
    expect(f.page).toBe(1);
  });

  it("caps keyword length and page number", () => {
    const f = parseJobFilters({ q: "x".repeat(500), page: "99999" });
    expect(f.q).toHaveLength(100);
    expect(f.page).toBe(500);
  });
});

describe("buildJobWhere", () => {
  const now = new Date("2026-10-28T12:00:00Z");

  it("always restricts to published, unexpired jobs from active companies", () => {
    const where = buildJobWhere(parseJobFilters({}), now);
    const base = (where.AND as object[])[0];
    expect(base).toMatchObject({ status: "PUBLISHED", company: { isSuspended: false } });
  });

  it("adds one AND clause per keyword term", () => {
    const where = buildJobWhere(parseJobFilters({ q: "senior react" }), now);
    expect((where.AND as object[]).length).toBe(3);
  });

  it("maps URL values to enum filters", () => {
    const where = buildJobWhere(parseJobFilters({ type: "contract", wp: "remote", exp: "mid" }), now);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { employmentType: { in: ["CONTRACT"] } },
        { workplace: { in: ["REMOTE"] } },
        { experienceLevel: { in: ["MID"] } },
      ]),
    );
  });

  it("compares yearly salaries at 12x the monthly threshold", () => {
    const where = buildJobWhere(parseJobFilters({ salary: "1000000" }), now);
    const clause = JSON.stringify(where.AND);
    expect(clause).toContain('"salaryPeriod":"YEAR"');
    expect(clause).toContain("12000000");
  });

  it("filters by posting date window", () => {
    const where = buildJobWhere(parseJobFilters({ posted: "7" }), now);
    const posted = (where.AND as { publishedAt?: { gte: Date } }[]).find((c) => c.publishedAt);
    expect(posted?.publishedAt?.gte.toISOString()).toBe("2026-10-21T12:00:00.000Z");
  });
});

describe("helpers", () => {
  it("serialises filters back to a minimal query string", () => {
    const f = parseJobFilters({ q: "nurse", type: "full-time", sort: "newest", page: "1" });
    expect(filtersToSearchParams(f).toString()).toBe("q=nurse&type=full-time");
  });

  it("counts active filters excluding keyword and sort", () => {
    expect(activeFilterCount(parseJobFilters({ q: "x", loc: "kampala", type: "contract,internship", sort: "salary" }))).toBe(3);
  });

  it("orders by salary with nulls last", () => {
    expect(buildJobOrderBy("salary")[0]).toEqual({ salaryMax: { sort: "desc", nulls: "last" } });
  });
});
