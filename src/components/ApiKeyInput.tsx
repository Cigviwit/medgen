
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, CheckCircle } from "lucide-react";
import { llamaService } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";

interface ApiKeyInputProps {
  onKeySet: () => void;
}

const ApiKeyInput = ({ onKeySet }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isSet, setIsSet] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("llamaApiKey");
    if (savedKey && savedKey.trim() !== "") {
      setIsSet(true);
      llamaService.setApiKey(savedKey);
    } else {
      // Clear API key if it's empty or not set
      setIsSet(false);
      localStorage.removeItem("llamaApiKey");
      llamaService.setApiKey("");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("llamaApiKey", apiKey);
    llamaService.setApiKey(apiKey);
    setIsSet(true);
    toast({
      title: "Success",
      description: "API key has been set",
    });
    onKeySet();
  };

  if (isSet) {
    return (
      <Card className="w-full max-w-md mx-auto medical-glass animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-medical-blue flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Configuration Complete
          </CardTitle>
          <CardDescription>
            You're ready to generate MBBS MCQs
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            className="w-full bg-medical-blue hover:bg-medical-navy"
            onClick={onKeySet}
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto medical-glass animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl text-medical-blue flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Welcome to MedQuest
        </CardTitle>
        <CardDescription>
          Enter your API key to start generating MBBS MCQs
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Input
            type="password"
            placeholder="sk-or-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full pulse-border"
          />
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-medical-blue hover:bg-medical-navy"
          >
            Start Using MedQuest
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ApiKeyInput;
