
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
    if (savedKey) {
      setIsSet(true);
      llamaService.setApiKey(savedKey);
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
    
    llamaService.setApiKey(apiKey);
    setIsSet(true);
    toast({
      title: "Success",
      description: "API key has been set",
    });
    onKeySet();
  };

  const handleReset = () => {
    localStorage.removeItem("llamaApiKey");
    setApiKey("");
    setIsSet(false);
    toast({
      title: "API Key Removed",
      description: "Your API key has been cleared",
    });
  };

  if (isSet) {
    return (
      <Card className="w-full max-w-md mx-auto medical-glass animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-medical-blue flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            API Key Set
          </CardTitle>
          <CardDescription>
            Your Llama API key has been saved
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full hover:bg-red-50 hover:text-red-600 transition-colors" 
            onClick={handleReset}
          >
            Reset API Key
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
          Enter API Key
        </CardTitle>
        <CardDescription>
          Please enter your Meta Llama 4 Maverick API key from Replicate
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Input
            type="password"
            placeholder="r8_xxxx..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full pulse-border"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-medical-blue hover:bg-medical-navy">
            Save API Key
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ApiKeyInput;
