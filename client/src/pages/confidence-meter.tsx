import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, ExternalLink, Compass, RotateCcw, Trash2, Copy, Upload, FileText } from "lucide-react";
import { ConfidenceCircle } from "@/components/confidence-circle";
import { EvidenceInput } from "@/components/evidence-input";
import { EvidenceParser } from "@/components/evidence-parser";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { calculateConfidence } from "@/lib/confidence-calculator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { trackEventSafe } from "@/lib/analytics-wrapper";
import type { EvidenceData, AssessmentData } from "@/types/confidence";

const STORAGE_KEY = 'confidence-meter-evidence';
const STORAGE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function ConfidenceMeter() {
  const [evidenceData, setEvidenceData] = useState<EvidenceData>({});
  const [ideaName, setIdeaName] = useState("");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [version, setVersion] = useState(1);
  const [previousEvidenceData, setPreviousEvidenceData] = useState<EvidenceData>({});
  const [canUndo, setCanUndo] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  // Calculate confidence in real-time
  const confidenceResult = calculateConfidence(evidenceData);

  // Load evidence data and idea name from localStorage on component mount
  useEffect(() => {
    const loadStoredEvidence = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { data, ideaName: storedIdeaName, version: storedVersion, timestamp } = JSON.parse(stored);
          const now = Date.now();
          
          // Check if data is still within 30-minute expiry
          if (now - timestamp < STORAGE_EXPIRY) {
            setEvidenceData(data);
            if (storedIdeaName) {
              setIdeaName(storedIdeaName);
            }
            if (storedVersion) {
              setVersion(storedVersion);
            }
          } else {
            // Remove expired data
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading stored evidence:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadStoredEvidence();
  }, []);

  // Save evidence data and idea name to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(evidenceData).length > 0 || ideaName.trim()) {
      const dataToStore = {
        data: evidenceData,
        ideaName: ideaName.trim(),
        version: version,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    }
  }, [evidenceData, ideaName]);

  // Scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerHeight = 240; // Approximate height of the banner + header
      
      if (scrollY > headerHeight) {
        setIsSticky(true);
        setIsCollapsed(true);
      } else {
        setIsSticky(false);
        setIsCollapsed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const handleEvidenceChange = (categoryId: string, value: number) => {
    setEvidenceData(prev => ({
      ...prev,
      [categoryId]: value
    }));
    
    // Track evidence input changes
    trackEventSafe('evidence_input', 'engagement', categoryId, value, {
      category_id: categoryId,
      value: value,
      total_score: confidenceResult.totalScore
    });
  };

  const handleEvidenceParsed = (parsedEvidence: EvidenceData) => {
    setPreviousEvidenceData(evidenceData);
    setEvidenceData(parsedEvidence);
    setCanUndo(true);
    
    // Track AI evidence parsing
    trackEventSafe('ai_evidence_parsed', 'engagement', 'evidence_auto_populated', undefined, {
      parsed_categories: Object.keys(parsedEvidence).filter(key => parsedEvidence[key] > 0).length,
      total_indicators: Object.values(parsedEvidence).reduce((sum, count) => sum + count, 0),
      resulting_score: calculateConfidence({
        ...evidenceData,
        ...Object.fromEntries(
          Object.entries(parsedEvidence).map(([key, count]) => [
            key, 
            (evidenceData[key] || 0) + count
          ])
        )
      }).totalScore
    });
  };

  const handleClearAll = () => {
    setPreviousEvidenceData(evidenceData);
    setEvidenceData({});
    setIdeaName("");
    setVersion(1); // Reset version to 1 for new assessment
    setCanUndo(true);
    
    // Clear localStorage when clearing all evidence
    localStorage.removeItem(STORAGE_KEY);
    
    // Track clear all action
    trackEventSafe('clear_all', 'engagement', 'evidence_cleared', undefined, {
      previous_score: confidenceResult.totalScore
    });
  };

  const handleUndo = () => {
    setEvidenceData(previousEvidenceData);
    setIdeaName("");
    setVersion(1); // Reset version to 1 when undoing
    setCanUndo(false);
    
    // Track undo action
    trackEventSafe('undo_clear', 'engagement', 'evidence_restored', undefined, {
      restored_score: calculateConfidence(previousEvidenceData).totalScore
    });
  };



  const createAssessmentJSON = (incrementVersion = false) => {
    const exportName = ideaName.trim() || "Unnamed Idea";
    const currentVersion = incrementVersion ? version + 1 : version;
    
    return {
      ideaName: exportName,
      confidenceScore: confidenceResult.totalScore,
      version: currentVersion,
      assessmentDate: new Date().toISOString(),
      evidenceBreakdown: confidenceResult.groupContributions,
      evidenceData,
      methodology: "Itamar Gilad Confidence Meter",
      source: "https://confidence.matyasi.me"
    };
  };

  const handleExportJSON = () => {
    const exportName = ideaName.trim() || "Unnamed Idea";
    const assessment = createAssessmentJSON(true); // Increment version on export
    
    // Update local version after export
    setVersion(assessment.version);

    // Track export action
    trackEventSafe('export_assessment', 'engagement', 'json_export', confidenceResult.totalScore, {
      export_format: 'json',
      idea_name: exportName,
      total_score: confidenceResult.totalScore,
      evidence_count: Object.keys(evidenceData).length,
      version: assessment.version
    });

    const blob = new Blob([JSON.stringify(assessment, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confidence-assessment-${exportName.replace(/\s+/g, '-').toLowerCase()}-v${assessment.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);

    toast({
      title: "Export Complete",
      description: `Assessment exported as JSON file (Version ${assessment.version}).`,
    });
  };

  const handleCopyJSON = async () => {
    const assessment = createAssessmentJSON(true); // Increment version on copy
    
    // Update local version after copy
    setVersion(assessment.version);
    
    const jsonString = JSON.stringify(assessment, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      
      // Track copy action
      trackEventSafe('copy_assessment', 'engagement', 'json_copy', confidenceResult.totalScore, {
        export_format: 'json',
        idea_name: assessment.ideaName,
        total_score: confidenceResult.totalScore,
        evidence_count: Object.keys(evidenceData).length,
        version: assessment.version
      });

      toast({
        title: "Copied to Clipboard",
        description: `Assessment JSON copied to clipboard (Version ${assessment.version}).`,
      });
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied to Clipboard",
        description: `Assessment JSON copied to clipboard (Version ${assessment.version}).`,
      });
    }
  };

  const validateImportedData = (data: any): boolean => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.ideaName === 'string' &&
      typeof data.confidenceScore === 'number' &&
      typeof data.evidenceData === 'object' &&
      typeof data.methodology === 'string'
    );
  };

  const handleImportData = (importedData: any) => {
    if (!validateImportedData(importedData)) {
      toast({
        title: "Import Error",
        description: "Invalid assessment format. Please check your JSON structure.",
        variant: "destructive"
      });
      return;
    }

    // Store current state for undo
    setPreviousEvidenceData(evidenceData);
    setCanUndo(true);

    // Import the data
    setEvidenceData(importedData.evidenceData || {});
    setIdeaName(importedData.ideaName || "");
    setVersion(importedData.version || 1); // Load version from imported data, default to 1
    setImportModalOpen(false);
    setImportText("");

    // Track import action
    trackEventSafe('import_assessment', 'engagement', 'json_import', importedData.confidenceScore, {
      import_format: 'json',
      idea_name: importedData.ideaName,
      total_score: importedData.confidenceScore,
      evidence_count: Object.keys(importedData.evidenceData || {}).length
    });

    toast({
      title: "Import Successful",
      description: `Assessment "${importedData.ideaName}" imported successfully.`,
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        title: "Invalid File Type",
        description: "Please select a JSON file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        handleImportData(jsonData);
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Invalid JSON file. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handlePasteImport = () => {
    if (!importText.trim()) {
      toast({
        title: "No Data",
        description: "Please paste JSON content in the text area.",
        variant: "destructive"
      });
      return;
    }

    try {
      const jsonData = JSON.parse(importText.trim());
      handleImportData(jsonData);
    } catch (error) {
      toast({
        title: "Import Error", 
        description: "Invalid JSON format. Please check your pasted content.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Attribution Banner - Only visible when not sticky */}
      {!isSticky && (
        <div className="bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-blue-700/90 backdrop-blur-sm text-white px-4 py-3 text-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Compass className="w-4 h-4 text-blue-200" />
              <span>This tool implements Itamar Gilad's <a 
                href="https://itamargilad.com/the-tool-that-will-help-you-choose-better-product-ideas/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-bold text-white hover:text-blue-100 underline transition-colors"
                onClick={() => {
                  trackEventSafe('external_link_click', 'engagement', 'itamar_methodology', undefined, {
                    link_type: 'methodology',
                    destination: 'itamar_gilad_blog'
                  });
                }}
              >Confidence Meter</a></span>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/1p76OQdLRT3sGhIBATbdSSf25IozQUpiSCgjMxeYJ-tA/copy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-200 hover:text-white underline flex items-center gap-1 transition-colors"
              onClick={() => {
                trackEventSafe('external_link_click', 'engagement', 'original_sheet', undefined, {
                  link_type: 'template',
                  destination: 'google_sheets'
                });
              }}
            >
              View Original Sheet
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className={`glass-card border-b border-white/10 transition-all duration-300 ${
        isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : ''
      } ${isCollapsed ? 'py-2 sm:py-3' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={`${
            isCollapsed 
              ? 'flex items-center justify-between' 
              : 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
          }`}>
            <div className={`transition-all duration-300 ${isCollapsed ? 'flex items-center gap-2 sm:gap-4' : ''}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <Compass className={`text-primary transition-all duration-300 ${
                  isCollapsed ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-8 h-8'
                }`} />
                <h1 className={`font-bold text-foreground transition-all duration-300 ${
                  isCollapsed ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
                }`}>
                  {isCollapsed ? (
                    <span className="hidden sm:inline">Confidence Meter</span>
                  ) : (
                    'Confidence Meter'
                  )}
                </h1>
              </div>
              {!isCollapsed && (
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">Evidence-based confidence scoring for your ICE prioritization</p>
              )}
            </div>
            <div className={`${
              isCollapsed 
                ? 'flex gap-1 sm:gap-2' 
                : 'flex flex-col sm:flex-row gap-2 sm:gap-3'
            }`}>
              <div className={`flex ${isCollapsed ? 'gap-1 sm:gap-2' : 'gap-2 sm:gap-3'}`}>
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className={`flex items-center bg-white/5 border-white/20 hover:bg-white/10 ${
                    isCollapsed 
                      ? 'gap-0 sm:gap-1 text-xs px-1 sm:px-2 py-1' 
                      : 'gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                  }`}
                >
                  <Trash2 className={`${isCollapsed ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'}`} />
                  {!isCollapsed && (
                    <>
                      <span className="hidden xs:inline">Clear All</span>
                      <span className="xs:hidden">Clear</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`flex items-center bg-white/5 border-white/20 hover:bg-white/10 disabled:opacity-50 ${
                    isCollapsed 
                      ? 'gap-0 sm:gap-1 text-xs px-1 sm:px-2 py-1' 
                      : 'gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                  }`}
                >
                  <RotateCcw className={`${isCollapsed ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'}`} />
                  {!isCollapsed && (
                    <span className="hidden xs:inline">Undo</span>
                  )}
                </Button>
                <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className={`flex items-center bg-purple-600/90 hover:bg-purple-600 ${
                        isCollapsed 
                          ? 'gap-0 sm:gap-1 text-xs px-1 sm:px-2 py-1' 
                          : 'gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                      }`}
                    >
                      <Upload className={`${isCollapsed ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'}`} />
                      {!isCollapsed && (
                        <>
                          <span className="hidden xs:inline">Import</span>
                          <span className="xs:hidden">Import</span>
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Import Assessment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* File Upload Option */}
                      <div>
                        <Label htmlFor="file-import">Upload JSON File</Label>
                        <div className="mt-2">
                          <input
                            id="file-import"
                            type="file"
                            accept=".json"
                            onChange={handleFileImport}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-import')?.click()}
                            className="w-full flex items-center gap-2 bg-white/5 border-white/20 hover:bg-white/10"
                          >
                            <Upload className="w-4 h-4" />
                            Choose JSON File
                          </Button>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/20"></div>
                        <span className="text-sm text-muted-foreground">or</span>
                        <div className="flex-1 h-px bg-white/20"></div>
                      </div>

                      {/* Paste JSON Option */}
                      <div>
                        <Label htmlFor="paste-import">Paste JSON Content</Label>
                        <Textarea
                          id="paste-import"
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          placeholder="Paste your assessment JSON here..."
                          className="mt-2 bg-white/5 border-white/20 min-h-32"
                          rows={6}
                        />
                      </div>

                      {/* Import Actions */}
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setImportModalOpen(false);
                            setImportText("");
                          }}
                          className="flex-1 bg-white/5 border-white/20 hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handlePasteImport}
                          disabled={!importText.trim()}
                          className="flex-1 flex items-center gap-2 bg-purple-600/90 hover:bg-purple-600 disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4" />
                          Import from Text
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
                <DialogTrigger asChild>
                  <Button className={`flex items-center bg-primary/90 hover:bg-primary ${
                    isCollapsed 
                      ? 'gap-0 sm:gap-1 text-xs px-1 sm:px-2 py-1' 
                      : 'gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                  }`}>
                    <Download className={`${isCollapsed ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'}`} />
                    {!isCollapsed && (
                      <span>Export</span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Export Results</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="export-idea-name">Idea Name</Label>
                      <Input
                        id="export-idea-name"
                        value={ideaName}
                        onChange={(e) => setIdeaName(e.target.value)}
                        placeholder="Enter idea name..."
                        className="bg-white/5 border-white/20"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={handleExportJSON}
                        className="flex-1 flex items-center gap-2 bg-white/5 border-white/20 hover:bg-white/10"
                      >
                        <Download className="w-4 h-4" />
                        Export JSON
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCopyJSON}
                        className="flex-1 flex items-center gap-2 bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30 text-blue-100 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 py-4 sm:py-8 transition-all duration-300 ${
        isSticky ? 'mt-16 sm:mt-20' : ''
      }`}>
        {/* AI Evidence Parser - Full width */}
        <div className="mb-6 sm:mb-8">
          <EvidenceParser onEvidenceParsed={handleEvidenceParsed} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Manual Evidence Input */}
          <div className="lg:col-span-2 evidence-input-section">
            <EvidenceInput
              evidenceData={evidenceData}
              groupContributions={confidenceResult.groupContributions}
              onEvidenceChange={handleEvidenceChange}
            />
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Editable Assessment Name */}
            <div className="glass-card p-4 sm:p-6 border-primary/20">
              <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3">Idea Name</h2>
              <div className="relative">
                <Input
                  value={ideaName}
                  onChange={(e) => setIdeaName(e.target.value)}
                  placeholder="Enter idea name..."
                  className="bg-white/5 border-white/20 text-foreground placeholder:text-muted-foreground pr-16"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-white/10 border border-white/20 px-2 py-1 rounded">
                  v{version}
                </span>
              </div>
            </div>

            {/* Confidence Score Display */}
            <div className="glass-card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Confidence Score</h2>
              <ConfidenceCircle
                score={confidenceResult.totalScore}
                maxScore={confidenceResult.maxPossibleScore}
              />
            </div>

            {/* Breakdown by Group */}
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Score Breakdown</h3>
              <ScoreBreakdown groupContributions={confidenceResult.groupContributions} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 py-4 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Made by{" "}
            <a
              href="https://andras.matyasi.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline transition-colors"
              onClick={() => {
                trackEventSafe('external_link_click', 'engagement', 'creator_portfolio', undefined, {
                  link_type: 'portfolio',
                  destination: 'andras_matyasi'
                });
              }}
            >
              Andris
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
