
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, BookOpen, Stethoscope } from "lucide-react";
import { llamaService, DivisionResult } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";

interface TopicInputProps {
  onSubtopicsGenerated: (result: DivisionResult, title: string) => void;
}

const medicalSubjects = [
  "Anatomy",
  "Biochemistry",
  "Physiology",
  "Pathology",
  "Pharmacology",
  "Microbiology",
  "Community Medicine",
  "Forensic Medicine",
  "ENT",
  "Ophthalmology",
  "Medicine",
  "Surgery",
  "Obstetrics & Gynecology",
  "Pediatrics",
  "Psychiatry",
  "Dermatology",
  "Orthopedics",
  "Anesthesiology",
  "Radiology",
];

const TopicInput = ({ onSubtopicsGenerated }: TopicInputProps) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubjectClick = (subject: string) => {
    setTopic(subject);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a medical topic",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await llamaService.divideTopicIntoSubtopics(topic);
      
      // Verify result has subtopics array before proceeding
      if (!result || !result.subtopics || !Array.isArray(result.subtopics) || result.subtopics.length === 0) {
        throw new Error("Failed to get valid subtopics from the API");
      }
      
      onSubtopicsGenerated(result, topic);
      toast({
        title: "Success",
        description: `Divided "${topic}" into ${result.subtopics.length} subtopics`,
      });
    } catch (error) {
      console.error("Failed to divide topic:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to divide the topic";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full medical-glass animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-medical-blue flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Enter MBBS Topic
            </CardTitle>
            <CardDescription>
              Our AI will create MCQs based on the selected topic
            </CardDescription>
          </div>
          <div className="agent-icon">
            <Stethoscope className="h-6 w-6 text-medical-teal" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Popular Subjects</div>
          <div className="flex flex-wrap gap-2">
            {medicalSubjects.slice(0, 8).map(subject => (
              <Button 
                key={subject} 
                variant="outline" 
                size="sm" 
                onClick={() => handleSubjectClick(subject)}
                className="text-xs bg-blue-50"
              >
                {subject}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-medical-blue"
              onClick={() => handleSubjectClick("")}
            >
              More...
            </Button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <Input
            placeholder="e.g., Cardiac Physiology, Renal Pathology, Pharmacology of Antibiotics..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full pulse-border"
            disabled={loading}
          />
          <Button 
            type="submit" 
            className="w-full mt-4 bg-medical-blue hover:bg-medical-navy"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating MCQs...
              </>
            ) : (
              "Generate MBBS MCQs"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TopicInput;
