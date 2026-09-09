import { describe, it, expect } from "vitest";
import {
  mapToCanonicalStatus,
  getApplicationStatusMeta,
  CanonicalApplicationStatus,
  FormFieldDefinition,
} from "../types";
import {
  isSensitiveFactField,
  sanitizeFieldInput,
} from "../browserbaseService";

describe("Auto Apply Canonical Status Model", () => {
  it("maps legacy and raw database statuses into canonical 8-phase statuses correctly", () => {
    // Checking phase
    expect(mapToCanonicalStatus("detecting_fields")).toBe("checking");
    expect(mapToCanonicalStatus("scanning")).toBe("checking");
    expect(mapToCanonicalStatus("checking")).toBe("checking");

    // Needs Information phase
    expect(mapToCanonicalStatus("missing_info")).toBe("needs_info");
    expect(mapToCanonicalStatus("needs_info")).toBe("needs_info");
    expect(mapToCanonicalStatus("action_needed")).toBe("needs_info");

    // Queued phase
    expect(mapToCanonicalStatus("queued")).toBe("queued");
    expect(mapToCanonicalStatus("ready_to_submit")).toBe("queued");
    expect(mapToCanonicalStatus("scheduled")).toBe("queued");

    // Applying phase
    expect(mapToCanonicalStatus("applying")).toBe("applying");
    expect(mapToCanonicalStatus("submitting")).toBe("applying");
    expect(mapToCanonicalStatus("in_progress")).toBe("applying");

    // Action Required phase
    expect(mapToCanonicalStatus("action_required")).toBe("action_required");
    expect(mapToCanonicalStatus("captcha")).toBe("action_required");
    expect(mapToCanonicalStatus("blocked")).toBe("action_required");

    // Submitted phase
    expect(mapToCanonicalStatus("submitted")).toBe("submitted");
    expect(mapToCanonicalStatus("applied")).toBe("submitted");
    expect(mapToCanonicalStatus("completed")).toBe("submitted");

    // Failed phase
    expect(mapToCanonicalStatus("failed")).toBe("failed");
    expect(mapToCanonicalStatus("error")).toBe("failed");
    expect(mapToCanonicalStatus("rejected")).toBe("failed");

    // Ready phase
    expect(mapToCanonicalStatus(null)).toBe("ready_to_apply");
    expect(mapToCanonicalStatus("not_applied")).toBe("ready_to_apply");
    expect(mapToCanonicalStatus("ready_to_apply")).toBe("ready_to_apply");
  });

  it("provides user-friendly, plain-English metadata with badges and actions for all canonical statuses", () => {
    const canonicalStatuses: CanonicalApplicationStatus[] = [
      "ready_to_apply",
      "checking",
      "needs_info",
      "queued",
      "applying",
      "action_required",
      "submitted",
      "failed",
    ];

    for (const status of canonicalStatuses) {
      const meta = getApplicationStatusMeta(status);
      expect(meta.key).toBe(status);
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.badgeBg).toMatch(/^bg-/);
      expect(meta.badgeText).toMatch(/^text-/);
      expect(meta.badgeBorder).toMatch(/^border-/);
    }
  });

  it("handles needs_info metadata with distinct action label", () => {
    const meta = getApplicationStatusMeta("needs_info");
    expect(meta.actionLabel).toBe("Complete & Continue");
    expect(meta.label).toBe("Needs Information");
  });

  it("handles action_required metadata with distinct action label", () => {
    const meta = getApplicationStatusMeta("action_required");
    expect(meta.actionLabel).toBe("Open Application");
    expect(meta.label).toBe("Action Required");
  });
});

describe("Critical Answering & Anti-Fabrication Rule", () => {
  it("identifies sensitive material fields that must never be fabricated", () => {
    expect(isSensitiveFactField("work_authorization")).toBe(true);
    expect(isSensitiveFactField("workAuthorization")).toBe(true);
    expect(isSensitiveFactField("requires_sponsorship")).toBe(true);
    expect(isSensitiveFactField("sponsorship")).toBe(true);
    expect(isSensitiveFactField("salary_expectation")).toBe(true);
    expect(isSensitiveFactField("salaryExpectations")).toBe(true);
    expect(isSensitiveFactField("notice_period")).toBe(true);
    expect(isSensitiveFactField("willing_to_relocate")).toBe(true);
    expect(isSensitiveFactField("relocation")).toBe(true);
    expect(isSensitiveFactField("security_clearance")).toBe(true);

    // Non-sensitive/standard fields
    expect(isSensitiveFactField("first_name")).toBe(false);
    expect(isSensitiveFactField("email")).toBe(false);
    expect(isSensitiveFactField("portfolio")).toBe(false);
  });

  it("sanitizes user input values safely without truncating valid text", () => {
    expect(sanitizeFieldInput("  $120,000 / year  ")).toBe("$120,000 / year");
    expect(sanitizeFieldInput("Yes")).toBe("Yes");
    expect(sanitizeFieldInput(null)).toBe("");
    expect(sanitizeFieldInput(undefined)).toBe("");
  });
});
