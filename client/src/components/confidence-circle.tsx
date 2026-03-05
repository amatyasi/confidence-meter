import { getScoreInterpretation } from "@/lib/confidence-calculator";

interface ConfidenceCircleProps {
  score: number;
  maxScore: number;
}

export function ConfidenceCircle({ score, maxScore }: ConfidenceCircleProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const circumference = 314.16; // 2 * π * 50
  const strokeDashoffset = circumference * (1 - percentage / 100);
  const interpretation = getScoreInterpretation(score);

  return (
    <div className="flex flex-col items-center">
      {/* Circle Visualization */}
      <div className="relative w-40 h-40 mb-6">
        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="url(#scoreGradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference * 1.4}
            strokeDashoffset={strokeDashoffset * 1.4}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease-in-out"
            }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {score < 1 && score > 0 ? score.toFixed(2) : score.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">/ {maxScore.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Score Interpretation */}
      <div className="text-center p-4 bg-white/5 rounded-lg w-full border border-white/10">
        <div className="text-lg font-medium text-foreground mb-1">{interpretation.level}</div>
        <div className="text-sm text-muted-foreground">{interpretation.description}</div>
      </div>
    </div>
  );
}
