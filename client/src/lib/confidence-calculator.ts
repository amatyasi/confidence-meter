import type { EvidenceCategory, EvidenceGroup, EvidenceData, ConfidenceResult } from "../types/confidence";

// Evidence Groups with exact caps from methodology
export const EVIDENCE_GROUPS: EvidenceGroup[] = [
  { id: 1, name: "Initial Conviction & Support", shortName: "Initial Conviction", maxConfidence: 0.1 },
  { id: 2, name: "Expert Input & Planning", shortName: "Expert Input", maxConfidence: 0.5 },
  { id: 3, name: "Anecdotal Evidence", shortName: "Anecdotal", maxConfidence: 1.0 },
  { id: 4, name: "Market & Customer Data", shortName: "Market & Customer", maxConfidence: 3.0 },
  { id: 5, name: "Test Results", shortName: "Test Results", maxConfidence: 5.0 },
];

// Evidence Categories with exact weights from methodology
export const EVIDENCE_CATEGORIES: EvidenceCategory[] = [
  {
    id: "self-conviction",
    name: "Self Conviction",
    weight: 0.01,
    groupId: 1,
    tooltip: "Your personal conviction about the idea. This carries minimal weight as it's subjective.",
    examples: "Strong personal belief, gut feeling, intuition"
  },
  {
    id: "pitch-deck",
    name: "Pitch Deck",
    weight: 0.02,
    groupId: 1,
    tooltip: "Formal presentations or materials prepared to communicate the idea.",
    examples: "Presentation prepared, slides created, narrative developed"
  },
  {
    id: "thematic-support",
    name: "Thematic Support",
    weight: 0.05,
    groupId: 1,
    tooltip: "Evidence that the idea aligns with broader themes, trends, or strategic direction.",
    examples: "Aligns with: vision/strategy, current trends/buzzword, outside research, macro trends, product methodology"
  },
  {
    id: "others-opinion",
    name: "Others' Opinion",
    weight: 0.1,
    groupId: 2,
    tooltip: "Opinions and endorsements from colleagues, management, or domain experts.",
    examples: "The team / management / external expert / investor / press think it's a good idea"
  },
  {
    id: "estimates-plans",
    name: "Estimates & Plans",
    weight: 0.3,
    groupId: 2,
    tooltip: "Detailed planning work including estimates, timelines, and feasibility assessments.",
    examples: "Back of the envelope calculations, Eng / UX feasibility evaluation, Project timeline, Business model Canvas..."
  },
  {
    id: "anecdotal",
    name: "Anecdotal Evidence",
    weight: 0.5,
    groupId: 3,
    tooltip: "Individual stories, feedback, or observations that support the idea but aren't systematically collected.",
    examples: "Support by a few product data points,sales request, 1-3 interested customers, one competitor has it ..."
  },
  {
    id: "market-data",
    name: "Market Data",
    weight: 1.0,
    groupId: 4,
    tooltip: "External market research, industry data, and competitive intelligence.",
    examples: "Supported by surveys, smoke tests, all competitors have it..."
  },
  {
    id: "user-customer",
    name: "User/Customer Evidence",
    weight: 2.0,
    groupId: 4,
    tooltip: "Direct evidence from users or customers through interviews, surveys, or behavioral data.",
    examples: "Supported by: lots of product data, top user request, interviews with 20+ users, usability study, MVP"
  },
  {
    id: "test-results",
    name: "Test Results",
    weight: 3.0,
    groupId: 5,
    tooltip: "Results from systematic testing including A/B tests, prototypes, experiments, or pilot programs.",
    examples: "Supported by longitudinal user studies, large-scale MVP, alpha/beta, A/B experiments..."
  }
];

export function calculateConfidence(evidenceData: EvidenceData): ConfidenceResult {
  // Initialize group contributions
  const groupContributions: { [groupId: string]: number } = {};
  EVIDENCE_GROUPS.forEach(group => {
    groupContributions[group.id.toString()] = 0;
  });

  // Calculate raw contributions for each group
  EVIDENCE_CATEGORIES.forEach(category => {
    const count = evidenceData[category.id] || 0;
    const contribution = count * category.weight;
    const groupId = category.groupId.toString();
    groupContributions[groupId] += contribution;
  });

  // Apply group caps
  EVIDENCE_GROUPS.forEach(group => {
    const groupId = group.id.toString();
    groupContributions[groupId] = Math.min(
      groupContributions[groupId],
      group.maxConfidence
    );
  });

  // Calculate total score
  const totalScore = Object.values(groupContributions).reduce((sum, contribution) => sum + contribution, 0);

  // Calculate max possible score
  const maxPossibleScore = EVIDENCE_GROUPS.reduce((sum, group) => sum + group.maxConfidence, 0);

  return {
    totalScore,
    groupContributions,
    maxPossibleScore
  };
}

export function getScoreInterpretation(score: number): { level: string; description: string; color: string } {
  if (score === 0) {
    return {
      level: "Add your first evidence",
      description: "Start by adding evidence to build confidence in your idea",
      color: "#6b7280"
    };
  } else if (score < 3) {
    return {
      level: "Low Confidence", 
      description: "Some evidence but needs more validation",
      color: "#f59e0b"
    };
  } else if (score < 6) {
    return {
      level: "Medium Confidence",
      description: "Reasonable evidence from multiple sources", 
      color: "#3b82f6"
    };
  } else if (score < 8) {
    return {
      level: "High Confidence",
      description: "Strong evidence across several categories",
      color: "#059669"
    };
  } else {
    return {
      level: "Very High Confidence",
      description: "Excellent evidence from diverse sources",
      color: "#059669"
    };
  }
}

export function isGroupAtCap(groupId: number, evidenceData: EvidenceData): boolean {
  const group = EVIDENCE_GROUPS.find(g => g.id === groupId);
  if (!group) return false;

  const categoriesInGroup = EVIDENCE_CATEGORIES.filter(c => c.groupId === groupId);
  const totalContribution = categoriesInGroup.reduce((sum, category) => {
    const count = evidenceData[category.id] || 0;
    return sum + (count * category.weight);
  }, 0);

  return totalContribution >= group.maxConfidence;
}
