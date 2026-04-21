import prisma from '../../config/database';

export class SettingsService {
  async getAll() {
    const settings = await prisma.systemSettings.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async get(key: string) {
    return prisma.systemSettings.findUnique({ where: { key } });
  }

  async set(key: string, value: string, type = 'string') {
    return prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value, type },
    });
  }

  async setMany(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );
    await Promise.all(updates);
    return this.getAll();
  }

  async getDepartments() {
    return prisma.department.findMany({
      include: { manager: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(name: string, code: string, managerId?: string) {
    return prisma.department.create({ data: { name, code, managerId } });
  }

  async updateDepartment(id: string, data: { name?: string; code?: string; managerId?: string; isActive?: boolean }) {
    return prisma.department.update({ where: { id }, data });
  }

  async deleteDepartment(id: string) {
    await prisma.department.delete({ where: { id } });
  }

  async getBotStats() {
    const [total, resolved, escalated] = await Promise.all([
      prisma.botConversation.count(),
      prisma.botConversation.count({ where: { resolved: true } }),
      prisma.botConversation.count({ where: { escalated: true } }),
    ]);
    return {
      total,
      resolved,
      escalated,
      resolvedPercent: total > 0 ? Math.round((resolved / total) * 100) : 0,
      escalatedPercent: total > 0 ? Math.round((escalated / total) * 100) : 0,
    };
  }
}

export const settingsService = new SettingsService();
