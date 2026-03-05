import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVIDENCE_CATEGORIES, EVIDENCE_GROUPS, isGroupAtCap } from "@/lib/confidence-calculator";
import type { EvidenceData, GroupContribution } from "@/types/confidence";

interface EvidenceInputProps {
  evidenceData: EvidenceData;
  groupContributions: GroupContribution;
  onEvidenceChange: (categoryId: string, value: number) => void;
}

export function EvidenceInput({ 
  evidenceData, 
  groupContributions, 
  onEvidenceChange
}: EvidenceInputProps) {
  const [animatingCategories, setAnimatingCategories] = useState<Set<string>>(new Set());
  const [aiAffectedCategories, setAiAffectedCategories] = useState<Set<string>>(new Set());
  const [previousEvidenceData, setPreviousEvidenceData] = useState<EvidenceData>(evidenceData);

  // Detect when evidence data changes and trigger animations
  useEffect(() => {
    const changedCategories = new Set<string>();
    
    // Check all categories for changes, including new ones
    const allCategoryIds = new Set([
      ...Object.keys(evidenceData), 
      ...Object.keys(previousEvidenceData)
    ]);
    
    allCategoryIds.forEach(categoryId => {
      const currentValue = evidenceData[categoryId] || 0;
      const previousValue = previousEvidenceData[categoryId] || 0;
      
      if (currentValue !== previousValue) {
        changedCategories.add(categoryId);
      }
    });

    if (changedCategories.size > 0) {
      setAnimatingCategories(changedCategories);
      
      // Add to AI affected categories (these will stay yellow)
      setAiAffectedCategories(prev => {
        const newSet = new Set(Array.from(prev));
        Array.from(changedCategories).forEach(cat => newSet.add(cat));
        return newSet;
      });
      
      // Remove animation after 2 seconds, but keep yellow border
      const timer = setTimeout(() => {
        setAnimatingCategories(new Set());
      }, 2000);

      // Update previous data after setting up the animation
      setPreviousEvidenceData(evidenceData);

      return () => clearTimeout(timer);
    }
  }, [evidenceData]);

  const groupedCategories = EVIDENCE_GROUPS.map(group => ({
    ...group,
    categories: EVIDENCE_CATEGORIES.filter(cat => cat.groupId === group.id)
  }));

  return (
    <TooltipProvider>
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Evidence Categories</h2>
        </div>

        <div className="space-y-8">
          {groupedCategories.map((group, groupIndex) => {
            const contribution = groupContributions[group.id.toString()] || 0;
            const atCap = isGroupAtCap(group.id, evidenceData);

            return (
              <div key={group.id} className={`evidence-group ${groupIndex > 0 ? 'border-t border-white/10 pt-6' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">{group.name}</h3>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Max: {group.maxConfidence.toFixed(1)}</span>
                    <span className={`ml-2 font-bold ${atCap ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      Current: {contribution.toFixed(1)}{atCap ? ' (at cap)' : ''}
                    </span>
                  </div>
                </div>

                {group.categories.map(category => {
                  const currentValue = evidenceData[category.id] || 0;
                  const isAnimating = animatingCategories.has(category.id);
                  const isAiAffected = aiAffectedCategories.has(category.id);
                  
                  return (
                    <div 
                      key={category.id} 
                      className={`evidence-category mb-6 p-4 rounded-lg transition-all duration-500 ${
                        isAnimating 
                          ? 'animate-pulse border-yellow-300/70 bg-yellow-50/10 shadow-lg shadow-yellow-300/20' 
                          : isAiAffected
                          ? 'border-yellow-300/50 bg-yellow-50/5'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Label className="flex items-center text-foreground font-medium">
                          {category.name}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="ml-2 p-1 h-auto text-muted-foreground hover:text-foreground">
                                <HelpCircle className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-slate-900 border-slate-700 shadow-xl">
                              <p className="mb-2 text-white">{category.tooltip}</p>
                              <p className="text-xs text-slate-300">Examples: {category.examples}</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <span className="text-sm text-muted-foreground">Weight: {category.weight.toFixed(2)} each</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEvidenceChange(category.id, Math.max(0, currentValue - 1))}
                            disabled={currentValue <= 0}
                            className="h-8 w-8 p-0 bg-white/5 border-white/20 hover:bg-white/10 flex-shrink-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={currentValue}
                            onChange={(e) => onEvidenceChange(category.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center bg-white/5 border-white/20 focus:border-primary/50 flex-shrink-0"
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEvidenceChange(category.id, Math.min(10, currentValue + 1))}
                            disabled={currentValue >= 10}
                            className="h-8 w-8 p-0 bg-white/5 border-white/20 hover:bg-white/10 flex-shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          
                          <span className="text-muted-foreground text-sm flex-shrink-0">indicators</span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground hidden lg:block max-w-xs text-right ml-4">
                          {category.examples}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
