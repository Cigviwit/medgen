
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";
import { llamaService, DivisionResult } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";

interface TopicInputProps {
  onSubtopicsGenerated: (result: DivisionResult) => void;
}

const TopicInput = ({ onSubtopicsGenerated }: TopicInputProps) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

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
      onSubtopicsGenerated(result);
      toast({
        title: "Success",
        description: `Divided "${topic}" into ${result.subtopics.length} subtopics`,
      });
    } catch (error) {
      console.error("Failed to divide topic:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to divide the topic",
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
            <CardTitle className="text-xl text-medical-blue">Enter MBBS Topic</CardTitle>
            <CardDescription>
              Agent 1 will divide this into relevant subtopics
            </CardDescription>
          </div>
          <div className="agent-icon">
            <Brain className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Input
            placeholder="e.g., Cardiac Physiology, Renal Pathology, Pharmacology of Antibiotics..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full pulse-border"
            disabled={loading}
          />
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-medical-blue hover:bg-medical-navy"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dividing Topic...
              </>
            ) : (
              "Divide into Subtopics"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TopicInput;
