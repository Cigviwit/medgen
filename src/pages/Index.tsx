
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DivisionResult, RefinedQuestions, llamaService } from "@/services/llamaService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ApiKeyInput from "@/components/ApiKeyInput";
import TopicInput from "@/components/TopicInput";
import SubtopicList from "@/components/SubtopicList";
import ResultDisplay from "@/components/ResultDisplay";
import Header from "@/components/Header";
import NavBar from "@/components/NavBar";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeySet, setApiKeySet] = useState(!!localStorage.getItem("llamaApiKey"));
  const [subtopics, setSubtopics] = useState<DivisionResult | null>(null);
  const [results, setResults] = useState<RefinedQuestions[] | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [savedTopicId, setSavedTopicId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (user && results) {
      // Prompt user to save results if not already saved
      if (!savedTopicId && topicTitle) {
        const saveConfirm = window.confirm("Would you like to save these MCQs to your account?");
        if (saveConfirm) {
          saveMcqsToDatabase();
        }
      }
    }
  }, [results, user, savedTopicId, topicTitle]);

  const handleApiKeySet = () => {
    setApiKeySet(true);
  };

  const handleSubtopicsGenerated = (result: DivisionResult, title: string) => {
    setSubtopics(result);
    setResults(null); // Reset results when new subtopics are generated
    setTopicTitle(title);
    setSavedTopicId(null); // Reset saved topic ID
  };

  const handleAllSubtopicsProcessed = (questions: RefinedQuestions[]) => {
    setResults(questions);
  };

  const saveMcqsToDatabase = async () => {
    if (!user || !results || !topicTitle) return;
    
    try {
      // Step 1: Create topic
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .insert({
          user_id: user.id,
          title: topicTitle,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (topicError) throw topicError;
      
      const topicId = topicData?.id;
      if (!topicId) throw new Error("Failed to get topic ID");
      
      // Step 2: Create subtopics and questions for each refined result
      for (const result of results) {
        // Create subtopic
        const { data: subtopicData, error: subtopicError } = await supabase
          .from("subtopics")
          .insert({
            topic_id: topicId,
            title: result.subtopic,
            feedback: result.feedback || null
          })
          .select()
          .single();
        
        if (subtopicError) throw subtopicError;
        
        const subtopicId = subtopicData?.id;
        if (!subtopicId) throw new Error("Failed to get subtopic ID");
        
        // Create questions for this subtopic
        const questionsToInsert = result.questions.map(q => ({
          subtopic_id: subtopicId,
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation
        }));
        
        const { error: questionsError } = await supabase
          .from("questions")
          .insert(questionsToInsert);
        
        if (questionsError) throw questionsError;
      }
      
      // Set saved topic ID to prevent duplicate saves
      setSavedTopicId(topicId);
      
      toast({
        title: "MCQs Saved",
        description: "Your MCQs have been saved to your account.",
      });
    } catch (error: any) {
      console.error("Error saving MCQs:", error);
      toast({
        title: "Error",
        description: "Failed to save MCQs: " + error.message,
        variant: "destructive",
      });
    }
  };

  const navigateToPractice = () => {
    navigate('/practice');
  };

  const navigateToTest = () => {
    navigate('/test');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-50">
      <Header />
      <NavBar />
      
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
                <>
                  <ResultDisplay results={results} />
                  
                  {user && savedTopicId && (
                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={navigateToPractice}
                        className="bg-medical-blue hover:bg-medical-navy"
                      >
                        Practice Mode
                      </Button>
                      <Button 
                        onClick={navigateToTest}
                        className="bg-medical-teal hover:bg-medical-blue"
                      >
                        Test Mode
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {(subtopics || results) && (
                <div className="pt-4 flex justify-center">
                  <button 
                    onClick={() => {
                      setSubtopics(null);
                      setResults(null);
                      setTopicTitle("");
                      setSavedTopicId(null);
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
