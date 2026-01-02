import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface TaskNotificationData {
  taskTitle: string;
  taskDescription?: string;
  projectName: string;
  assigneeName?: string;
  assignedBy?: string;
  modifiedBy?: string;
  dueDate?: Date | null;
  status?: string;
  modificationType?: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    console.log("Email credentials not configured. Skipping email notification.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Spectropy PMS" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
          <h1>Spectropy PMS</h1>
          <p>Filling The Learning Gap</p>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated notification from Spectropy PMS.</p>
          <p>Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function createTaskAssignmentEmail(data: TaskNotificationData): { subject: string; html: string } {
  const content = `
    <p>You have been assigned a new task.</p>
    <div class="task-details">
      <h3>${data.taskTitle}</h3>
      <div class="detail-row">
        <span class="detail-label">Project:</span>
        <span class="detail-value">${data.projectName}</span>
      </div>
      ${data.taskDescription ? `
      <div class="detail-row">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${data.taskDescription}</span>
      </div>
      ` : ""}
      <div class="detail-row">
        <span class="detail-label">Assigned By:</span>
        <span class="detail-value">${data.assignedBy || "System"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Due Date:</span>
        <span class="detail-value">${formatDate(data.dueDate)}</span>
      </div>
    </div>
    <p>Please log in to Spectropy PMS to view and work on this task.</p>
  `;

  return {
    subject: `[Spectropy PMS] Task Assigned: ${data.taskTitle}`,
    html: getEmailTemplate("New Task Assignment", content),
  };
}

export function createTaskCompletionEmail(data: TaskNotificationData): { subject: string; html: string } {
  const content = `
    <p>A task has been marked as completed.</p>
    <div class="task-details">
      <h3>${data.taskTitle}</h3>
      <div class="detail-row">
        <span class="detail-label">Project:</span>
        <span class="detail-value">${data.projectName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Completed By:</span>
        <span class="detail-value">${data.assigneeName || "Unknown"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Completion Date:</span>
        <span class="detail-value">${formatDate(new Date())}</span>
      </div>
    </div>
    <p>Log in to Spectropy PMS to view the completed task.</p>
  `;

  return {
    subject: `[Spectropy PMS] Task Completed: ${data.taskTitle}`,
    html: getEmailTemplate("Task Completed", content),
  };
}

export function createTaskUpdateEmail(data: TaskNotificationData): { subject: string; html: string } {
  const content = `
    <p>A task you are associated with has been updated.</p>
    <div class="task-details">
      <h3>${data.taskTitle}</h3>
      <div class="detail-row">
        <span class="detail-label">Project:</span>
        <span class="detail-value">${data.projectName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Modified By:</span>
        <span class="detail-value">${data.modifiedBy || "Unknown"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Modification:</span>
        <span class="detail-value">${data.modificationType || "Task details updated"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Current Status:</span>
        <span class="detail-value">${data.status || "Unknown"}</span>
      </div>
    </div>
    <p>Log in to Spectropy PMS to view the updated task details.</p>
  `;

  return {
    subject: `[Spectropy PMS] Task Updated: ${data.taskTitle}`,
    html: getEmailTemplate("Task Updated", content),
  };
}
