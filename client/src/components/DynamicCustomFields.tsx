import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Bucket, CustomFieldConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface DynamicCustomFieldsProps {
  bucketId: number;
  existingValues: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export default function DynamicCustomFields({
  bucketId,
  existingValues,
  onChange,
}: DynamicCustomFieldsProps) {
  // Fetch bucket configuration
  const { data: buckets } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/buckets");
      return res.json();
    },
  });

  const bucket = buckets?.find((b) => b.id === bucketId);
  const fieldConfigs = bucket?.customFieldsConfig || [];

  if (fieldConfigs.length === 0) {
    return null;
  }

  const handleFieldChange = (key: string, value: any) => {
    onChange({
      ...existingValues,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {fieldConfigs.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === "text" && (
            <Input
              value={existingValues[field.key] || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              required={field.required}
            />
          )}

          {field.type === "number" && (
            <Input
              type="number"
              value={existingValues[field.key] || ""}
              onChange={(e) =>
                handleFieldChange(field.key, Number(e.target.value))
              }
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              required={field.required}
            />
          )}

          {field.type === "list" && field.options && (
            <Select
              value={existingValues[field.key] || ""}
              onValueChange={(value) => handleFieldChange(field.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === "checkbox" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={existingValues[field.key] === true}
                onCheckedChange={(checked) =>
                  handleFieldChange(field.key, checked)
                }
              />
              <label className="text-sm text-muted-foreground">
                {field.label}
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
