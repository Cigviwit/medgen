
import { useState } from "react";
import { DivisionResult, RefinedQuestions } from "@/services/llamaService";
import ApiKeyInput from "@/components/ApiKeyInput";
import TopicInput from "@/components/TopicInput";
import SubtopicList from "@/components/SubtopicList";
import ResultDisplay from "@/components/ResultDisplay";
import QuizMode from "@/components/QuizMode";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const Index = () => {
  const [apiKeySet, setApiKeySet] = useState(!!localStorage.getItem("llamaApiKey"));
  const [subtopics, setSubtopics] = useState<DivisionResult | null>(null);
  const [results, setResults] = useState<RefinedQuestions[] | null>(null);
  const [mode, setMode] = useState<"generate" | "solve">("generate");

  const handleApiKeySet = () => {
    setApiKeySet(true);
  };

  const handleSubtopicsGenerated = (result: DivisionResult) => {
    setSubtopics(result);
    setResults(null); // Reset results when new subtopics are generated
  };

  const handleAllSubtopicsProcessed = (questions: RefinedQuestions[]) => {
    setResults(questions);
  };

  const handleSwitchToQuizMode = () => {
    setMode("solve");
  };

  const handleExitQuizMode = () => {
    setMode("generate");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-50">
      <Header />
      
      <main className="container py-8 flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          {!apiKeySet ? (
            <ApiKeyInput onKeySet={handleApiKeySet} />
          ) : (
            <>
              {mode === "generate" ? (
                <>
                  {!subtopics && (
                    <TopicInput onSubtopicsGenerated={handleSubtopicsGenerated} />
                  )}
                  
                  {subtopics && !results && (
                    <SubtopicList 
                      subtopics={subtopics} 
                      onAllSubtopicsProcessed={handleAllSubtopicsProcessed} 
                    />
                  )}
                  
                  {results && (
                    <>
                      <ResultDisplay results={results} />
                      <div className="pt-6 flex justify-center">
                        <Button 
                          onClick={handleSwitchToQuizMode}
                          className="bg-medical-teal hover:bg-medical-teal/80"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Practice These Questions
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {subtopics && (
                    <div className="pt-4 flex justify-center">
                      <button 
                        onClick={() => setSubtopics(null)}
                        className="text-medical-blue hover:underline text-sm font-medium"
                      >
                        Start over with a new topic
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <QuizMode 
                  results={results || []}
                  onExit={handleExitQuizMode}  
                />
              )}
            </>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-medical-gray py-4">
        <div className="container text-center text-sm text-gray-500">
          <p>MedQuest Alchemy Lab - Advanced MBBS MCQs Generator</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
