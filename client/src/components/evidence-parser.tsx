import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EvidenceData } from "@/types/confidence";

interface EvidenceParserProps {
  onEvidenceParsed: (evidenceData: EvidenceData) => void;
}

const COLLAPSE_STORAGE_KEY = 'evidence-parser-collapsed';

export function EvidenceParser({ onEvidenceParsed }: EvidenceParserProps) {
  const [evidenceText, setEvidenceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage when it changes
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(newState));
  };

  const handleParseEvidence = async () => {
    if (!evidenceText.trim()) {
      toast({
        title: "Evidence Required",
        description: "Please enter some evidence text to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/parse-evidence",
        { evidenceText: evidenceText.trim() }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to parse evidence");
      }

      onEvidenceParsed(data.evidenceData);
      
      toast({
        title: "Evidence Parsed Successfully",
        description: "Your evidence has been analyzed and categories have been updated.",
      });
      
      // Clear the text area after successful parsing
      setEvidenceText("");
      
      // Add a small delay before scrolling to show the toast
      setTimeout(() => {
        // Scroll to the evidence input section to show the updated categories
        const evidenceSection = document.querySelector('.evidence-input-section');
        if (evidenceSection) {
          evidenceSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 500);
    } catch (error) {
      console.error("Error parsing evidence:", error);
      toast({
        title: "Parsing Failed",
        description: error instanceof Error ? error.message : "Failed to parse evidence. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            AI Evidence Parser
          </h2>
          {!isCollapsed && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Describe your evidence in natural language and let AI automatically categorize and score it for you.
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="ml-4 text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="evidence-text" className="text-foreground font-medium text-sm sm:text-base">
              Evidence Description
            </Label>
            <Textarea
              id="evidence-text"
              placeholder="Describe all your evidence here... For example: 'Me and the two founders strongly believe this new feature will work. Our product manager agrees it aligns with our AI strategy and current market trends. We've received requests from 5 key customers and have preliminary time estimates from our engineering team.'"
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              className="mt-2 min-h-[80px] sm:min-h-[90px] bg-white/5 border-white/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground resize-y text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={handleParseEvidence}
            disabled={isLoading || !evidenceText.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm sm:text-base py-2 sm:py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                Analyzing Evidence...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden xs:inline">Parse Evidence with AI</span>
                <span className="xs:hidden">Parse with AI</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}