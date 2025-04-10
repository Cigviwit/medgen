
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefinedQuestions } from "@/services/llamaService";
import { BookOpen, ClipboardCheck, ArrowLeft, ArrowRight, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizModeProps {
  results: RefinedQuestions[];
  mode: "practice" | "test";
  activeSubtopic: string;
  onChangeSubtopic: (subtopic: string) => void;
}

interface Question {
  subtopic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const QuizMode = ({ results, mode, activeSubtopic, onChangeSubtopic }: QuizModeProps) => {
  const [flatQuestions, setFlatQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Flatten all questions or just the active subtopic
  useEffect(() => {
    const questions: Question[] = [];
    
    results.forEach(result => {
      if (activeSubtopic === "all" || result.subtopic === activeSubtopic) {
        result.questions.forEach(q => {
          questions.push({
            subtopic: result.subtopic,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          });
        });
      }
    });
    
    setFlatQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsAnswered(false);
    setShowResults(false);
  }, [results, activeSubtopic]);
  
  const currentQuestion = flatQuestions[currentQuestionIndex];
  
  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
    
    if (mode === "practice") {
      setIsAnswered(true);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < flatQuestions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setIsAnswered(false);
    } else if (mode === "test" && !showResults) {
      // In test mode, show results when reaching the end
      setShowResults(true);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      setIsAnswered(mode === "practice" && !!selectedAnswers[currentQuestionIndex - 1]);
    }
  };
  
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsAnswered(false);
    setShowResults(false);
  };
  
  const calculateScore = () => {
    let correctCount = 0;
    
    Object.entries(selectedAnswers).forEach(([indexStr, answer]) => {
      const index = parseInt(indexStr);
      if (flatQuestions[index] && flatQuestions[index].correctAnswer === answer) {
        correctCount++;
      }
    });
    
    return {
      correct: correctCount,
      total: flatQuestions.length,
      percentage: flatQuestions.length > 0 
        ? Math.round((correctCount / flatQuestions.length) * 100) 
        : 0
    };
  };
  
  const score = calculateScore();
  
  const getSubtopicsList = () => {
    const subtopics = results.map(r => r.subtopic);
    return ["all", ...subtopics];
  };
  
  if (!currentQuestion && flatQuestions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p>No questions available for the selected subtopic. Please select another subtopic.</p>
        <Tabs value={activeSubtopic} onValueChange={onChangeSubtopic} className="mt-4">
          <TabsList className="w-full flex-wrap">
            {getSubtopicsList().map((subtopic) => (
              <TabsTrigger key={subtopic} value={subtopic}>
                {subtopic === "all" ? "All Subtopics" : subtopic}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Card>
    );
  }
  
  if (showResults) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-medical-blue">Quiz Results</h2>
            <div className="mt-4 text-lg">
              <p>You scored <span className="font-bold text-medical-blue">{score.correct} out of {score.total}</span></p>
              <p className="text-2xl font-bold mt-2" style={{ 
                color: score.percentage >= 70 ? "green" : score.percentage >= 50 ? "orange" : "red" 
              }}>
                {score.percentage}%
              </p>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={resetQuiz} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart Quiz
              </Button>
            </div>
          </div>
        </Card>
        
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-medical-navy">Question Review</h3>
          
          {flatQuestions.map((question, index) => {
            const selectedAnswer = selectedAnswers[index] || "";
            const isCorrect = selectedAnswer === question.correctAnswer;
            const isAnswered = !!selectedAnswer;
            
            return (
              <Card key={index} className={cn(
                "border overflow-hidden",
                isAnswered && (isCorrect ? "border-green-300" : "border-red-300")
              )}>
                <div className={cn(
                  "py-2 px-4 text-sm font-medium",
                  isAnswered && (isCorrect ? "bg-green-50" : "bg-red-50")
                )}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>Question {index + 1}</span>
                      {isAnswered && (
                        isCorrect ? 
                          <Check className="h-4 w-4 text-green-600" /> : 
                          <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <Badge variant="outline">{question.subtopic}</Badge>
                  </div>
                </div>
                
                <CardContent className="p-4 space-y-4">
                  <p className="font-medium">{question.question}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const letters = ["A", "B", "C", "D"];
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption = option === question.correctAnswer;
                      
                      let optionClass = "border border-gray-200 bg-gray-50";
                      if (isSelected && isCorrectOption) optionClass = "border-green-300 bg-green-50";
                      else if (isSelected && !isCorrectOption) optionClass = "border-red-300 bg-red-50";
                      else if (!isSelected && isCorrectOption) optionClass = "border-green-300 bg-green-50/40";
                      
                      return (
                        <div 
                          key={optIndex}
                          className={`flex items-start gap-3 p-3 rounded ${optionClass}`}
                        >
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                            isSelected ? (isCorrectOption ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800") :
                            isCorrectOption ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                          )}>
                            {letters[optIndex]}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              isSelected ? (isCorrectOption ? "text-green-800" : "text-red-800") :
                              isCorrectOption ? "text-green-800" : ""
                            )}>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {mode === "practice" ? (
            <BookOpen className="h-5 w-5 text-medical-blue" />
          ) : (
            <ClipboardCheck className="h-5 w-5 text-medical-blue" />
          )}
          <h3 className="text-lg font-medium text-medical-navy">
            {mode === "practice" ? "Practice Mode" : "Test Mode"}
          </h3>
        </div>
        
        <Badge variant="outline" className="text-sm">
          {currentQuestionIndex + 1} of {flatQuestions.length}
        </Badge>
      </div>
      
      <Tabs value={activeSubtopic} onValueChange={onChangeSubtopic} className="w-full">
        <TabsList className="w-full h-auto flex flex-wrap gap-2 bg-medical-light justify-start overflow-x-auto">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-medical-blue data-[state=active]:text-white px-3 py-1.5 text-xs sm:text-sm"
          >
            All Subtopics
          </TabsTrigger>
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
      </Tabs>
      
      <Card className="p-6 space-y-6">
        <div>
          <Badge variant="outline" className="mb-2">{currentQuestion.subtopic}</Badge>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
          
          <RadioGroup 
            value={selectedAnswers[currentQuestionIndex] || ""}
            onValueChange={handleSelectAnswer}
            className="space-y-3"
            disabled={isAnswered}
          >
            {currentQuestion.options.map((option, index) => {
              const letters = ["A", "B", "C", "D"];
              const isSelected = selectedAnswers[currentQuestionIndex] === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              
              let optionClass = "border border-gray-200 bg-white hover:bg-gray-50";
              if (isAnswered) {
                if (isSelected && isCorrect) optionClass = "border-green-300 bg-green-50";
                else if (isSelected && !isCorrect) optionClass = "border-red-300 bg-red-50";
                else if (!isSelected && isCorrect) optionClass = "border-green-300 bg-green-50/40";
              } else if (isSelected) {
                optionClass = "border-blue-300 bg-blue-50";
              }
              
              return (
                <label 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded cursor-pointer ${optionClass}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-700">
                      {letters[index]}
                    </div>
                    <div className="flex-1">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${index}`} 
                        className="sr-only"
                      />
                      <span>{option}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </div>
        
        {isAnswered && mode === "practice" && (
          <div className="bg-blue-50 p-4 rounded border border-blue-100">
            <h4 className="font-medium text-medical-blue mb-2">Explanation:</h4>
            <p className="text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button 
            onClick={handlePrevQuestion} 
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {mode === "test" && currentQuestionIndex === flatQuestions.length - 1 && !showResults && (
              <Button onClick={() => setShowResults(true)} className="bg-medical-blue hover:bg-medical-navy">
                Finish Test
              </Button>
            )}
            
            <Button 
              onClick={handleNextQuestion} 
              disabled={(mode === "practice" && !isAnswered && !selectedAnswers[currentQuestionIndex]) || 
                       (currentQuestionIndex === flatQuestions.length - 1 && showResults)}
              className={!isAnswered ? "bg-medical-blue hover:bg-medical-navy" : ""}
            >
              {currentQuestionIndex < flatQuestions.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuizMode;
