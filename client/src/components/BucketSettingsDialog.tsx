import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { customFieldConfigSchema, type CustomFieldConfig, type Bucket } from "@shared/schema";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BucketSettingsDialogProps {
    bucketId: number;
    currentConfig: CustomFieldConfig[];
}

const fieldSchema = z.object({
    fields: z.array(customFieldConfigSchema),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

export default function BucketSettingsDialog({ bucketId, currentConfig }: BucketSettingsDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FieldFormValues>({
        resolver: zodResolver(fieldSchema),
        defaultValues: {
            fields: currentConfig || [],
        },
    });

    const fields = form.watch("fields");

    const addField = () => {
        const currentFields = form.getValues("fields");
        form.setValue("fields", [
            ...currentFields,
            {
                id: crypto.randomUUID(),
                key: "",
                label: "",
                type: "text" as const,
                required: false,
                //order: currentFields.length,
                copyOnProgress: false,
            },
        ]);
    };

    const removeField = (index: number) => {
        const currentFields = form.getValues("fields");
        form.setValue(
            "fields",
            currentFields.filter((_, i) => i !== index)
        );
    };

    const onSubmit = async (data: FieldFormValues) => {
        setIsSubmitting(true);
        try {
            await apiRequest("PATCH", `/api/buckets/${bucketId}`, {
                customFieldsConfig: data.fields,
            });

            queryClient.invalidateQueries({ queryKey: ["/api/buckets"] });

            toast({
                title: "Success",
                description: "Custom fields updated successfully",
            });
            setOpen(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update custom fields",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="flex items-center w-full px-2 py-1.5 cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Custom Fields</span>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure Custom Fields</DialogTitle>
                    <DialogDescription>
                        Define custom fields for Customers in this Stage.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            <h4 className="font-medium">Field {index + 1}</h4>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeField(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Key (Internal Name)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="e.g., client_approval"
                                                            pattern="[a-z0-9_]+"
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        Lowercase, numbers, underscores only
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.label`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Label (Display Name)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="e.g., Client Approval" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.type`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Field Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="text">Text</SelectItem>
                                                            <SelectItem value="number">Number</SelectItem>
                                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                                            <SelectItem value="list">List (Dropdown)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {fields[index].type === "list" && (
                                            <FormField
                                                control={form.control}
                                                name={`fields.${index}.options`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Options (comma-separated)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                value={field.value?.join(", ") || ""}
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target.value
                                                                            .split(",")
                                                                            .map((opt) => opt.trim())
                                                                            .filter(Boolean)
                                                                    )
                                                                }
                                                                placeholder="e.g., Approved, Pending, Rejected"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    <div className="flex gap-6">
                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.required`}
                                            render={({ field }) => (
                                                <FormItem className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="!mt-0 font-normal">Required field</FormLabel>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.copyOnProgress`}
                                            render={({ field }) => (
                                                <FormItem className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="!mt-0 font-normal">
                                                        Copy to next Stage on completion
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button type="button" variant="outline" onClick={addField} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Field
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
