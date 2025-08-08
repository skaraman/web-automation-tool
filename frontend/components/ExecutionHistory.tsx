import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { formatDistanceToNow } from "date-fns";

interface ExecutionHistoryProps {
  scriptId?: number;
  limit?: number;
  showClearButton?: boolean;
}

export function ExecutionHistory({ scriptId, limit = 10, showClearButton = false }: ExecutionHistoryProps) {
  const { toast } = useToast();

  const { data: executionsData, isLoading, refetch } = useQuery({
    queryKey: ["executions", scriptId],
    queryFn: () => backend.automation.listExecutions({ 
      scriptId: scriptId,
      limit: limit 
    }),
    refetchInterval: 5000, // Refresh every 5 seconds to show live updates
  });

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear the execution history? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await backend.automation.clearExecutions({ scriptId });
      toast({
        title: "History cleared",
        description: `${result.deletedCount} execution${result.deletedCount !== 1 ? 's' : ''} deleted successfully.`,
      });
      refetch();
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast({
        title: "Error",
        description: "Failed to clear execution history. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading executions...</div>;
  }

  const executions = executionsData?.executions || [];

  if (executions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No executions yet
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-3">
      {showClearButton && executions.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear History
          </Button>
        </div>
      )}

      {executions.map((execution) => (
        <div key={execution.id} className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <Badge className={getStatusColor(execution.status)}>
              {execution.status}
            </Badge>
            <div className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
            </div>
          </div>
          
          {execution.errorMessage && (
            <div className="text-xs text-red-600 mb-2">
              {execution.errorMessage}
            </div>
          )}
          
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link to={`/executions/${execution.id}`}>
              View Details
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
