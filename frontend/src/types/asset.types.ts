export type AssetType =
  | 'LAPTOP' | 'DESKTOP' | 'MONITOR' | 'KEYBOARD' | 'MOUSE'
  | 'PRINTER' | 'PHONE' | 'TABLET' | 'SERVER' | 'SWITCH'
  | 'ROUTER' | 'UPS' | 'HEADSET' | 'WEBCAM' | 'DOCKING_STATION' | 'OTHER';

export type AssetStatus = 'ACTIVE' | 'IN_REPAIR' | 'RETIRED' | 'AVAILABLE' | 'RESERVED';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  type: AssetType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  specifications?: Record<string, unknown>;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  notes?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  assignments?: AssetAssignment[];
  maintenances?: AssetMaintenance[];
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  assignedAt: string;
  returnedAt?: string;
  notes?: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  type: string;
  description: string;
  cost?: number;
  performedAt: string;
  nextDue?: string;
  performedBy?: string;
  createdAt: string;
}
