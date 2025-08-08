import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, ExternalLink, Download, ChevronLeft, ChevronRight } from "lucide-react";
import backend from "~backend/client";
import { format } from "date-fns";

export function ScreenshotGallery() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: screenshotsData, isLoading } = useQuery({
    queryKey: ["allScreenshots", page],
    queryFn: () => backend.automation.listAllScreenshots({ 
      limit: limit,
      offset: page * limit 
    }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading screenshots...</div>
      </div>
    );
  }

  const screenshots = screenshotsData?.screenshots || [];
  const total = screenshotsData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 mb-4">No screenshots found</div>
        <p className="text-sm text-gray-400">Screenshots will appear here after running automation scripts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Screenshots</h2>
          <p className="text-gray-600">{total} screenshot{total !== 1 ? 's' : ''} total</p>
        </div>
        
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {screenshots.map((screenshot) => (
          <ScreenshotCard key={screenshot.id} screenshot={screenshot} />
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

interface ScreenshotCardProps {
  screenshot: {
    id: number;
    executionId: number;
    scriptId: number;
    scriptName: string;
    stepNumber: number;
    filename: string;
    url: string;
    createdAt: string;
  };
}

function ScreenshotCard({ screenshot }: ScreenshotCardProps) {
  const { data: screenshotData } = useQuery({
    queryKey: ["screenshot", screenshot.id],
    queryFn: () => backend.automation.getScreenshot({ id: screenshot.id }),
  });

  const screenshotUrl = screenshotData ? `data:${screenshotData.contentType};base64,${screenshotData.data}` : null;

  const handleDownload = () => {
    if (!screenshotData) return;
    
    const link = document.createElement('a');
    link.href = `data:${screenshotData.contentType};base64,${screenshotData.data}`;
    link.download = screenshotData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Step {screenshot.stepNumber}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {screenshot.scriptName}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="rounded-lg overflow-hidden border">
          {screenshotUrl ? (
            <img 
              src={screenshotUrl} 
              alt={`Step ${screenshot.stepNumber} screenshot`}
              className="w-full h-48 object-cover bg-gray-50"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="bg-gray-100 rounded-lg p-8 text-center h-48 flex items-center justify-center">
                      <div class="text-sm text-gray-500">Failed to load screenshot</div>
                    </div>
                  `;
                }
              }}
            />
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center h-48 flex items-center justify-center">
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            {format(new Date(screenshot.createdAt), "PPpp")}
          </div>
          
          <div className="flex space-x-2">
            {screenshotUrl && (
              <>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" asChild className="flex-1 text-xs">
              <Link to={`/scripts/${screenshot.scriptId}`}>
                View Script
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="flex-1 text-xs">
              <Link to={`/executions/${screenshot.executionId}`}>
                View Execution
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
