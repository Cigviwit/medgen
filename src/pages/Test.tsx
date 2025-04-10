import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, ChevronLeft, Loader2, Check, X, BarChart } from "lucide-react";
import Header from "@/components/Header";
import NavBar from "@/components/NavBar";
import { toast } from "@/hooks/use-toast";

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

interface UserAnswer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

const Test = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testInProgress, setTestInProgress] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // Default 30 minutes
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else {
      loadTopics();
    }
  }, [user, navigate]);

  // Timer effect
  useEffect(() => {
    if (testInProgress && timeRemaining > 0) {
      const intervalId = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimer(intervalId);
      
      return () => clearInterval(intervalId);
    }
  }, [testInProgress, timeRemaining]);

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

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
      
      // Process the JSONB options field
      const processedQuestions = data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : []
      }));
      
      // Shuffle the questions
      const shuffledQuestions = [...processedQuestions].sort(() => Math.random() - 0.5);
      
      setQuestions(shuffledQuestions);
      setUserAnswers([]);
      setCurrentQuestionIndex(0);
      setTestComplete(false);
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

  const startTest = () => {
    // Convert minutes to seconds
    setTimeRemaining(timeLimit * 60);
    setTestInProgress(true);
  };

  const handleOptionSelect = (option: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct_answer;
    
    // Record the answer
    setUserAnswers(prev => {
      // Check if this question has already been answered
      const existingAnswerIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
      
      if (existingAnswerIndex !== -1) {
        // Update existing answer
        const newAnswers = [...prev];
        newAnswers[existingAnswerIndex] = {
          questionId: currentQuestion.id,
          selectedOption: option,
          isCorrect
        };
        return newAnswers;
      } else {
        // Add new answer
        return [...prev, {
          questionId: currentQuestion.id,
          selectedOption: option,
          isCorrect
        }];
      }
    });
    
    // Move to next question if not the last one
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const finishTest = () => {
    if (timer) clearInterval(timer);
    setTestInProgress(false);
    setTestComplete(true);
  };

  const resetTest = () => {
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setTestInProgress(false);
    setTestComplete(false);
    if (timer) clearInterval(timer);
  };

  // Return to topic selection
  const handleReset = () => {
    resetTest();
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setQuestions([]);
  };

  // Get user's answer for current question
  const getUserAnswer = (questionId: string) => {
    return userAnswers.find(a => a.questionId === questionId);
  };

  // Calculate test score
  const calculateScore = () => {
    if (questions.length === 0) return 0;
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    return Math.round((correctAnswers / questions.length) * 100);
  };

  // Calculate unanswered questions
  const getUnansweredCount = () => {
    return questions.length - userAnswers.length;
  };

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? getUserAnswer(currentQuestion.id) : null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-50">
      <Header />
      <NavBar />
      
      <main className="container py-8 flex-1 flex flex-col">
        <Card className="w-full max-w-4xl mx-auto medical-glass animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-medical-blue">Test Mode</CardTitle>
                <CardDescription>
                  Test yourself with MCQs and get a final score
                </CardDescription>
              </div>
              <div className="agent-icon">
                <ClipboardCheck className="h-5 w-5" />
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
            ) : !testInProgress && !testComplete ? (
              
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedSubtopic(null)}
                    className="text-gray-500"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Subtopics
                  </Button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Test Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtopic: <span className="font-bold">{subtopics.find(s => s.id === selectedSubtopic)?.title}</span>
                      </label>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Questions: <span className="font-bold">{questions.length}</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Time Limit (minutes):
                        </label>
                        <select 
                          value={timeLimit}
                          onChange={(e) => setTimeLimit(Number(e.target.value))}
                          className="rounded border p-1 text-sm"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={30}>30</option>
                          <option value={45}>45</option>
                          <option value={60}>60</option>
                        </select>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={startTest}
                      className="w-full bg-medical-blue hover:bg-medical-navy"
                    >
                      Start Test
                    </Button>
                  </div>
                </div>
              </div>
            ) : testInProgress ? (
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                  
                  <div className="text-sm font-medium">
                    Time Remaining: <span className={timeRemaining < 60 ? "text-red-500" : ""}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
                
                <Progress value={((currentQuestionIndex) / questions.length) * 100} className="h-2" />
                
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-gray-800 mb-4">{currentQuestion.question}</p>
                  
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, optIndex) => {
                      const letters = ["A", "B", "C", "D"];
                      const isSelected = currentAnswer?.selectedOption === option;
                      
                      return (
                        <div 
                          key={optIndex}
                          className={`flex items-start gap-3 p-3 rounded border ${
                            isSelected ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"
                          } cursor-pointer transition-colors hover:bg-gray-100`}
                          onClick={() => handleOptionSelect(option)}
                        >
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
                          }`}>
                            {letters[optIndex]}
                          </div>
                          <div className="flex-1">
                            <p>{option}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  
                  <div className="text-sm">
                    {getUnansweredCount()} question{getUnansweredCount() !== 1 ? 's' : ''} left unanswered
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex < questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                      } else {
                        // Confirm before finishing test
                        if (window.confirm(`Finish the test? ${getUnansweredCount()} questions are unanswered.`)) {
                          finishTest();
                        }
                      }
                    }}
                    className={currentQuestionIndex === questions.length - 1 ? "bg-amber-600 hover:bg-amber-700" : "bg-medical-blue hover:bg-medical-navy"}
                  >
                    {currentQuestionIndex === questions.length - 1 ? "Finish Test" : "Next"}
                  </Button>
                </div>
              </div>
            ) : testComplete ? (
              
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="text-center bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-4">
                      <BarChart className="h-12 w-12 text-medical-blue mx-auto mb-2" />
                      <h2 className="text-2xl font-bold">Test Results</h2>
                      <p>Subtopic: {subtopics.find(s => s.id === selectedSubtopic)?.title}</p>
                    </div>
                    
                    <div className="text-5xl font-bold text-center mb-4 text-medical-blue">
                      {calculateScore()}%
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-50 p-3 rounded border border-green-100">
                        <div className="flex items-center gap-2 justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-lg font-semibold text-green-700">
                            {userAnswers.filter(a => a.isCorrect).length}
                          </span>
                        </div>
                        <p className="text-sm text-green-600">Correct</p>
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded border border-red-100">
                        <div className="flex items-center gap-2 justify-center">
                          <X className="h-5 w-5 text-red-600" />
                          <span className="text-lg font-semibold text-red-700">
                            {userAnswers.filter(a => !a.isCorrect).length}
                          </span>
                        </div>
                        <p className="text-sm text-red-600">Incorrect</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={resetTest}
                      className="w-full bg-medical-blue hover:bg-medical-navy mb-3"
                    >
                      Take Test Again
                    </Button>
                    
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      className="w-full"
                    >
                      Choose Another Topic
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6 mt-8">
                  <h3 className="text-xl font-medium border-b pb-2">Question Review</h3>
                  
                  {questions.map((question, index) => {
                    const userAnswer = getUserAnswer(question.id);
                    const isCorrect = userAnswer?.isCorrect;
                    const isAnswered = !!userAnswer;
                    
                    return (
                      <div 
                        key={question.id} 
                        className={`p-4 rounded-lg border ${
                          isAnswered 
                            ? (isCorrect ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100") 
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isAnswered 
                              ? (isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") 
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium mb-3">{question.question}</p>
                            
                            <div className="space-y-2 mb-4">
                              {question.options.map((option, optIndex) => {
                                const letters = ["A", "B", "C", "D"];
                                const isUserSelection = userAnswer?.selectedOption === option;
                                const isCorrectOption = option === question.correct_answer;
                                
                                let optionClass = "";
                                if (isAnswered) {
                                  if (isCorrectOption) {
                                    optionClass = "bg-green-50 border-green-200 text-green-700";
                                  } else if (isUserSelection) {
                                    optionClass = "bg-red-50 border-red-200 text-red-700";
                                  }
                                }
                                
                                return (
                                  <div 
                                    key={optIndex}
                                    className={`flex items-start gap-3 p-2 rounded border ${optionClass || "bg-white border-gray-200"}`}
                                  >
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                      isUserSelection 
                                        ? (isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") 
                                        : isCorrectOption ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                    }`}>
                                      {letters[optIndex]}
                                    </div>
                                    <div className="flex-1">
                                      <p className={isCorrectOption ? "font-medium" : ""}>
                                        {option}
                                      </p>
                                    </div>
                                    {isUserSelection && (
                                      <div className="flex-shrink-0">
                                        {isCorrect ? (
                                          <Check className="h-5 w-5 text-green-600" />
                                        ) : (
                                          <X className="h-5 w-5 text-red-600" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                              <h4 className="font-medium text-medical-blue mb-1">Explanation:</h4>
                              <p className="text-gray-700 text-sm">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Test;
