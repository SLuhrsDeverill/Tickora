/**
 * clean-production.ts
 * Elimina TODOS los datos de prueba en el orden correcto respetando FK constraints.
 * Uso: npx ts-node scripts/clean-production.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos...');

  // Chat
  await prisma.chatMessage.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chatRoom.deleteMany();

  // Bot / IA
  await prisma.aISuggestion.deleteMany();
  await prisma.botConversation.deleteMany();

  // Knowledge base
  await prisma.knowledgeBase.deleteMany();

  // Tickets (dependencias primero)
  await prisma.timeEntry.deleteMany();
  await prisma.ticketWatcher.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();

  // Assets
  await prisma.assetMaintenance.deleteMany();
  await prisma.assetAssignment.deleteMany();
  await prisma.asset.deleteMany();

  // System
  await prisma.systemSettings.deleteMany();

  // Users / Departments
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('✅ Base de datos limpia.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
