
import { useState } from "react";
import { DivisionResult, RefinedQuestions } from "@/services/llamaService";
import ApiKeyInput from "@/components/ApiKeyInput";
import TopicInput from "@/components/TopicInput";
import SubtopicList from "@/components/SubtopicList";
import ResultDisplay from "@/components/ResultDisplay";
import Header from "@/components/Header";

const Index = () => {
  const [apiKeySet, setApiKeySet] = useState(!!localStorage.getItem("llamaApiKey"));
  const [subtopics, setSubtopics] = useState<DivisionResult | null>(null);
  const [results, setResults] = useState<RefinedQuestions[] | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-50">
      <Header />
      
      <main className="container py-8 flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          {!apiKeySet ? (
            <ApiKeyInput onKeySet={handleApiKeySet} />
          ) : (
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
                <ResultDisplay results={results} />
              )}
              
              {(subtopics || results) && (
                <div className="pt-4 flex justify-center">
                  <button 
                    onClick={() => {
                      setSubtopics(null);
                      setResults(null);
                    }}
                    className="text-medical-blue hover:underline text-sm font-medium"
                  >
                    Start over with a new topic
                  </button>
                </div>
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
