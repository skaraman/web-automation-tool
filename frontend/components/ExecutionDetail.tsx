import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader, Camera, AlertCircle, ExternalLink, Download } from "lucide-react";
import backend from "~backend/client";
import { formatDistanceToNow, format } from "date-fns";

export function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: execution, isLoading } = useQuery({
    queryKey: ["execution", id],
    queryFn: () => backend.automation.getExecution({ id: parseInt(id!) }),
    enabled: Boolean(id),
    refetchInterval: (data) => {
      // Stop refetching if execution is completed or failed
      return data?.status === "running" ? 2000 : false;
    },
  });

  const { data: screenshots } = useQuery({
    queryKey: ["screenshots", id],
    queryFn: () => backend.automation.listScreenshots({ executionId: parseInt(id!) }),
    enabled: Boolean(id) && execution?.status !== "running",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading execution details...</div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Execution not found</div>
        <Button asChild>
          <Link to="/">Back to Scripts</Link>
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader className="h-5 w-5 animate-spin text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Execution #{execution.id}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                {getStatusIcon(execution.status)}
                <span>Execution Status</span>
                <Badge className={getStatusColor(execution.status)}>
                  {execution.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <h4 className="font-medium text-red-900 mb-1">Error Message</h4>
                  <p className="text-red-700 text-sm">{execution.errorMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {execution.result && (
            <Card>
              <CardHeader>
                <CardTitle>Execution Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ExecutionResults result={execution.result} screenshots={screenshots?.screenshots} />
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Script Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Script ID:</span>
                  <div className="text-gray-600">#{execution.scriptId}</div>
                </div>
                
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/scripts/${execution.scriptId}`}>
                    View Script Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface ExecutionResultsProps {
  result: any;
  screenshots?: any[];
}

function ExecutionResults({ result, screenshots }: ExecutionResultsProps) {
  if (!result) return null;

  return (
    <Tabs defaultValue="steps" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="steps">Step Results</TabsTrigger>
        <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
        <TabsTrigger value="data">Extracted Data</TabsTrigger>
        <TabsTrigger value="logs">Execution Log</TabsTrigger>
      </TabsList>

      <TabsContent value="steps" className="space-y-4">
        {result.stepResults && result.stepResults.length > 0 ? (
          <div className="space-y-4">
            {result.stepResults.map((stepResult: any, index: number) => (
              <StepResultCard key={stepResult.stepId} stepResult={stepResult} stepNumber={index + 1} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No step results available
          </div>
        )}
      </TabsContent>

      <TabsContent value="screenshots" className="space-y-4">
        {screenshots && screenshots.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''} captured
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {screenshots.map((screenshot, index) => (
                <ScreenshotCard key={screenshot.id} screenshot={screenshot} index={index} />
              ))}
            </div>
          </div>
        ) : result.screenshots && result.screenshots.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {result.screenshots.map((screenshot: string, index: number) => (
              <LegacyScreenshotCard key={index} screenshot={screenshot} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No screenshots captured
          </div>
        )}
      </TabsContent>

      <TabsContent value="data" className="space-y-4">
        {result.extractedData && Object.keys(result.extractedData).length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(result.extractedData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No data extracted
          </div>
        )}
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        {result.logs && result.logs.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {result.logs.map((log: string, index: number) => (
              <div key={index} className="text-sm text-gray-700 font-mono py-1">
                <span className="text-gray-400 mr-2">{String(index + 1).padStart(3, '0')}:</span>
                {log}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No logs available
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

interface ScreenshotCardProps {
  screenshot: {
    id: number;
    stepNumber: number;
    filename: string;
    url: string;
    createdAt: string;
  };
  index: number;
}

function ScreenshotCard({ screenshot, index }: ScreenshotCardProps) {
  // Fetch the actual screenshot data
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
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Camera className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">
            Step {screenshot.stepNumber} Screenshot
          </span>
        </div>
        <div className="flex space-x-2">
          {screenshotUrl && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="rounded-lg overflow-hidden border">
        {screenshotUrl ? (
          <img 
            src={screenshotUrl} 
            alt={`Step ${screenshot.stepNumber} screenshot`}
            className="w-full h-auto max-h-64 object-contain bg-gray-50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="bg-gray-100 rounded-lg p-8 text-center">
                    <div class="text-sm text-gray-500">Failed to load screenshot</div>
                    <div class="text-xs text-gray-400 mt-1">${screenshot.filename}</div>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-500">Loading screenshot...</div>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        {format(new Date(screenshot.createdAt), "PPpp")}
      </div>
    </div>
  );
}

interface LegacyScreenshotCardProps {
  screenshot: string;
  index: number;
}

function LegacyScreenshotCard({ screenshot, index }: LegacyScreenshotCardProps) {
  const isValidUrl = screenshot.startsWith('http') && !screenshot.includes('failed_upload');
  const isDataUrl = screenshot.startsWith('data:image');

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Camera className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Screenshot {index + 1}</span>
        </div>
        {(isValidUrl || isDataUrl) && (
          <Button variant="outline" size="sm" asChild>
            <a href={screenshot} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </a>
          </Button>
        )}
      </div>
      
      {(isValidUrl || isDataUrl) ? (
        <div className="rounded-lg overflow-hidden border">
          <img 
            src={screenshot} 
            alt={`Screenshot ${index + 1}`}
            className="w-full h-auto max-h-64 object-contain bg-gray-50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="bg-gray-100 rounded-lg p-8 text-center">
                    <div class="text-sm text-gray-500">Failed to load screenshot</div>
                    <div class="text-xs text-gray-400 mt-1">${screenshot}</div>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-500">Screenshot unavailable</div>
          <div className="text-xs text-gray-400 mt-1">{screenshot}</div>
        </div>
      )}
    </div>
  );
}

interface StepResultCardProps {
  stepResult: any;
  stepNumber: number;
}

function StepResultCard({ stepResult, stepNumber }: StepResultCardProps) {
  const getStepIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const isValidScreenshot = stepResult.screenshot && (
    stepResult.screenshot.startsWith('http') || 
    stepResult.screenshot.startsWith('data:image') ||
    stepResult.screenshot.startsWith('/api/')
  ) && !stepResult.screenshot.includes('failed_upload');

  const getScreenshotUrl = (screenshot: string) => {
    if (screenshot.startsWith('/api/')) {
      return `${window.location.origin}${screenshot}`;
    }
    return screenshot;
  };

  return (
    <Card className={`border-l-4 ${stepResult.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStepIcon(stepResult.success)}
            <div>
              <CardTitle className="text-base">
                Step {stepNumber}: {stepResult.action.replace('_', ' ')}
              </CardTitle>
              {stepResult.description && (
                <p className="text-sm text-gray-600 mt-1">{stepResult.description}</p>
              )}
            </div>
          </div>
          <Badge variant={stepResult.success ? "default" : "destructive"}>
            {stepResult.success ? "Success" : "Failed"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {stepResult.error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-700">{stepResult.error}</div>
          </div>
        )}

        {stepResult.screenshot && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-gray-900 flex items-center">
                <Camera className="h-4 w-4 mr-1" />
                Screenshot
              </h5>
              {isValidScreenshot && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={getScreenshotUrl(stepResult.screenshot)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Full
                    </a>
                  </Button>
                  {stepResult.screenshot.startsWith('/api/') && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={getScreenshotUrl(stepResult.screenshot)} download={`step_${stepNumber}_screenshot.png`}>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {isValidScreenshot ? (
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={getScreenshotUrl(stepResult.screenshot)} 
                  alt={`Step ${stepNumber} screenshot`}
                  className="w-full h-auto max-h-48 object-contain bg-gray-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="bg-gray-100 rounded-lg p-6 text-center">
                          <div class="text-sm text-gray-500">Failed to load screenshot</div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-500">Screenshot unavailable</div>
              </div>
            )}
          </div>
        )}

        {stepResult.extractedData && (
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Extracted Data</h5>
            <div className="bg-gray-50 rounded-lg p-3">
              <code className="text-sm text-gray-700">{stepResult.extractedData}</code>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Executed at: {format(new Date(stepResult.timestamp), "PPpp")}
        </div>
      </CardContent>
    </Card>
  );
}
