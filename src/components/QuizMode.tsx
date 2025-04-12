
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ArrowRight, ArrowLeft, Check, X, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RefinedQuestions } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";

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

  // Flatten all questions into a single array
  const allQuestions = results.flatMap((result) => 
    result.questions.map((q) => ({ ...q, subtopic: result.subtopic }))
  );

  const currentQuestion = allQuestions[currentQuestionIndex];
  const totalQuestions = allQuestions.length;
  const progress = (Object.keys(answeredQuestions).length / totalQuestions) * 100;
  
  // Generate a unique ID for the current question
  const getCurrentQuestionId = () => {
    return `${currentQuestion.subtopic}-${currentQuestionIndex}`;
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
      toast({
        title: "Quiz Completed",
        description: "You've reached the end of the quiz!",
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

export default QuizMode;
