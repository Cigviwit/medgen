
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ArrowRight, ArrowLeft, Check, X, RotateCcw, BarChart, Zap, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RefinedQuestions } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizModeProps {
  results: RefinedQuestions[];
  onExit: () => void;
}

const QuizMode = ({ results, onExit }: QuizModeProps) => {
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Flatten all questions into a single array
  const allQuestions = results.flatMap((result) => 
    result.questions.map((q) => ({ ...q, subtopic: result.subtopic }))
  );

  const currentQuestion = allQuestions[currentQuestionIndex];
  const totalQuestions = allQuestions.length;
  const progress = (Object.keys(answeredQuestions).length / totalQuestions) * 100;
  
  // Calculate summary statistics
  const correctAnswers = Object.values(answeredQuestions).filter(Boolean).length;
  const incorrectAnswers = Object.keys(answeredQuestions).length - correctAnswers;
  const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  // Generate a unique ID for the current question
  const getCurrentQuestionId = () => {
    return `${currentQuestion?.subtopic}-${currentQuestionIndex}`;
  };

  const handleOptionSelect = (option: string) => {
    if (!isAnswerRevealed) {
      setSelectedOption(option);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) {
      toast({
        title: "Please select an option",
        description: "You need to select an answer before checking",
      });
      return;
    }

    setIsAnswerRevealed(true);
    setShowExplanation(true);
    
    // Mark this question as answered
    const questionId = getCurrentQuestionId();
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: selectedOption === currentQuestion.correctAnswer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetQuestionState();
    } else {
      // Set quiz as completed when all questions are finished
      setQuizCompleted(true);
      toast({
        title: "Quiz Completed",
        description: "Review your performance in the summary",
      });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      resetQuestionState();
    }
  };

  const resetQuestionState = () => {
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setShowExplanation(false);
    setShowHints(false);
  };

  const resetCurrentQuestion = () => {
    // Remove this question from answered questions if it exists
    const questionId = getCurrentQuestionId();
    setAnsweredQuestions(prev => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
    resetQuestionState();
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnsweredQuestions({});
    setQuizCompleted(false);
    resetQuestionState();
  };

  // Function to get the status of a specific question
  const getQuestionStatus = (index: number) => {
    const question = allQuestions[index];
    if (!question) return "unanswered";
    
    const questionId = `${question.subtopic}-${index}`;
    if (!(questionId in answeredQuestions)) return "unanswered";
    
    return answeredQuestions[questionId] ? "correct" : "incorrect";
  };

  if (!currentQuestion) {
    return (
      <Card className="w-full medical-glass animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl text-medical-blue">No Questions Available</CardTitle>
          <CardDescription>
            Please generate some questions first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onExit}>Return to Generation</Button>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    return (
      <Card className="w-full medical-glass animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-medical-blue">Quiz Completed</CardTitle>
              <CardDescription>
                Review your performance on this quiz
              </CardDescription>
            </div>
            <div className="agent-icon">
              <BarChart className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <PieChart className="h-8 w-8 text-medical-blue mb-2" />
                  <h3 className="text-xl font-bold text-medical-navy">{scorePercentage.toFixed(1)}%</h3>
                  <p className="text-sm text-gray-500">Overall Score</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <Check className="h-8 w-8 text-green-500 mb-2" />
                  <h3 className="text-xl font-bold text-green-700">{correctAnswers}</h3>
                  <p className="text-sm text-gray-500">Correct Answers</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <X className="h-8 w-8 text-red-500 mb-2" />
                  <h3 className="text-xl font-bold text-red-700">{incorrectAnswers}</h3>
                  <p className="text-sm text-gray-500">Incorrect Answers</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Question Review */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full bg-medical-light justify-start mb-4">
              <TabsTrigger value="all" className="flex-1">All Questions</TabsTrigger>
              <TabsTrigger value="correct" className="flex-1">Correct</TabsTrigger>
              <TabsTrigger value="incorrect" className="flex-1">Incorrect</TabsTrigger>
              <TabsTrigger value="unanswered" className="flex-1">Unanswered</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="space-y-4">
                {allQuestions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <QuestionReviewCard 
                      key={index}
                      question={question}
                      questionNumber={index + 1}
                      status={status}
                      selectedAnswer={
                        status !== "unanswered" 
                          ? allQuestions[index].options.find(
                              (_, optIndex) => allQuestions[index].options[optIndex] === answeredQuestions[`${question.subtopic}-${index}`]
                            ) 
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="correct" className="mt-0">
              <div className="space-y-4">
                {allQuestions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  if (status === "correct") {
                    return (
                      <QuestionReviewCard 
                        key={index}
                        question={question}
                        questionNumber={index + 1}
                        status={status}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="incorrect" className="mt-0">
              <div className="space-y-4">
                {allQuestions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  if (status === "incorrect") {
                    return (
                      <QuestionReviewCard 
                        key={index}
                        question={question}
                        questionNumber={index + 1}
                        status={status}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="unanswered" className="mt-0">
              <div className="space-y-4">
                {allQuestions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  if (status === "unanswered") {
                    return (
                      <QuestionReviewCard 
                        key={index}
                        question={question}
                        questionNumber={index + 1}
                        status={status}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-2 pt-4 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleRestartQuiz}
              className="flex-1 bg-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart Quiz
            </Button>
            
            <Button 
              onClick={onExit}
              className="flex-1 bg-medical-blue hover:bg-medical-navy"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate New Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full medical-glass animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-medical-blue">Quiz Mode</CardTitle>
            <CardDescription>
              {currentQuestion.subtopic} - Question {currentQuestionIndex + 1} of {totalQuestions}
            </CardDescription>
          </div>
          <div className="agent-icon">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}% ({Object.keys(answeredQuestions).length}/{totalQuestions})</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-medical-navy mb-2">Question {currentQuestionIndex + 1}:</h3>
            <p className="text-gray-800">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <h3 className="font-medium text-medical-navy">Select your answer:</h3>
            <RadioGroup value={selectedOption || ""} className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const letters = ["A", "B", "C", "D"];
                const isCorrect = option === currentQuestion.correctAnswer;
                const isSelected = option === selectedOption;
                
                return (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded transition-colors ${
                      isAnswerRevealed && isSelected
                        ? isCorrect
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                        : isSelected
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                    }`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${index}`}
                      disabled={isAnswerRevealed}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex gap-2 items-center">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isAnswerRevealed && isCorrect
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}>
                          {letters[index]}
                        </div>
                        <label 
                          htmlFor={`option-${index}`} 
                          className={`flex-1 cursor-pointer ${
                            isAnswerRevealed && isCorrect ? "font-medium text-green-700" : ""
                          }`}
                        >
                          {option}
                        </label>
                        {isAnswerRevealed && isCorrect && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                        {isAnswerRevealed && isSelected && !isCorrect && (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fade-in">
              <h3 className="font-medium text-medical-blue mb-2">Explanation:</h3>
              <p className="text-gray-700">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Options */}
          <div className="flex gap-2 pt-4 flex-wrap">
            <div className="flex-1 flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="bg-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={resetCurrentQuestion}
                className="bg-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <div className="flex gap-2">
              {!isAnswerRevealed ? (
                <Button 
                  onClick={handleCheckAnswer}
                  disabled={!selectedOption}
                  className="bg-medical-blue hover:bg-medical-navy"
                >
                  Check Answer
                </Button>
              ) : (
                <Button 
                  onClick={handleNextQuestion}
                  className="bg-medical-blue hover:bg-medical-navy"
                >
                  Next Question
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={onExit}
              className="text-medical-blue"
            >
              Exit Quiz
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Question Review Card Component
interface QuestionReviewCardProps {
  question: any;
  questionNumber: number;
  status: "correct" | "incorrect" | "unanswered";
  selectedAnswer?: string;
}

const QuestionReviewCard = ({ question, questionNumber, status, selectedAnswer }: QuestionReviewCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const statusColors = {
    correct: "bg-green-50 border-green-200",
    incorrect: "bg-red-50 border-red-200",
    unanswered: "bg-gray-50 border-gray-200"
  };
  
  const statusIcons = {
    correct: <Check className="h-5 w-5 text-green-600" />,
    incorrect: <X className="h-5 w-5 text-red-600" />,
    unanswered: <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200">Not Attempted</Badge>
  };
  
  return (
    <div className={`rounded-lg p-4 ${statusColors[status]} transition-all`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">Q{questionNumber}:</span>
          <span className="text-sm text-gray-500">{question.subtopic}</span>
        </div>
        <div>
          {statusIcons[status]}
        </div>
      </div>
      
      <div className="mb-3">{question.question}</div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-center mb-2 bg-white"
      >
        {expanded ? "Hide Details" : "Show Details"}
      </Button>
      
      {expanded && (
        <div className="mt-3 space-y-3 pt-3 border-t border-gray-200">
          <div className="space-y-2">
            {question.options.map((option: string, index: number) => {
              const letters = ["A", "B", "C", "D"];
              const isCorrect = option === question.correctAnswer;
              const isSelected = option === selectedAnswer;
              
              return (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-2 rounded ${
                    isCorrect
                      ? "bg-green-50"
                      : isSelected && !isCorrect
                      ? "bg-red-50"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex gap-2 items-center flex-1">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isCorrect
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {letters[index]}
                    </div>
                    <span className={isCorrect ? "font-medium text-green-700" : ""}>
                      {option}
                    </span>
                    {isCorrect && (
                      <Check className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                    {isSelected && !isCorrect && (
                      <X className="h-4 w-4 text-red-500 ml-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h4 className="font-medium text-medical-blue mb-1">Explanation:</h4>
            <p className="text-gray-700 text-sm">{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizMode;
