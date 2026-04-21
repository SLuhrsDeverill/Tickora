import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
  port: parseInt(process.env['SMTP_PORT'] || '587'),
  secure: false,
  auth: {
    user: process.env['SMTP_USER'],
    pass: process.env['SMTP_PASS'],
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env['SMTP_USER']) {
    logger.debug(`Email not sent (SMTP not configured): ${subject} to ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env['EMAIL_FROM'] || 'soporte@tickora.com',
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error}`);
  }
}

const emailFooter = `
  <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
  <p style="color:#94a3b8;font-size:12px;margin:0">El equipo de Tickora · soporte@tickora.com</p>
`;

export function ticketAssignedEmail(ticketNumber: string, agentName: string): string {
  return `
    <div style="font-family:sans-serif;color:#1e293b;max-width:560px">
      <h2 style="color:#2563eb">Tu ticket ha sido asignado</h2>
      <p>El ticket <strong>${ticketNumber}</strong> ha sido asignado al agente <strong>${agentName}</strong>.</p>
      <p>Podés revisar el estado de tu ticket en el portal de Tickora.</p>
      ${emailFooter}
    </div>
  `;
}

export function ticketResolvedEmail(ticketNumber: string, resolution: string): string {
  return `
    <div style="font-family:sans-serif;color:#1e293b;max-width:560px">
      <h2 style="color:#10b981">Tu ticket ha sido resuelto</h2>
      <p>El ticket <strong>${ticketNumber}</strong> ha sido marcado como resuelto.</p>
      <p><strong>Resolución:</strong> ${resolution}</p>
      <p>Si el problema persiste, podés reabrir el ticket desde el portal.</p>
      ${emailFooter}
    </div>
  `;
}
