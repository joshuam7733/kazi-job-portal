import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { CompanyLogo, EmptyState, Progress } from "@/components/ui/misc";
import { ColumnChart, bucketByDay } from "@/components/app/charts";

describe("Button", () => {
  it("is disabled and busy while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save job
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /save job/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Field", () => {
  it("links the label and error message to the input", () => {
    render(<Field label="Email" error="Enter a valid email address">{({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} />}</Field>);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address");
  });
});

describe("misc components", () => {
  it("renders a monogram logo with an accessible name", () => {
    render(<CompanyLogo name="Nile Ledger Partners" brandColor="#0B7285" />);
    expect(screen.getByRole("img", { name: "Nile Ledger Partners logo" })).toHaveTextContent("NL");
  });
  it("exposes progress values", () => {
    render(<Progress value={72.4} label="Profile completeness" />);
    expect(screen.getByRole("progressbar", { name: "Profile completeness" })).toHaveAttribute("aria-valuenow", "72");
  });
  it("renders an empty state with its action", () => {
    render(<EmptyState title="No saved jobs yet" action={<button type="button">Browse jobs</button>} />);
    expect(screen.getByRole("heading", { name: "No saved jobs yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse jobs" })).toBeInTheDocument();
  });
});

describe("charts", () => {
  it("buckets dates into days ending today", () => {
    const now = new Date("2026-10-28T15:00:00");
    const data = bucketByDay([new Date("2026-10-28T09:00:00"), new Date("2026-10-27T09:00:00"), new Date("2026-10-27T10:00:00"), new Date("2026-09-01")], 3, now);
    expect(data.map((d) => d.value)).toEqual([0, 2, 1]);
  });
  it("renders an accessible chart with a data table", () => {
    render(<ColumnChart data={[{ label: "1 Oct", value: 3 }]} label="Applications per day" valueLabel="applications" />);
    expect(screen.getByRole("img", { name: "Applications per day" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("3 applications");
  });
});
