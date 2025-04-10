
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, KeyRound } from "lucide-react";
import { llamaService, DivisionResult } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ApiKeyInput from "@/components/ApiKeyInput";

interface TopicInputProps {
  onSubtopicsGenerated: (result: DivisionResult, title: string) => void;
}

const TopicInput = ({ onSubtopicsGenerated }: TopicInputProps) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

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
    
    // Check if API key is set
    const apiKey = localStorage.getItem("llamaApiKey");
    if (!apiKey || apiKey.trim() === "") {
      toast({
        title: "API Key Required",
        description: "Please set your OpenRouter API key first",
        variant: "destructive",
      });
      setApiKeyDialogOpen(true);
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
      
      // Check if it's a rate limiting error
      const errorMessage = error instanceof Error ? error.message : "Failed to divide the topic";
      if (errorMessage.includes("Rate limit") || errorMessage.includes("429")) {
        toast({
          title: "API Rate Limit Exceeded",
          description: "Please upgrade your OpenRouter account or try again later",
          variant: "destructive",
        });
      } else if (errorMessage.includes("undefined")) {
        toast({
          title: "API Error",
          description: "The API returned an invalid response. Please check your API key and try again.",
          variant: "destructive",
        });
        setApiKeyDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          <CardFooter className="flex flex-col gap-2">
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
            
            <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => setApiKeyDialogOpen(true)}
                >
                  <KeyRound className="h-4 w-4" />
                  Set/Update API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>API Key Settings</DialogTitle>
                </DialogHeader>
                <ApiKeyInput onKeySet={() => setApiKeyDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardFooter>
        </form>
      </Card>
    </>
  );
};

export default TopicInput;
