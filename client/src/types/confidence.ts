export interface EvidenceCategory {
  id: string;
  name: string;
  weight: number;
  groupId: number;
  tooltip: string;
  examples: string;
}

export interface EvidenceGroup {
  id: number;
  name: string;
  maxConfidence: number;
  shortName: string;
}

export interface EvidenceData {
  [categoryId: string]: number;
}

export interface GroupContribution {
  [groupId: string]: number;
}

export interface ConfidenceResult {
  totalScore: number;
  groupContributions: GroupContribution;
  maxPossibleScore: number;
}

export interface AssessmentData {
  id?: number;
  ideaName: string;
  evidenceData: EvidenceData;
  totalScore: number;
  groupContributions: GroupContribution;
  createdAt?: string;
  updatedAt?: string;
}
