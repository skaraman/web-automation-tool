import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { AutomationStep, ActionType, SelectorType } from "~backend/automation/types";

interface StepEditorProps {
  steps: AutomationStep[];
  onChange: (steps: AutomationStep[]) => void;
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  const [editingStep, setEditingStep] = useState<AutomationStep | null>(null);

  const addStep = () => {
    const newStep: AutomationStep = {
      id: `step_${Date.now()}`,
      action: "navigate",
      description: "",
    };
    setEditingStep(newStep);
  };

  const saveStep = (step: AutomationStep) => {
    const existingIndex = steps.findIndex(s => s.id === step.id);
    if (existingIndex >= 0) {
      const newSteps = [...steps];
      newSteps[existingIndex] = step;
      onChange(newSteps);
    } else {
      onChange([...steps, step]);
    }
    setEditingStep(null);
  };

  const deleteStep = (stepId: string) => {
    onChange(steps.filter(s => s.id !== stepId));
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    onChange(newSteps);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Automation Steps</CardTitle>
          <Button onClick={addStep}>
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {steps.length === 0 && !editingStep && (
          <div className="text-center py-8 text-gray-500">
            No steps added yet. Click "Add Step" to get started.
          </div>
        )}

        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            onEdit={setEditingStep}
            onDelete={deleteStep}
            onMove={moveStep}
            totalSteps={steps.length}
          />
        ))}

        {editingStep && (
          <StepForm
            step={editingStep}
            onSave={saveStep}
            onCancel={() => setEditingStep(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  step: AutomationStep;
  index: number;
  onEdit: (step: AutomationStep) => void;
  onDelete: (stepId: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  totalSteps: number;
}

function StepCard({ step, index, onEdit, onDelete, onMove, totalSteps }: StepCardProps) {
  return (
    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex flex-col space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => index > 0 && onMove(index, index - 1)}
          disabled={index === 0}
        >
          ↑
        </Button>
        <GripVertical className="h-4 w-4 text-gray-400" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => index < totalSteps - 1 && onMove(index, index + 1)}
          disabled={index === totalSteps - 1}
        >
          ↓
        </Button>
      </div>

      <div className="flex-1">
        <div className="font-medium">{step.action}</div>
        {step.description && (
          <div className="text-sm text-gray-600">{step.description}</div>
        )}
        {step.selector && (
          <div className="text-sm text-gray-500">
            Selector: {step.selector} ({step.selectorType})
          </div>
        )}
        {step.value && (
          <div className="text-sm text-gray-500">Value: {step.value}</div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(step)}>
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(step.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface StepFormProps {
  step: AutomationStep;
  onSave: (step: AutomationStep) => void;
  onCancel: () => void;
}

function StepForm({ step, onSave, onCancel }: StepFormProps) {
  const [formData, setFormData] = useState<AutomationStep>(step);

  const actionOptions: { value: ActionType; label: string }[] = [
    { value: "navigate", label: "Navigate to URL" },
    { value: "click", label: "Click Element" },
    { value: "type", label: "Type Text" },
    { value: "wait", label: "Wait" },
    { value: "screenshot", label: "Take Screenshot" },
    { value: "extract_text", label: "Extract Text" },
    { value: "extract_attribute", label: "Extract Attribute" },
    { value: "scroll", label: "Scroll Page" },
    { value: "select_dropdown", label: "Select from Dropdown" },
  ];

  const selectorOptions: { value: SelectorType; label: string }[] = [
    { value: "css", label: "CSS Selector" },
    { value: "xpath", label: "XPath" },
    { value: "id", label: "ID" },
    { value: "class", label: "Class" },
    { value: "text", label: "Text Content" },
  ];

  const needsSelector = ["click", "type", "extract_text", "extract_attribute", "select_dropdown"].includes(formData.action);
  const needsValue = ["navigate", "type", "extract_attribute", "select_dropdown"].includes(formData.action);
  const needsWaitTime = formData.action === "wait";

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg">
          {step.id.startsWith("step_") ? "Add New Step" : "Edit Step"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="action">Action *</Label>
          <Select
            value={formData.action}
            onValueChange={(value: ActionType) =>
              setFormData({ ...formData, action: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe what this step does"
          />
        </div>

        {needsSelector && (
          <>
            <div>
              <Label htmlFor="selectorType">Selector Type</Label>
              <Select
                value={formData.selectorType || "css"}
                onValueChange={(value: SelectorType) =>
                  setFormData({ ...formData, selectorType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="selector">Selector *</Label>
              <Input
                id="selector"
                value={formData.selector || ""}
                onChange={(e) =>
                  setFormData({ ...formData, selector: e.target.value })
                }
                placeholder="Enter element selector"
              />
            </div>
          </>
        )}

        {needsValue && (
          <div>
            <Label htmlFor="value">
              {formData.action === "navigate" ? "URL" : 
               formData.action === "type" ? "Text to Type" :
               formData.action === "extract_attribute" ? "Attribute Name" :
               formData.action === "select_dropdown" ? "Option Value" : "Value"} *
            </Label>
            <Input
              id="value"
              value={formData.value || ""}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder={
                formData.action === "navigate" ? "https://example.com" :
                formData.action === "type" ? "Text to enter" :
                formData.action === "extract_attribute" ? "href, src, etc." :
                formData.action === "select_dropdown" ? "Option value" : "Enter value"
              }
            />
          </div>
        )}

        {needsWaitTime && (
          <div>
            <Label htmlFor="waitTime">Wait Time (milliseconds) *</Label>
            <Input
              id="waitTime"
              type="number"
              value={formData.waitTime || 1000}
              onChange={(e) =>
                setFormData({ ...formData, waitTime: parseInt(e.target.value) || 1000 })
              }
              placeholder="1000"
            />
          </div>
        )}

        <div className="flex space-x-2">
          <Button onClick={handleSave}>Save Step</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
