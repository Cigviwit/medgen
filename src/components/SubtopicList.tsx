
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CircleDashed, Loader2, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DivisionResult, SubtopicQuestions, RefinedQuestions, llamaService } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";

interface SubtopicListProps {
  subtopics: DivisionResult;
  onAllSubtopicsProcessed: (questions: RefinedQuestions[]) => void;
}

const SubtopicList = ({ subtopics, onAllSubtopicsProcessed }: SubtopicListProps) => {
  const [processedSubtopics, setProcessedSubtopics] = useState<Record<string, RefinedQuestions>>({});
  const [currentSubtopic, setCurrentSubtopic] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  const progress = Object.keys(processedSubtopics).length / subtopics.subtopics.length * 100;

  const handleProcessSubtopic = async (subtopic: string) => {
    if (currentSubtopic || isGenerating || isRefining) return;
    
    setCurrentSubtopic(subtopic);
    
    // Step 1: Generate questions
    setIsGenerating(true);
    let generatedQuestions: SubtopicQuestions;
    
    try {
      toast({
        title: "Generating Questions",
        description: `Agent 2 is creating questions for "${subtopic}"...`,
      });
      
      generatedQuestions = await llamaService.generateQuestionsForSubtopic(subtopic);
      
      // Step 2: Refine questions
      setIsGenerating(false);
      setIsRefining(true);
      
      toast({
        title: "Refining Questions",
        description: `Agent 3 is reviewing questions for "${subtopic}"...`,
      });
      
      const refinedQuestions = await llamaService.refineQuestions(generatedQuestions);
      
      // Update state with the refined questions
      setProcessedSubtopics(prev => ({
        ...prev,
        [subtopic]: refinedQuestions
      }));
      
      toast({
        title: "Success",
        description: `Created ${refinedQuestions.questions.length} refined questions for "${subtopic}"`,
      });
    } catch (error) {
      console.error("Failed to process subtopic:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process subtopic",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsRefining(false);
      setCurrentSubtopic(null);
      
      // Check if all subtopics are processed
      const updatedProcessedCount = Object.keys(processedSubtopics).length + 1;
      if (updatedProcessedCount === subtopics.subtopics.length) {
        // All subtopics processed, notify parent
        setTimeout(() => {
          onAllSubtopicsProcessed(Object.values(processedSubtopics));
        }, 1000);
      }
    }
  };

  return (
    <Card className="w-full medical-glass animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-medical-blue">Subtopics</CardTitle>
            <CardDescription>
              Agent 2 will generate questions and Agent 3 will refine them
            </CardDescription>
          </div>
          <div className="agent-icon">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="space-y-3">
          {subtopics.subtopics.map((subtopic, index) => {
            const isProcessed = !!processedSubtopics[subtopic];
            const isProcessing = currentSubtopic === subtopic;
            
            return (
              <div 
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-md border transition-all duration-300",
                  isProcessed ? "bg-green-50 border-green-200" : 
                  isProcessing ? "bg-blue-50 border-blue-200" : 
                  "bg-white border-gray-200 hover:border-medical-teal hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  {isProcessed ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isProcessing ? (
                    <Loader2 className="h-5 w-5 text-medical-blue animate-spin shrink-0" />
                  ) : (
                    <CircleDashed className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{subtopic}</p>
                    {isProcessed && (
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {processedSubtopics[subtopic].questions.length} Questions
                        </Badge>
                      </div>
                    )}
                    {isProcessing && (
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {isGenerating ? "Generating Questions..." : "Refining Questions..."}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                {!isProcessed && !isProcessing && (
                  <Button 
                    size="sm"
                    onClick={() => handleProcessSubtopic(subtopic)}
                    disabled={!!currentSubtopic}
                    className="bg-medical-blue hover:bg-medical-navy"
                  >
                    Process
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubtopicList;
