import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { StepEditor } from "./StepEditor";
import backend from "~backend/client";
import type { AutomationStep } from "~backend/automation/types";

export function ScriptEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: scriptData } = useQuery({
    queryKey: ["script", id],
    queryFn: () => backend.automation.getScript({ id: parseInt(id!) }),
    enabled: isEditing,
  });

  useEffect(() => {
    if (scriptData) {
      setName(scriptData.name);
      setDescription(scriptData.description || "");
      setSteps(scriptData.steps);
    }
  }, [scriptData]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Script name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await backend.automation.updateScript({
          id: parseInt(id!),
          name,
          description: description || undefined,
          steps,
        });
        toast({
          title: "Script updated",
          description: "Your automation script has been updated successfully.",
        });
      } else {
        await backend.automation.createScript({
          name,
          description: description || undefined,
          steps,
        });
        toast({
          title: "Script created",
          description: "Your automation script has been created successfully.",
        });
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to save script:", error);
      toast({
        title: "Error",
        description: "Failed to save script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Script" : "Create New Script"}
        </h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Script"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Script Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter script name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter script description (optional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <StepEditor steps={steps} onChange={setSteps} />
    </div>
  );
}
