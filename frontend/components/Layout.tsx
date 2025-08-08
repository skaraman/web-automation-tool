import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, Plus, Home, Camera, History } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">WebBot</h1>
              </Link>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                asChild
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Scripts
                </Link>
              </Button>

              <Button
                variant={location.pathname === "/screenshots" ? "default" : "ghost"}
                asChild
              >
                <Link to="/screenshots">
                  <Camera className="h-4 w-4 mr-2" />
                  Screenshots
                </Link>
              </Button>

              <Button
                variant={location.pathname === "/executions" ? "default" : "ghost"}
                asChild
              >
                <Link to="/executions">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Link>
              </Button>
              
              <Button asChild>
                <Link to="/scripts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Script
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
