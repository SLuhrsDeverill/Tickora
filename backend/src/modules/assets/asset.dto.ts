import { z } from 'zod';
import { AssetType, AssetStatus } from '@prisma/client';

export const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.nativeEnum(AssetType),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(AssetStatus).default('AVAILABLE'),
  specifications: z.record(z.unknown()).optional(),
  purchaseDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  purchasePrice: z.number().optional(),
  warrantyExpiry: z.string().optional().transform(v => v ? new Date(v) : undefined),
  notes: z.string().optional(),
  location: z.string().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const assignAssetSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  notes: z.string().optional(),
});

export const maintenanceSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().optional(),
  performedAt: z.string().transform(v => new Date(v)),
  nextDue: z.string().optional().transform(v => v ? new Date(v) : undefined),
  performedBy: z.string().optional(),
});

export type CreateAssetDto = z.infer<typeof createAssetSchema>;
export type UpdateAssetDto = z.infer<typeof updateAssetSchema>;
export type AssignAssetDto = z.infer<typeof assignAssetSchema>;
export type MaintenanceDto = z.infer<typeof maintenanceSchema>;
