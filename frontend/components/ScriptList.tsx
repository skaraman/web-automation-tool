import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Edit, Trash2, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { formatDistanceToNow } from "date-fns";

export function ScriptList() {
  const { toast } = useToast();

  const { data: scriptsData, isLoading, refetch } = useQuery({
    queryKey: ["scripts"],
    queryFn: () => backend.automation.listScripts(),
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await backend.automation.deleteScript({ id });
      toast({
        title: "Script deleted",
        description: `"${name}" has been deleted successfully.`,
      });
      refetch();
    } catch (error) {
      console.error("Failed to delete script:", error);
      toast({
        title: "Error",
        description: "Failed to delete script. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExecute = async (id: number, name: string) => {
    try {
      const result = await backend.automation.executeScript({ id });
      toast({
        title: "Script execution started",
        description: `"${name}" is now running. Execution ID: ${result.executionId}`,
      });
    } catch (error) {
      console.error("Failed to execute script:", error);
      toast({
        title: "Error",
        description: "Failed to execute script. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading scripts...</div>
      </div>
    );
  }

  const scripts = scriptsData?.scripts || [];

  if (scripts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No automation scripts found</div>
        <Button asChild>
          <Link to="/scripts/new">Create your first script</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Automation Scripts</h2>
        <Badge variant="secondary">{scripts.length} scripts</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {scripts.map((script) => {
          // Ensure steps is always an array
          const steps = Array.isArray(script.steps) ? script.steps : [];
          
          return (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{script.name}</CardTitle>
                    {script.description && (
                      <CardDescription className="mt-1">
                        {script.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDistanceToNow(new Date(script.updatedAt), { addSuffix: true })}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {steps.length} step{steps.length !== 1 ? 's' : ''}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleExecute(script.id, script.name)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/scripts/${script.id}`}>
                        View
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/scripts/${script.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(script.id, script.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
