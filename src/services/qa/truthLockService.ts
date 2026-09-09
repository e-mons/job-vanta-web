import type { 
  ApplicationMemory, 
  FactualClaim, 
  TruthVerificationDetails, 
  QATruthStatus,
  QAQuestionCategory
} from "../../../../shared/types/qa";

/**
 * Extracts verifiable factual claims (metrics, numbers, tools, durations, salary, leadership)
 * from a proposed suggested answer.
 */
export function extractClaimsFromAnswer(answerText: string): FactualClaim[] {
  if (!answerText || typeof answerText !== "string") {
    return [];
  }

  const claims: FactualClaim[] = [];

  // 1. Extract years of experience claims (e.g. "4 years of experience", "over 6 years", "for 12 years")
  const expMatch = answerText.match(/\b(?:over\s+|more\s+than\s+|for\s+)?(\d{1,2})\+?\s+years?\b(?:\s+(?:of\s+)?(?:experience|working|in\s+[\w\s]+)?)?/i);
  if (expMatch) {
    const years = parseInt(expMatch[1], 10);
    claims.push({
      claimType: "years_of_experience",
      rawStatement: expMatch[0],
      claimedValue: years,
      extractedMetric: years,
      status: "unverified",
    });
  }

  // 2. Extract percentage improvements (e.g. "improved latency by 40%", "increased revenue by 25%")
  const percentMatches = answerText.matchAll(/(\b(?:increased|decreased|improved|reduced|boosted|grew|scaled)\b[^.]*?(\d{1,3})%)/gi);
  for (const match of percentMatches) {
    const pct = parseInt(match[2], 10);
    claims.push({
      claimType: "metric",
      rawStatement: match[1],
      claimedValue: `${pct}%`,
      extractedMetric: pct,
      status: "unverified",
    });
  }

  // 3. Extract team leadership numbers (e.g. "managed a team of 6 engineers", "led 8 direct reports")
  const teamMatch = answerText.match(/\b(?:managed|led|supervised|directed)\s+(?:a\s+team\s+of\s+|a\s+group\s+of\s+)?(\d{1,3})\s+(?:engineers|people|members|developers|reps|analysts|employees)\b/i);
  if (teamMatch) {
    const teamSize = parseInt(teamMatch[1], 10);
    claims.push({
      claimType: "team_size",
      rawStatement: teamMatch[0],
      claimedValue: teamSize,
      extractedMetric: teamSize,
      status: "unverified",
    });
  }

  // 4. Extract salary expectations (e.g. "expecting ₦800,000", "$120,000", "£50k")
  const salaryMatch = answerText.match(/(?:salary|compensation|expectation|expecting)\s+(?:of\s+|is\s+)?(?:around\s+)?([₦$£€]\s*[\d,]+(?:\s*(?:k|thousand|million|m|\/month|\/year))?)/i);
  if (salaryMatch) {
    claims.push({
      claimType: "salary_expectation",
      rawStatement: salaryMatch[0],
      claimedValue: salaryMatch[1],
      status: "unverified",
    });
  }

  // 5. Extract availability/notice period (e.g. "available immediately", "30 days notice")
  const noticeMatch = answerText.match(/\b(available\s+immediately|immediate\s+start|(\d{1,2})\s*(?:weeks?|days?|months?)\s+notice)\b/i);
  if (noticeMatch) {
    claims.push({
      claimType: "notice_period",
      rawStatement: noticeMatch[0],
      claimedValue: noticeMatch[0],
      status: "unverified",
    });
  }

  return claims;
}

/**
 * Truth Lock Claim Verification Engine
 * Verifies factual claims deterministically against Application Memory + structured resume evidence.
 */
export function verifyAnswerClaims(
  answerText: string,
  memory: ApplicationMemory,
  options: {
    questionCategory?: QAQuestionCategory;
    evidenceReferences?: string[];
  } = {}
): TruthVerificationDetails {
  const claims = extractClaimsFromAnswer(answerText);
  const allResumeText = [
    ...(memory.applicationTruth.submittedSkills || []),
    ...(memory.applicationTruth.submittedExperienceRoles || []).map(r => 
      `${r.role} ${r.company} ${r.dates} ${Array.isArray((r as any).bullets) ? (r as any).bullets.join(" ") : ((r as any).bullets || "")} ${(r as any).description || ""}`
    ),
    JSON.stringify(memory.applicationTruth.submittedApplicationAnswers || {}),
  ].join(" ").toLowerCase();

  let verifiedCount = 0;
  let unverifiedCount = 0;
  let needsClarificationCount = 0;
  let conflictCount = 0;

  for (const claim of claims) {
    // 1. Verify Years of Experience
    if (claim.claimType === "years_of_experience") {
      const claimedYears = claim.claimedValue as number;
      const submittedYears = memory.applicationTruth.submittedExperienceYears;

      if (claimedYears <= submittedYears + 1) {
        claim.status = "verified";
        claim.evidenceSource = `Submitted Resume Experience (${submittedYears} years)`;
        verifiedCount++;
      } else if (claimedYears <= memory.careerTruth.currentExperienceYears + 1) {
        claim.status = "conflict";
        claim.conflictReason = `Claim of ${claimedYears} years exceeds submitted application snapshot duration (${submittedYears} years), but matches current profile (${memory.careerTruth.currentExperienceYears} years).`;
        conflictCount++;
      } else {
        claim.status = "conflict";
        claim.conflictReason = `Claim of ${claimedYears} years exceeds all verified career duration (${submittedYears} years).`;
        conflictCount++;
      }
    }

    // 2. Verify Numeric / Percentage Metrics
    else if (claim.claimType === "metric" || claim.claimType === "team_size") {
      const metricStr = String(claim.claimedValue).toLowerCase();
      const numStr = String(claim.extractedMetric);

      const existsInResume = allResumeText.includes(metricStr) || allResumeText.includes(numStr);
      if (existsInResume) {
        claim.status = "verified";
        claim.evidenceSource = "Found in structured experience bullet";
        verifiedCount++;
      } else {
        // Strict Metric Lock: Unfounded metric is marked unverified/conflict
        claim.status = "unverified";
        claim.conflictReason = `Metric "${claim.claimedValue}" does not appear in candidate's submitted career records.`;
        unverifiedCount++;
      }
    }

    // 3. Verify Salary Expectation
    else if (claim.claimType === "salary_expectation") {
      const statedSalary = memory.applicationTruth.statedSalaryExpectation;
      if (statedSalary) {
        // Compare normalized strings
        const normStated = statedSalary.replace(/[^0-9]/g, "");
        const normClaim = String(claim.claimedValue).replace(/[^0-9]/g, "");

        if (normStated && normClaim && normStated === normClaim) {
          claim.status = "verified";
          claim.evidenceSource = "Application Metadata";
          verifiedCount++;
        } else if (statedSalary) {
          claim.status = "conflict";
          claim.conflictReason = `Answer salary "${claim.claimedValue}" differs from original application expectation "${statedSalary}".`;
          conflictCount++;
        }
      } else {
        claim.status = "unverified";
        unverifiedCount++;
      }
    }

    // 4. Verify Notice Period / Availability
    else if (claim.claimType === "notice_period") {
      const statedNotice = memory.applicationTruth.statedNoticePeriod || memory.applicationTruth.statedAvailability;
      if (statedNotice) {
        const normStated = statedNotice.toLowerCase();
        const normClaim = String(claim.claimedValue).toLowerCase();

        if (normStated.includes("immediate") && normClaim.includes("immediate")) {
          claim.status = "verified";
          claim.evidenceSource = "Application Metadata (Immediate)";
          verifiedCount++;
        } else if (normStated.includes("30") && normClaim.includes("immediate")) {
          claim.status = "conflict";
          claim.conflictReason = `Original application stated 30 days notice, but answer states immediate start.`;
          conflictCount++;
        } else {
          claim.status = "verified";
          verifiedCount++;
        }
      } else {
        claim.status = "unverified";
        unverifiedCount++;
      }
    }
  }

  // Cross-reference user career confirmations
  for (const conf of (memory.careerTruth.activeConfirmations || [])) {
    if (conf.confirmation_value === "no") {
      if (answerText.toLowerCase().includes(conf.topic.toLowerCase()) && !answerText.toLowerCase().includes("haven't worked directly")) {
        conflictCount++;
        claims.push({
          claimType: "skill",
          rawStatement: `User confirmed 'No' for ${conf.topic}`,
          claimedValue: "no",
          status: "conflict",
          conflictReason: `User previously confirmed no experience with ${conf.topic}, but answer includes claims without bridging phrasing.`,
        });
      }
    }
  }

  let overallStatus: QATruthStatus = "verified";
  if (conflictCount > 0) {
    overallStatus = "conflict";
  } else if (needsClarificationCount > 0) {
    overallStatus = "needs_clarification";
  } else if (unverifiedCount > 0) {
    overallStatus = "unverified";
  }

  return {
    verifiedClaimsCount: verifiedCount,
    unverifiedClaimsCount: unverifiedCount,
    needsClarificationCount,
    conflictCount,
    claims,
    verificationTimestamp: new Date().toISOString(),
    overallStatus,
  };
}

/**
 * Creates safe, truthful fallbacks for missing skills or "A Little" responses.
 */
export function formatTruthfulSkillAnswer(
  topic: string,
  userLevel: "yes" | "no" | "a_little",
  relatedSkill?: string
): { quick: string; normal: string } {
  if (userLevel === "no") {
    return {
      quick: `While I haven't worked directly with ${topic}, I have strong fundamentals in ${relatedSkill || "related industry tools"} and adapt quickly to new workflows.`,
      normal: `I haven't had hands-on production experience with ${topic} specifically, but I have worked extensively with ${relatedSkill || "comparable systems"}. My core strength is quickly picking up new tooling and applying best practices from day one.`,
    };
  }

  if (userLevel === "a_little") {
    return {
      quick: `I have foundational exposure to ${topic} and understand its core concepts, with eagerness to deepen my expertise on your team.`,
      normal: `I have some exposure to ${topic}—I'm familiar with its fundamental architecture and common use cases, though most of my deep production work has been with ${relatedSkill || "related technologies"}. I'm excited to expand my hands-on depth with ${topic} in this role.`,
    };
  }

  return {
    quick: `I have direct, hands-on experience using ${topic} in production environments to deliver reliable results.`,
    normal: `I have practical production experience with ${topic}, utilizing it to streamline workflows, resolve technical challenges, and ensure high quality across deliverables.`,
  };
}

/**
 * Ensures Answer Continuity between application written answers and interview spoken delivery.
 */
export function adaptApplicationAnswerForInterview(
  writtenAnswer: string,
  topic: string
): string {
  if (!writtenAnswer || !writtenAnswer.trim()) {
    return `In my previous work, I focused on delivering measurable outcomes in ${topic}.`;
  }

  // Convert formal written phrasing to natural spoken delivery
  const cleaned = writtenAnswer.trim();
  return `When I applied, I noted that ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)} To expand on that in practice, I focus on clear communication, disciplined execution, and continuous alignment with the team's goals.`;
}
