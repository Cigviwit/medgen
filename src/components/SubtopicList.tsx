
import { useState, useEffect } from "react";
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
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [failedSubtopics, setFailedSubtopics] = useState<string[]>([]);

  const progress = Object.keys(processedSubtopics).length / subtopics.subtopics.length * 100;

  // Initialize processing queue when subtopics are received
  useEffect(() => {
    if (subtopics && subtopics.subtopics.length > 0) {
      setProcessingQueue([...subtopics.subtopics]);
      setProcessedSubtopics({});
      setFailedSubtopics([]);
      setRetryCount({});
    }
  }, [subtopics]);

  // Process next subtopic in queue when current one finishes
  useEffect(() => {
    const processNextInQueue = async () => {
      // If we're already processing something, don't start another
      if (currentSubtopic || isGenerating || isRefining) return;
      
      // If queue is empty, no more to process
      if (processingQueue.length === 0) return;
      
      // Get next subtopic from queue
      const nextSubtopic = processingQueue[0];
      
      // Remove it from the queue
      setProcessingQueue(prev => prev.slice(1));
      
      // Process it
      await handleProcessSubtopic(nextSubtopic);
    };

    processNextInQueue();
  }, [processingQueue, currentSubtopic, isGenerating, isRefining]);

  // Check if all subtopics are processed
  useEffect(() => {
    const allProcessed = Object.keys(processedSubtopics).length === subtopics.subtopics.length;
    const noRemainingInQueue = processingQueue.length === 0 && !currentSubtopic;
    const noFailedOrAllFailed = failedSubtopics.length === 0 || 
      (failedSubtopics.length === subtopics.subtopics.length);
    
    if (allProcessed && subtopics.subtopics.length > 0) {
      // All subtopics processed successfully
      setTimeout(() => {
        onAllSubtopicsProcessed(Object.values(processedSubtopics));
      }, 1000);
    } else if (noRemainingInQueue && failedSubtopics.length > 0 && !allProcessed) {
      // Some subtopics failed, but we've processed everything we can
      if (Object.keys(processedSubtopics).length > 0) {
        // If we have at least some processed subtopics, send those
        toast({
          title: "Partial Success",
          description: `${Object.keys(processedSubtopics).length} subtopics processed. ${failedSubtopics.length} failed.`,
        });
        
        setTimeout(() => {
          onAllSubtopicsProcessed(Object.values(processedSubtopics));
        }, 1000);
      } else {
        // If everything failed, show error
        toast({
          title: "Error",
          description: "All subtopics failed to process. Please try again later.",
          variant: "destructive",
        });
      }
    }
  }, [processedSubtopics, subtopics.subtopics, processingQueue, currentSubtopic, failedSubtopics, onAllSubtopicsProcessed]);

  const handleProcessSubtopic = async (subtopic: string) => {
    if (currentSubtopic) return;
    
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
      
      // Remove from failed subtopics if it was there
      setFailedSubtopics(prev => prev.filter(s => s !== subtopic));
      
      toast({
        title: "Success",
        description: `Created ${refinedQuestions.questions.length} refined questions for "${subtopic}"`,
      });
    } catch (error) {
      console.error("Failed to process subtopic:", error);
      
      // Track retry count
      const currentRetries = retryCount[subtopic] || 0;
      
      if (currentRetries < 2) {
        // Add back to the queue for retrying
        setProcessingQueue(prev => [...prev, subtopic]);
        setRetryCount(prev => ({
          ...prev,
          [subtopic]: currentRetries + 1
        }));
        
        toast({
          title: "Retrying",
          description: `Failed to process "${subtopic}". Retrying (${currentRetries + 1}/3)...`,
        });
      } else {
        // Mark as failed after 3 retries
        setFailedSubtopics(prev => [...prev, subtopic]);
        
        toast({
          title: "Error",
          description: `Failed to process "${subtopic}" after multiple attempts.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
      setIsRefining(false);
      setCurrentSubtopic(null);
    }
  };

  const handleManualRetry = (subtopic: string) => {
    // Reset retry count for this subtopic
    setRetryCount(prev => ({
      ...prev,
      [subtopic]: 0
    }));
    
    // Remove from failed list
    setFailedSubtopics(prev => prev.filter(s => s !== subtopic));
    
    // Add to processing queue
    setProcessingQueue(prev => [...prev, subtopic]);
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
            const isQueued = processingQueue.includes(subtopic);
            const isFailed = failedSubtopics.includes(subtopic);
            const retries = retryCount[subtopic] || 0;
            
            return (
              <div 
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-md border transition-all duration-300",
                  isProcessed ? "bg-green-50 border-green-200" : 
                  isProcessing ? "bg-blue-50 border-blue-200" : 
                  isFailed ? "bg-red-50 border-red-200" :
                  isQueued ? "bg-gray-50 border-gray-200" :
                  "bg-white border-gray-200 hover:border-medical-teal hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  {isProcessed ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isProcessing ? (
                    <Loader2 className="h-5 w-5 text-medical-blue animate-spin shrink-0" />
                  ) : isFailed ? (
                    <CircleDashed className="h-5 w-5 text-red-500 shrink-0" />
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
                    {!isProcessed && !isProcessing && isQueued && (
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                          Queued{retries > 0 ? ` (Retry ${retries}/3)` : ""}
                        </Badge>
                      </div>
                    )}
                    {isFailed && (
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          Failed after 3 attempts
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                {isFailed && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleManualRetry(subtopic)}
                    className="ml-2"
                  >
                    Retry
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
