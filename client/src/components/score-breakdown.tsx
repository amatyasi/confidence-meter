import { EVIDENCE_GROUPS } from "@/lib/confidence-calculator";
import type { GroupContribution } from "@/types/confidence";

interface ScoreBreakdownProps {
  groupContributions: GroupContribution;
}

export function ScoreBreakdown({ groupContributions }: ScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      {EVIDENCE_GROUPS.map(group => {
        const contribution = groupContributions[group.id.toString()] || 0;
        const percentage = (contribution / group.maxConfidence) * 100;

        // Use more precision for Initial Conviction group (id: 1) due to small values
        const displayValue = group.id === 1 && contribution < 0.1 && contribution > 0 
          ? contribution.toFixed(2) 
          : contribution.toFixed(1);

        return (
          <div key={group.id} className="group-breakdown">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground font-medium">{group.shortName}</span>
              <span className="font-semibold text-foreground">{displayValue}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>{group.maxConfidence.toFixed(1)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
