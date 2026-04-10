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
      from: process.env['EMAIL_FROM'] || 'helpdesk@empresa.com',
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error}`);
  }
}

export function ticketAssignedEmail(ticketNumber: string, agentName: string): string {
  return `
    <h2>Tu ticket ha sido asignado</h2>
    <p>El ticket <strong>${ticketNumber}</strong> ha sido asignado al agente <strong>${agentName}</strong>.</p>
    <p>Puedes revisar el estado de tu ticket en el portal de IT HelpDesk.</p>
  `;
}

export function ticketResolvedEmail(ticketNumber: string, resolution: string): string {
  return `
    <h2>Tu ticket ha sido resuelto</h2>
    <p>El ticket <strong>${ticketNumber}</strong> ha sido marcado como resuelto.</p>
    <p><strong>Resolución:</strong> ${resolution}</p>
    <p>Si el problema persiste, puedes reabrir el ticket desde el portal.</p>
  `;
}
