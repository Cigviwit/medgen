
import { Microscope } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full bg-white border-b border-medical-gray py-4 animate-fade-in">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-medical-blue to-medical-teal p-2 rounded-md">
            <Microscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-medical-blue to-medical-teal bg-clip-text text-transparent">
              MedQuest Alchemy
            </h1>
            <p className="text-xs text-gray-500">MBBS MCQ Generator</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-1">
          <div className="px-3 py-1 text-xs rounded-full bg-medical-light text-medical-blue font-medium animate-pulse-soft">
            ✨ Powered by Llama 4 Maverick
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
