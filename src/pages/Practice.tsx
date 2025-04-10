
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import NavBar from "@/components/NavBar";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface Topic {
  id: string;
  title: string;
  created_at: string;
}

interface Subtopic {
  id: string;
  title: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

const Practice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else {
      loadTopics();
    }
  }, [user, navigate]);

  const loadTopics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setTopics(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load topics: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubtopics = async (topicId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subtopics")
        .select("*")
        .eq("topic_id", topicId)
        .order("title");
      
      if (error) throw error;
      setSubtopics(data || []);
      setSelectedSubtopic(null);
      setQuestions([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load subtopics: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestions = async (subtopicId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("subtopic_id", subtopicId);
      
      if (error) throw error;
      
      // Process the JSONB options field - ensure proper type conversion
      const processedQuestions = data.map(q => ({
        ...q,
        options: Array.isArray(q.options) 
          ? q.options.map(opt => String(opt)) // Convert each option to string
          : []
      }));
      
      setQuestions(processedQuestions as Question[]);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load questions: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    loadSubtopics(topicId);
  };

  const handleSubtopicSelect = (subtopicId: string) => {
    setSelectedSubtopic(subtopicId);
    loadQuestions(subtopicId);
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  // Return to topic selection
  const handleReset = () => {
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setQuestions([]);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion?.correct_answer;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-50">
      <Header />
      <NavBar />
      
      <main className="container py-8 flex-1 flex flex-col">
        <Card className="w-full max-w-4xl mx-auto medical-glass animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-medical-blue">Practice Mode</CardTitle>
                <CardDescription>
                  Practice MCQs with instant feedback
                </CardDescription>
              </div>
              <div className="agent-icon">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-medical-blue" />
              </div>
            ) : topics.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-gray-500 mb-4">No topics available. Generate some MCQs first.</p>
                <Button onClick={() => navigate("/")}>Go to Generator</Button>
              </div>
            ) : !selectedTopic ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select a Topic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topics.map(topic => (
                    <Button
                      key={topic.id}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => handleTopicSelect(topic.id)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{topic.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(topic.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : !selectedSubtopic ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleReset}
                    className="text-gray-500"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Topics
                  </Button>
                </div>
                
                <h3 className="text-lg font-medium">Select a Subtopic</h3>
                {subtopics.length === 0 ? (
                  <p className="text-gray-500">No subtopics available for this topic.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {subtopics.map(subtopic => (
                      <Button
                        key={subtopic.id}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleSubtopicSelect(subtopic.id)}
                      >
                        {subtopic.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-gray-500 mb-4">No questions available for this subtopic.</p>
                <Button onClick={() => setSelectedSubtopic(null)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Subtopics
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedSubtopic(null)}
                    className="text-gray-500"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Subtopics
                  </Button>
                  
                  <div className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-gray-800 mb-4">{currentQuestion.question}</p>
                  
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, optIndex) => {
                      const letters = ["A", "B", "C", "D"];
                      const isSelected = selectedOption === option;
                      const isCorrectOption = option === currentQuestion.correct_answer;
                      
                      let bgColor = "bg-gray-50 border-gray-100";
                      if (isAnswered) {
                        if (isCorrectOption) {
                          bgColor = "bg-green-50 border-green-100";
                        } else if (isSelected) {
                          bgColor = "bg-red-50 border-red-100";
                        }
                      }
                      
                      return (
                        <div 
                          key={optIndex}
                          className={`flex items-start gap-3 p-3 rounded border ${bgColor} cursor-pointer transition-colors`}
                          onClick={() => handleOptionSelect(option)}
                        >
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected ? (isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") 
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            {letters[optIndex]}
                          </div>
                          <div className="flex-1">
                            <p className={isCorrectOption && isAnswered ? "font-medium text-green-700" : ""}>
                              {option}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {isAnswered && (
                  <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-100">
                    <h4 className="font-medium text-medical-blue mb-2">Explanation:</h4>
                    <p className="text-gray-700">{currentQuestion.explanation}</p>
                  </div>
                )}
                
                <div className="flex justify-between mt-4">
                  <Button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  {!isAnswered ? (
                    <Button 
                      onClick={() => handleOptionSelect(currentQuestion.correct_answer)}
                      variant="outline"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      Reveal Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="bg-medical-blue hover:bg-medical-navy"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Practice;
