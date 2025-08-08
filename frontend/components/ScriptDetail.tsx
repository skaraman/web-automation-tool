import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Edit, ArrowLeft, Clock, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ExecutionHistory } from "./ExecutionHistory";
import backend from "~backend/client";
import { formatDistanceToNow } from "date-fns";

export function ScriptDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: script, isLoading } = useQuery({
    queryKey: ["script", id],
    queryFn: () => backend.automation.getScript({ id: parseInt(id!) }),
    enabled: Boolean(id),
  });

  const handleExecute = async () => {
    if (!script) return;

    try {
      const result = await backend.automation.executeScript({ id: script.id });
      toast({
        title: "Script execution started",
        description: `"${script.name}" is now running. Execution ID: ${result.executionId}`,
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
        <div className="text-gray-500">Loading script...</div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Script not found</div>
        <Button asChild>
          <Link to="/">Back to Scripts</Link>
        </Button>
      </div>
    );
  }

  // Ensure steps is always an array
  const steps = Array.isArray(script.steps) ? script.steps : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{script.name}</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link to={`/scripts/${script.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button onClick={handleExecute}>
            <Play className="h-4 w-4 mr-2" />
            Run Script
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Script Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {script.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{script.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Created:</span>
                  <div className="text-gray-600 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDistanceToNow(new Date(script.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Last Updated:</span>
                  <div className="text-gray-600 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDistanceToNow(new Date(script.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automation Steps</CardTitle>
              <CardDescription>
                {steps.length} step{steps.length !== 1 ? 's' : ''} defined
              </CardDescription>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No steps defined yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Badge variant="outline" className="mt-0.5">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium capitalize">
                          {step.action.replace('_', ' ')}
                        </div>
                        {step.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </div>
                        )}
                        {step.selector && (
                          <div className="text-xs text-gray-500 mt-1">
                            {step.selectorType}: {step.selector}
                          </div>
                        )}
                        {step.value && (
                          <div className="text-xs text-gray-500 mt-1">
                            Value: {step.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Execution History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExecutionHistory scriptId={script.id} showClearButton={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
