import { Resend } from "resend";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface TaskNotificationData {
  taskId?: number;
  taskTitle: string;
  taskDescription?: string;
  projectName: string;
  projectId?: number;
  bucketName?: string;
  bucketId?: number | null;
  status?: string;
  priority?: string;
  assigneeName?: string;
  assigneeId?: number | null;
  assignedUsers?: string[];
  assignedBy?: string;
  modifiedBy?: string;
  completedBy?: string;
  completionDate?: Date | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  estimateHours?: number | null;
  estimateMinutes?: number | null;
  checklistCount?: number;
  checklistCompletedCount?: number;
  attachmentsCount?: number;
  historyCount?: number;
  customFields?: Record<string, string>;
  createdAt?: Date | null;
  position?: number | null;
  modificationType?: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;

console.log(
  `Email service: RESEND_API_KEY is ${resendApiKey ? "SET" : "NOT SET"
  }`
);
console.log(
  `Email service: RESEND_FROM is ${resendFrom ? `SET (${resendFrom})` : "NOT SET"
  }`
);

const resend = new Resend(resendApiKey);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resendApiKey || !resendFrom) {
    console.error("Resend env not configured");
    return false;
  }

  try {
    const response = await resend.emails.send({
      from: `Spectropy CSM <${resendFrom}>`,
      to,
      subject,
      html,
    });

    if (response.error) {
      console.error("Resend API error:", response.error);
      return false;
    }

    console.log("Email sent successfully:", response.data?.id);
    return true;
  } catch (err) {
    console.error("Unexpected email error:", err);
    return false;
  }
}

/* -------------------- Helpers & Templates -------------------- */

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return "Not set";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPriority(priority: string | null | undefined): string {
  if (!priority) return "Not set";
  return priority.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEstimate(
  hours: number | null | undefined,
  minutes: number | null | undefined,
): string {
  const safeHours = typeof hours === "number" ? hours : 0;
  const safeMinutes = typeof minutes === "number" ? minutes : 0;
  return `${safeHours}h ${safeMinutes}m`;
}

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) return "None";
  return values.join(", ");
}

function formatChecklist(
  completed: number | null | undefined,
  total: number | null | undefined,
): string {
  if (typeof total !== "number") return "None";
  const safeCompleted = typeof completed === "number" ? completed : 0;
  return `${safeCompleted} of ${total} completed`;
}

function formatCustomFields(customFields: Record<string, string> | undefined): string {
  if (!customFields || Object.keys(customFields).length === 0) return "None";
  return Object.entries(customFields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("<br />");
}

function renderDetailRow(label: string, value: string, fallback?: string): string {
  const trimmed = value?.trim();
  const finalValue = trimmed && trimmed.length > 0 ? trimmed : fallback;
  if (!finalValue) return "";
  return `
      <div class="detail-row">
        <span class="detail-label">${label}:</span>
        <span class="detail-value">${finalValue}</span>
      </div>
  `;
}

function buildBaseTaskDetails(data: TaskNotificationData): string {
  return [
    renderDetailRow("Task ID", data.taskId?.toString() ?? "", "Not set"),
    renderDetailRow("Project ID", data.projectId?.toString() ?? "", "Not set"),
    renderDetailRow("Project", data.projectName, "Not set"),
    renderDetailRow("Bucket ID", data.bucketId?.toString() ?? "", "Not set"),
    renderDetailRow("Stage", data.bucketName ?? "", "Not set"),
    renderDetailRow("Status", formatStatus(data.status)),
    renderDetailRow("Priority", formatPriority(data.priority)),
    renderDetailRow("Position", data.position?.toString() ?? "", "Not set"),
    renderDetailRow("Start Date", formatDate(data.startDate)),
    renderDetailRow("Due Date", formatDate(data.dueDate)),
    renderDetailRow(
      "Estimate",
      formatEstimate(data.estimateHours, data.estimateMinutes),
    ),
    renderDetailRow("Assignee ID", data.assigneeId?.toString() ?? "", "Unassigned"),
    renderDetailRow("Primary Assignee", data.assigneeName ?? "", "Unassigned"),
    renderDetailRow(
      "Additional Assignees",
      formatList(data.assignedUsers),
    ),
    renderDetailRow("Description", data.taskDescription ?? "", "Not provided"),
    renderDetailRow(
      "History Entries",
      data.historyCount !== undefined ? String(data.historyCount) : "",
      "0",
    ),
    renderDetailRow(
      "Checklist",
      formatChecklist(data.checklistCompletedCount, data.checklistCount),
    ),
    renderDetailRow(
      "Attachments",
      data.attachmentsCount !== undefined ? String(data.attachmentsCount) : "",
      "0",
    ),
    renderDetailRow("Custom Fields", formatCustomFields(data.customFields)),
    renderDetailRow("Created At", formatDateTime(data.createdAt)),
  ].join("");
}

function getEmailTemplate(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #22d3ee); padding: 20px; color: white; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
        .task-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5; }
        .task-details h3 { margin: 0 0 15px; color: #4f46e5; }
        .detail-row { display: flex; margin: 10px 0; }
        .detail-label { font-weight: bold; min-width: 120px; color: #64748b; }
        .detail-value { color: #334155; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Spectropy CSM</h1>
          <p>Filling The Learning Gap</p>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated notification from Spectropy CSM.</p>
          <p>Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/* -------------------- Email Builders -------------------- */

export function createTaskAssignmentEmail(
  data: TaskNotificationData
): { subject: string; html: string } {
  const content = `
    <p>You have been assigned a new task.</p>
    <div class="task-details">
      <h3>${data.taskTitle}</h3>
      ${renderDetailRow("Operation", "Assigned")}
      ${renderDetailRow("Assigned By", data.assignedBy ?? "", "System")}
      ${buildBaseTaskDetails(data)}
    </div>
    <p>Please log in to Spectropy CSM to view and work on this task.</p>
  `;

  return {
    subject: `[Spectropy CSM] Task Assigned: ${data.taskTitle}`,
    html: getEmailTemplate("New Task Assignment", content),
  };
}

export function createTaskCompletionEmail(
  data: TaskNotificationData
): { subject: string; html: string } {
  const completionDate = data.completionDate ?? new Date();
  const content = `
    <p>A task has been marked as completed.</p>
    <div class="task-details">
      <h3>${data.taskTitle}</h3>
      ${renderDetailRow("Operation", "Completed")}
      ${renderDetailRow("Completed By", data.completedBy ?? "", "Unknown")}
      ${renderDetailRow("Completion Date", formatDate(completionDate))}
      ${buildBaseTaskDetails(data)}
    </div>
    <p>Log in to Spectropy CSM to view the completed task.</p>
  `;

  return {
    subject: `[Spectropy CSM] Task Completed: ${data.taskTitle}`,
    html: getEmailTemplate("Task Completed", content),
  };
}

export function createTaskUpdateEmail(
  data: TaskNotificationData
): { subject: string; html: string } {
  const content = `
    <p>A task you are associated with has been updated.</p>
    <div class="task-details">
      <h3>${data.taskTitle}</h3>
      ${renderDetailRow("Operation", "Updated")}
      ${renderDetailRow("Modified By", data.modifiedBy ?? "", "Unknown")}
      ${renderDetailRow(
    "Modified Fields",
    data.modificationType ?? "",
    "Task details updated",
  )}
      ${buildBaseTaskDetails(data)}
    </div>
    <p>Log in to Spectropy CSM to view the updated task details.</p>
  `;

  return {
    subject: `[Spectropy CSM] Task Updated: ${data.taskTitle}`,
    html: getEmailTemplate("Task Updated", content),
  };
}
