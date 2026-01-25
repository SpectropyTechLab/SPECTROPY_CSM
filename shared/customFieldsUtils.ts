/**
 * Custom Fields Helper Utilities
 * 
 * Handles parsing and serialization of custom fields stored as delimited strings
 * Format: key=value||key2=value2||key3=value3
 */

import type { CustomFieldConfig } from "@shared/schema";

const DELIMITER = "||";
const KEY_VALUE_SEPARATOR = "=";

/**
 * Parse customFields string into key-value object
 * @param customFieldsString - String like "client_approval=true||remarks=Reviewed"
 * @returns Object like { client_approval: "true", remarks: "Reviewed" }
 */
export function parseCustomFields(customFieldsString: string | null): Record<string, string> {
    if (!customFieldsString || customFieldsString.trim() === "") {
        return {};
    }

    const result: Record<string, string> = {};

    const pairs = customFieldsString.split(DELIMITER);

    for (const pair of pairs) {
        if (!pair.trim()) continue;

        const [key, ...valueParts] = pair.split(KEY_VALUE_SEPARATOR);
        if (key) {
            // Rejoin value parts in case value contained '='
            result[key.trim()] = valueParts.join(KEY_VALUE_SEPARATOR).trim();
        }
    }

    return result;
}

/**
 * Serialize key-value object into customFields string
 * @param customFieldsObj - Object like { client_approval: "true", remarks: "Reviewed" }
 * @returns String like "client_approval=true||remarks=Reviewed"
 */
export function serializeCustomFields(customFieldsObj: Record<string, string>): string {
    if (!customFieldsObj || Object.keys(customFieldsObj).length === 0) {
        return "";
    }

    const pairs = Object.entries(customFieldsObj)
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => `${key}${KEY_VALUE_SEPARATOR}${value}`);

    return pairs.join(DELIMITER);
}

/**
 * Validate custom field values against bucket configuration
 * @param customFieldsObj - Object with field values
 * @param customFieldsConfig - Array of field configurations from bucket
 * @returns Object with { valid: boolean, errors: string[] }
 */
export function validateCustomFields(
    customFieldsObj: Record<string, string>,
    customFieldsConfig: CustomFieldConfig[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const config of customFieldsConfig) {
        const value = customFieldsObj[config.key];

        // Check required fields
        if (config.required && (!value || value.trim() === "")) {
            errors.push(`Field "${config.label}" is required`);
            continue;
        }

        // Skip validation if field is empty and not required
        if (!value || value.trim() === "") {
            continue;
        }

        // Type-specific validation
        switch (config.type) {
            case "number":
                if (isNaN(Number(value))) {
                    errors.push(`Field "${config.label}" must be a number`);
                }
                break;

            case "checkbox":
                if (value !== "true" && value !== "false") {
                    errors.push(`Field "${config.label}" must be a checkbox (true/false)`);
                }
                break;

            case "list":
                if (config.options && !config.options.includes(value)) {
                    errors.push(`Field "${config.label}" must be one of: ${config.options.join(", ")}`);
                }
                break;

            case "text":
                // Text fields accept any string
                break;
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get default value for a custom field based on its type
 */
export function getDefaultFieldValue(fieldType: CustomFieldConfig["type"]): string {
    switch (fieldType) {
        case "checkbox":
            return "false";
        case "number":
            return "0";
        case "text":
        case "list":
        default:
            return "";
    }
}

/**
 * Merge custom fields from old task with new bucket config
 * Used when moving tasks between buckets with different configs
 */
export function mergeCustomFieldsWithConfig(
    oldCustomFields: string | null,
    newConfig: CustomFieldConfig[]
): Record<string, string> {
    const oldFields = parseCustomFields(oldCustomFields);
    const result: Record<string, string> = {};

    for (const config of newConfig) {
        // If field existed in old task and is in new config, keep it
        if (oldFields[config.key] !== undefined) {
            result[config.key] = oldFields[config.key];
        } else {
            // Otherwise, use default value
            result[config.key] = getDefaultFieldValue(config.type);
        }
    }

    return result;
}