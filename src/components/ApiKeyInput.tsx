
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, CheckCircle, RefreshCw } from "lucide-react";
import { llamaService } from "@/services/llamaService";
import { toast } from "@/hooks/use-toast";

interface ApiKeyInputProps {
  onKeySet: () => void;
}

const ApiKeyInput = ({ onKeySet }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isSet, setIsSet] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

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
    setIsChanging(false);
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
    llamaService.setApiKey("");
    toast({
      title: "API Key Removed",
      description: "Your API key has been cleared",
    });
  };

  const handleChange = () => {
    setIsChanging(true);
  };

  if (isSet && !isChanging) {
    return (
      <Card className="w-full max-w-md mx-auto medical-glass animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-medical-blue flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            API Key Set
          </CardTitle>
          <CardDescription>
            Your OpenRouter API key has been saved
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleChange}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Change Key
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 hover:bg-red-50 hover:text-red-600 transition-colors" 
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
          {isChanging ? "Change API Key" : "Enter API Key"}
        </CardTitle>
        <CardDescription>
          Please enter your OpenRouter API key to use Meta Llama 4 Maverick
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
        <CardFooter className="flex gap-2">
          {isChanging && (
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsChanging(false)}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            className="flex-1 bg-medical-blue hover:bg-medical-navy"
          >
            Save API Key
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ApiKeyInput;
