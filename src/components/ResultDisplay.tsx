
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileDown, CheckCircle2, FileText } from "lucide-react";
import { RefinedQuestions } from "@/services/llamaService";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface ResultDisplayProps {
  results: RefinedQuestions[];
}

const ResultDisplay = ({ results }: ResultDisplayProps) => {
  const [activeTab, setActiveTab] = useState(results[0]?.subtopic || "");
  
  const totalQuestions = results.reduce((sum, subtopic) => sum + subtopic.questions.length, 0);
  
  const handleDownloadAll = () => {
    try {
      let content = "# MBBS MCQ QUESTIONS\n\n";
      
      results.forEach(result => {
        content += `## ${result.subtopic}\n\n`;
        
        result.questions.forEach((q, i) => {
          content += `### Question ${i + 1}\n${q.question}\n\n`;
          content += "Options:\n";
          q.options.forEach((option, j) => {
            const letters = ["A", "B", "C", "D"];
            content += `${letters[j]}. ${option}\n`;
          });
          content += `\nCorrect Answer: ${q.correctAnswer}\n`;
          content += `\nExplanation: ${q.explanation}\n\n`;
        });
        
        content += "\n";
      });
      
      // Create and download the file
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "mbbs_mcq_questions.txt";
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Downloaded all questions as text file",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Error",
        description: "Failed to download questions",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadSubtopic = (subtopic: string) => {
    try {
      const result = results.find(r => r.subtopic === subtopic);
      if (!result) return;
      
      let content = `# MBBS MCQ QUESTIONS: ${result.subtopic}\n\n`;
      
      result.questions.forEach((q, i) => {
        content += `## Question ${i + 1}\n${q.question}\n\n`;
        content += "Options:\n";
        q.options.forEach((option, j) => {
          const letters = ["A", "B", "C", "D"];
          content += `${letters[j]}. ${option}\n`;
        });
        content += `\nCorrect Answer: ${q.correctAnswer}\n`;
        content += `\nExplanation: ${q.explanation}\n\n`;
      });
      
      // Create and download the file
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `mbbs_mcq_${subtopic.replace(/\s+/g, '_').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Downloaded questions for "${subtopic}"`,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Error",
        description: "Failed to download questions",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full medical-glass animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-medical-blue">Final Questions</CardTitle>
            <CardDescription>
              {totalQuestions} refined MCQs across {results.length} subtopics
            </CardDescription>
          </div>
          <div className="agent-icon">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={handleDownloadAll}
            className="bg-medical-blue hover:bg-medical-navy flex-1"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download All Questions
          </Button>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap gap-2 bg-medical-light justify-start overflow-x-auto">
            {results.map((result) => (
              <TabsTrigger 
                key={result.subtopic} 
                value={result.subtopic}
                className="data-[state=active]:bg-medical-blue data-[state=active]:text-white px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap"
              >
                {result.subtopic}
                <Badge className="ml-2 bg-white text-medical-blue text-xs">
                  {result.questions.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {results.map((result) => (
            <TabsContent key={result.subtopic} value={result.subtopic} className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-medical-navy">{result.subtopic}</h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-medical-blue hover:bg-medical-light"
                    onClick={() => handleDownloadSubtopic(result.subtopic)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <div className="space-y-2 bg-medical-light/50 p-3 rounded text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <p>{result.feedback}</p>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {result.questions.map((question, index) => (
                    <AccordionItem key={index} value={`question-${index}`} className="border-b border-medical-gray">
                      <AccordionTrigger className="py-4 hover:text-medical-blue transition-colors">
                        <span className="text-left">
                          <span className="font-semibold">Q{index + 1}:</span> {question.question.substring(0, 80)}
                          {question.question.length > 80 ? "..." : ""}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-4">
                          <p className="text-gray-800">{question.question}</p>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => {
                              const letters = ["A", "B", "C", "D"];
                              const isCorrect = option === question.correctAnswer;
                              
                              return (
                                <div 
                                  key={optIndex}
                                  className={`flex items-start gap-3 p-2 rounded ${
                                    isCorrect ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"
                                  }`}
                                >
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                    isCorrect ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                                  }`}>
                                    {letters[optIndex]}
                                  </div>
                                  <div>
                                    <p className={isCorrect ? "font-medium text-green-700" : ""}>
                                      {option}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-100">
                            <h4 className="font-medium text-medical-blue mb-2">Explanation:</h4>
                            <p className="text-gray-700">{question.explanation}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResultDisplay;
