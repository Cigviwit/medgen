
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavBar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="border-b border-medical-gray py-2">
      <div className="container flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors hover:text-medical-blue ${
              location.pathname === "/" ? "text-medical-blue" : "text-gray-600"
            }`}
          >
            Home
          </Link>
          
          {user && (
            <>
              <Link 
                to="/practice" 
                className={`text-sm font-medium transition-colors hover:text-medical-blue ${
                  location.pathname === "/practice" ? "text-medical-blue" : "text-gray-600"
                }`}
              >
                Practice Mode
              </Link>
              <Link 
                to="/test" 
                className={`text-sm font-medium transition-colors hover:text-medical-blue ${
                  location.pathname === "/test" ? "text-medical-blue" : "text-gray-600"
                }`}
              >
                Test Mode
              </Link>
            </>
          )}
        </div>
        
        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.email?.split('@')[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
