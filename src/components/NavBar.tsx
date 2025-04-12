
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, BookOpen, GraduationCap, Stethoscope, BookText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const NavBar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Subjects
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {[
                        { title: "Anatomy", icon: Stethoscope },
                        { title: "Physiology", icon: Stethoscope },
                        { title: "Biochemistry", icon: Stethoscope },
                        { title: "Pathology", icon: Stethoscope },
                        { title: "Pharmacology", icon: Stethoscope },
                        { title: "Microbiology", icon: Stethoscope },
                      ].map((subject) => (
                        <li key={subject.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/subjects/${subject.title.toLowerCase()}`}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center gap-2 text-sm font-medium leading-none">
                                <subject.icon className="h-4 w-4" />
                                {subject.title}
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/question-bank" className={navigationMenuTriggerStyle()}>
                    <BookText className="mr-2 h-4 w-4" />
                    Question Bank
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/exams" className={navigationMenuTriggerStyle()}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Mock Exams
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/progress')}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span>My Progress</span>
                </DropdownMenuItem>
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
