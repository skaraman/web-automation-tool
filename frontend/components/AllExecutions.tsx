import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { formatDistanceToNow, format } from "date-fns";

export function AllExecutions() {
  const [page, setPage] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  const { data: executionsData, isLoading, refetch } = useQuery({
    queryKey: ["allExecutions", page],
    queryFn: () => backend.automation.listExecutions({ 
      limit: limit * 10 // Get more for pagination simulation
    }),
    refetchInterval: 5000,
  });

  const handleClearAllHistory = async () => {
    if (!confirm("Are you sure you want to clear ALL execution history? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await backend.automation.clearExecutions({});
      toast({
        title: "All history cleared",
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading executions...</div>
      </div>
    );
  }

  const allExecutions = executionsData?.executions || [];
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const executions = allExecutions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allExecutions.length / limit);

  if (allExecutions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No executions found</div>
        <p className="text-sm text-gray-400">Execution history will appear here after running automation scripts</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader className="h-4 w-4 animate-spin text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Execution History</h2>
          <p className="text-gray-600">{allExecutions.length} execution{allExecutions.length !== 1 ? 's' : ''} total</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {allExecutions.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAllHistory}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All History
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {executions.map((execution) => (
          <Card key={execution.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <CardTitle className="text-lg">Execution #{execution.id}</CardTitle>
                    <p className="text-sm text-gray-600">Script ID: {execution.scriptId}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(execution.status)}>
                  {execution.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Started:</span>
                  <div className="text-gray-600 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {format(new Date(execution.startedAt), "PPpp")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                  </div>
                </div>
                
                {execution.completedAt && (
                  <div>
                    <span className="font-medium text-gray-900">Completed:</span>
                    <div className="text-gray-600 flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(execution.completedAt), "PPpp")}
                    </div>
                    <div className="text-xs text-gray-500">
                      Duration: {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s
                    </div>
                  </div>
                )}
              </div>

              {execution.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{execution.errorMessage}</p>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to={`/executions/${execution.id}`}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Details
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="flex-1">
                  <Link to={`/scripts/${execution.scriptId}`}>
                    View Script
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-600 px-4">
              Page {page + 1} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
