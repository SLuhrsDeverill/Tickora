import { PrismaClient, TicketStatus, TicketPriority, TicketCategory, AssetType, AssetStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.assetMaintenance.deleteMany();
  await prisma.assetAssignment.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const agentPassword = await bcrypt.hash('Agent1234!', 12);
  const employeePassword = await bcrypt.hash('Empleado1234!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@empresa.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      department: 'IT',
      position: 'System Administrator',
      phone: '+54 11 1234-5678',
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: 'it.agent@empresa.com',
      password: agentPassword,
      firstName: 'Carlos',
      lastName: 'Técnico',
      role: 'IT_AGENT',
      department: 'IT',
      position: 'IT Support Specialist',
      phone: '+54 11 2345-6789',
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'empleado@empresa.com',
      password: employeePassword,
      firstName: 'María',
      lastName: 'García',
      role: 'EMPLOYEE',
      department: 'Contabilidad',
      position: 'Contador Senior',
      phone: '+54 11 3456-7890',
    },
  });

  // Extra employees
  const emp2 = await prisma.user.create({
    data: {
      email: 'juan.perez@empresa.com',
      password: employeePassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'EMPLOYEE',
      department: 'Ventas',
      position: 'Ejecutivo de Ventas',
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      email: 'laura.martinez@empresa.com',
      password: employeePassword,
      firstName: 'Laura',
      lastName: 'Martínez',
      role: 'EMPLOYEE',
      department: 'RRHH',
      position: 'Analista RRHH',
    },
  });

  console.log('✅ Users created');

  // Create assets
  const assetData = [
    { name: 'Laptop Dell Latitude 5540', type: 'LAPTOP' as AssetType, brand: 'Dell', model: 'Latitude 5540', serialNumber: 'DELL-001', status: 'ACTIVE' as AssetStatus, location: 'Piso 2 - Contabilidad', purchaseDate: new Date('2023-01-15'), warrantyExpiry: new Date('2026-01-15'), purchasePrice: 1200 },
    { name: 'Laptop HP EliteBook 840', type: 'LAPTOP' as AssetType, brand: 'HP', model: 'EliteBook 840 G9', serialNumber: 'HP-001', status: 'ACTIVE' as AssetStatus, location: 'Piso 3 - Ventas', purchaseDate: new Date('2023-03-20'), warrantyExpiry: new Date('2026-03-20'), purchasePrice: 1100 },
    { name: 'Laptop Lenovo ThinkPad', type: 'LAPTOP' as AssetType, brand: 'Lenovo', model: 'ThinkPad E15', serialNumber: 'LEN-001', status: 'AVAILABLE' as AssetStatus, location: 'Depósito IT', purchaseDate: new Date('2022-11-10'), warrantyExpiry: new Date('2025-11-10'), purchasePrice: 950 },
    { name: 'Monitor Samsung 27"', type: 'MONITOR' as AssetType, brand: 'Samsung', model: 'S27R650', serialNumber: 'SAM-MON-001', status: 'ACTIVE' as AssetStatus, location: 'Piso 2', purchaseDate: new Date('2023-01-15'), warrantyExpiry: new Date('2026-01-15'), purchasePrice: 350 },
    { name: 'Monitor LG 24"', type: 'MONITOR' as AssetType, brand: 'LG', model: '24MK600M', serialNumber: 'LG-MON-001', status: 'AVAILABLE' as AssetStatus, location: 'Depósito IT', purchaseDate: new Date('2022-06-01'), warrantyExpiry: new Date('2025-06-01'), purchasePrice: 250 },
    { name: 'Impresora HP LaserJet', type: 'PRINTER' as AssetType, brand: 'HP', model: 'LaserJet Pro M404n', serialNumber: 'HP-PRN-001', status: 'ACTIVE' as AssetStatus, location: 'Piso 2 - Sala común', purchaseDate: new Date('2021-08-20'), warrantyExpiry: new Date('2024-08-20'), purchasePrice: 450 },
    { name: 'Switch Cisco 24 puertos', type: 'SWITCH' as AssetType, brand: 'Cisco', model: 'Catalyst 2960', serialNumber: 'CIS-SWT-001', status: 'ACTIVE' as AssetStatus, location: 'Sala de servidores', purchaseDate: new Date('2020-03-15'), warrantyExpiry: new Date('2025-03-15'), purchasePrice: 2000 },
    { name: 'Router Mikrotik', type: 'ROUTER' as AssetType, brand: 'Mikrotik', model: 'RB4011iGS', serialNumber: 'MIK-RTR-001', status: 'ACTIVE' as AssetStatus, location: 'Sala de servidores', purchaseDate: new Date('2021-01-10'), warrantyExpiry: new Date('2024-01-10'), purchasePrice: 600 },
    { name: 'Server Dell PowerEdge', type: 'SERVER' as AssetType, brand: 'Dell', model: 'PowerEdge T440', serialNumber: 'DELL-SRV-001', status: 'ACTIVE' as AssetStatus, location: 'Sala de servidores', purchaseDate: new Date('2020-06-01'), warrantyExpiry: new Date('2025-06-01'), purchasePrice: 5000 },
    { name: 'UPS APC 1000VA', type: 'UPS' as AssetType, brand: 'APC', model: 'BX1000M', serialNumber: 'APC-UPS-001', status: 'ACTIVE' as AssetStatus, location: 'Sala de servidores', purchaseDate: new Date('2021-09-15'), warrantyExpiry: new Date('2024-09-15'), purchasePrice: 280 },
    { name: 'Tablet Samsung Galaxy Tab', type: 'TABLET' as AssetType, brand: 'Samsung', model: 'Galaxy Tab S7', serialNumber: 'SAM-TAB-001', status: 'AVAILABLE' as AssetStatus, location: 'Depósito IT', purchaseDate: new Date('2022-12-01'), warrantyExpiry: new Date('2025-12-01'), purchasePrice: 500 },
    { name: 'Auricular Jabra Evolve', type: 'HEADSET' as AssetType, brand: 'Jabra', model: 'Evolve2 40', serialNumber: 'JAB-HST-001', status: 'IN_REPAIR' as AssetStatus, location: 'IT - En reparación', purchaseDate: new Date('2023-02-14'), warrantyExpiry: new Date('2025-02-14'), purchasePrice: 180 },
    { name: 'Webcam Logitech C920', type: 'WEBCAM' as AssetType, brand: 'Logitech', model: 'C920 Pro HD', serialNumber: 'LOG-CAM-001', status: 'ACTIVE' as AssetStatus, location: 'Piso 3 - Sala de reuniones', purchaseDate: new Date('2022-04-10'), warrantyExpiry: new Date('2025-04-10'), purchasePrice: 120 },
    { name: 'Docking Station Dell', type: 'DOCKING_STATION' as AssetType, brand: 'Dell', model: 'WD19S', serialNumber: 'DELL-DKS-001', status: 'ACTIVE' as AssetStatus, location: 'Piso 2', purchaseDate: new Date('2023-01-15'), warrantyExpiry: new Date('2026-01-15'), purchasePrice: 250 },
    { name: 'Desktop HP ProDesk', type: 'DESKTOP' as AssetType, brand: 'HP', model: 'ProDesk 400 G7', serialNumber: 'HP-DSK-001', status: 'RETIRED' as AssetStatus, location: 'Depósito', purchaseDate: new Date('2018-03-01'), warrantyExpiry: new Date('2021-03-01'), purchasePrice: 800 },
    { name: 'Mouse Logitech MX Master', type: 'MOUSE' as AssetType, brand: 'Logitech', model: 'MX Master 3', serialNumber: 'LOG-MSE-001', status: 'AVAILABLE' as AssetStatus, location: 'Depósito IT', purchaseDate: new Date('2023-05-20'), warrantyExpiry: new Date('2025-05-20'), purchasePrice: 99 },
    { name: 'Teclado Logitech K120', type: 'KEYBOARD' as AssetType, brand: 'Logitech', model: 'K120', serialNumber: 'LOG-KBD-001', status: 'AVAILABLE' as AssetStatus, location: 'Depósito IT', purchaseDate: new Date('2023-05-20'), warrantyExpiry: new Date('2025-05-20'), purchasePrice: 25 },
    { name: 'Phone Cisco 7942G', type: 'PHONE' as AssetType, brand: 'Cisco', model: '7942G', serialNumber: 'CIS-PHN-001', status: 'ACTIVE' as AssetStatus, location: 'Piso 2 - Recepción', purchaseDate: new Date('2020-08-01'), warrantyExpiry: new Date('2023-08-01'), purchasePrice: 150 },
    { name: 'Laptop HP Spectre', type: 'LAPTOP' as AssetType, brand: 'HP', model: 'Spectre x360', serialNumber: 'HP-002', status: 'RESERVED' as AssetStatus, location: 'IT - Reservado para RRHH', purchaseDate: new Date('2024-01-10'), warrantyExpiry: new Date('2027-01-10'), purchasePrice: 1500 },
    { name: 'Monitor Dell UltraSharp 32"', type: 'MONITOR' as AssetType, brand: 'Dell', model: 'U3222Q 4K', serialNumber: 'DELL-MON-001', status: 'AVAILABLE' as AssetStatus, location: 'Depósito IT', purchaseDate: new Date('2023-08-15'), warrantyExpiry: new Date('2026-08-15'), purchasePrice: 800 },
  ];

  const createdAssets: Array<{ id: string }> = [];
  for (const asset of assetData) {
    const typeAbbr: Record<string, string> = {
      LAPTOP: 'LAP', DESKTOP: 'DSK', MONITOR: 'MON', KEYBOARD: 'KBD', MOUSE: 'MSE',
      PRINTER: 'PRN', PHONE: 'PHN', TABLET: 'TAB', SERVER: 'SRV', SWITCH: 'SWT',
      ROUTER: 'RTR', UPS: 'UPS', HEADSET: 'HST', WEBCAM: 'CAM', DOCKING_STATION: 'DKS', OTHER: 'OTH',
    };
    const count = createdAssets.filter(a => a).length;
    const assetTag = `AST-${typeAbbr[asset.type]}-${String(count + 1).padStart(3, '0')}`;
    const created = await prisma.asset.create({ data: { ...asset, assetTag } });
    createdAssets.push(created);
  }

  // Assign some assets to users
  await prisma.assetAssignment.create({
    data: { assetId: createdAssets[0]!.id, userId: employee.id, notes: 'Asignado para trabajo desde casa' },
  });
  await prisma.assetAssignment.create({
    data: { assetId: createdAssets[1]!.id, userId: emp2.id },
  });
  await prisma.assetAssignment.create({
    data: { assetId: createdAssets[3]!.id, userId: employee.id, notes: 'Monitor de escritorio' },
  });

  console.log('✅ Assets created and assigned');

  // Create tickets
  const ticketStatuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ON_HOLD'];
  const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const categories: TicketCategory[] = [
    'HARDWARE', 'SOFTWARE', 'NETWORK', 'EMAIL', 'PRINTER', 'ACCESS_PERMISSIONS', 'PHONE', 'OTHER'
  ];

  const ticketTemplates = [
    { title: 'PC no enciende', description: 'Mi computadora de escritorio no enciende al presionar el botón de encendido. No hay ningún LED que se encienda.', category: 'HARDWARE' as TicketCategory, priority: 'HIGH' as TicketPriority },
    { title: 'No puedo acceder al sistema ERP', description: 'Al intentar iniciar sesión en el sistema ERP, me aparece el error "Usuario no autorizado". Necesito acceso urgente para cerrar el mes.', category: 'SOFTWARE' as TicketCategory, priority: 'CRITICAL' as TicketPriority },
    { title: 'Internet muy lento en mi área', description: 'Desde esta mañana la conexión a internet en el piso 2 está extremadamente lenta. Afecta a todos los compañeros del área.', category: 'NETWORK' as TicketCategory, priority: 'HIGH' as TicketPriority },
    { title: 'No llegan emails externos', description: 'No estoy recibiendo correos de clientes externos. Los emails internos funcionan bien. El problema empezó ayer.', category: 'EMAIL' as TicketCategory, priority: 'HIGH' as TicketPriority },
    { title: 'Impresora no imprime', description: 'La impresora del piso 2 muestra error de papel pero tiene papel. Intenté reiniciarla pero el problema persiste.', category: 'PRINTER' as TicketCategory, priority: 'MEDIUM' as TicketPriority },
    { title: 'Necesito acceso a carpeta compartida', description: 'Necesito acceso a la carpeta "Contratos 2024" en el servidor de archivos para poder trabajar con los nuevos contratos.', category: 'ACCESS_PERMISSIONS' as TicketCategory, priority: 'MEDIUM' as TicketPriority },
    { title: 'Teléfono IP no tiene tono', description: 'Mi teléfono IP no tiene tono de marcado. Puedo recibir llamadas pero no hacer salientes.', category: 'PHONE' as TicketCategory, priority: 'MEDIUM' as TicketPriority },
    { title: 'Mouse no funciona correctamente', description: 'El puntero del mouse hace movimientos erráticos. Ya probé en otra computadora y pasa lo mismo, por lo que el problema es el mouse.', category: 'HARDWARE' as TicketCategory, priority: 'LOW' as TicketPriority },
    { title: 'Virus en computadora', description: 'El antivirus detectó una amenaza en mi computadora pero no puede eliminarla. Necesito que la revisen urgente ya que trabajo con información sensible.', category: 'SOFTWARE' as TicketCategory, priority: 'CRITICAL' as TicketPriority },
    { title: 'Backup no se completó', description: 'El sistema de backup automático no completó su tarea esta noche. Los logs muestran error de conexión al servidor de backup.', category: 'NETWORK' as TicketCategory, priority: 'HIGH' as TicketPriority },
    { title: 'Solicitud de nuevo equipo', description: 'Me incorporo al área de diseño el lunes próximo y necesito una laptop con las especificaciones adecuadas para trabajo gráfico.', category: 'HARDWARE' as TicketCategory, priority: 'MEDIUM' as TicketPriority },
    { title: 'Office 365 no activa', description: 'Instalé Office en mi nueva laptop pero no puedo activarlo. Me pide licencia pero no tengo el código.', category: 'SOFTWARE' as TicketCategory, priority: 'MEDIUM' as TicketPriority },
    { title: 'VPN no conecta desde casa', description: 'Desde hace 2 días no puedo conectarme a la VPN de la empresa desde mi casa. Sigo los mismos pasos de siempre pero da error de autenticación.', category: 'NETWORK' as TicketCategory, priority: 'HIGH' as TicketPriority },
    { title: 'Pantalla con líneas', description: 'El monitor de mi estación de trabajo tiene líneas horizontales que aparecieron esta mañana. No se puede trabajar con normalidad.', category: 'HARDWARE' as TicketCategory, priority: 'MEDIUM' as TicketPriority },
    { title: 'Reunión de Teams no funciona', description: 'No puedo unirme a reuniones de Microsoft Teams. El audio y video no se detectan. El resto de la aplicación funciona.', category: 'SOFTWARE' as TicketCategory, priority: 'MEDIUM' as TicketPriority },
  ];

  const creators = [employee, emp2, emp3, admin];
  const allResolved: string[] = [];

  for (let i = 0; i < ticketTemplates.length; i++) {
    const template = ticketTemplates[i]!;
    const creator = creators[i % creators.length]!;
    const statusIndex = i % ticketStatuses.length;
    const status = ticketStatuses[statusIndex]!;
    const year = new Date().getFullYear();
    const ticketNumber = `TK-${year}-${String(i + 1).padStart(5, '0')}`;

    const slaHours: Record<TicketPriority, number> = { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 };
    const hours = slaHours[template.priority];
    const createdAt = new Date(Date.now() - (i * 2 + 1) * 24 * 60 * 60 * 1000);
    const slaDeadline = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);

    let resolvedAt: Date | null = null;
    let closedAt: Date | null = null;
    let firstResponseAt: Date | null = null;
    let resolution: string | null = null;

    if (status !== 'OPEN') {
      firstResponseAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    }
    if (status === 'RESOLVED' || status === 'CLOSED') {
      resolvedAt = new Date(createdAt.getTime() + hours * 0.8 * 60 * 60 * 1000);
      resolution = 'Problema identificado y resuelto. Se realizaron las configuraciones necesarias.';
      allResolved.push(ticketNumber);
    }
    if (status === 'CLOSED') {
      closedAt = new Date(resolvedAt!.getTime() + 24 * 60 * 60 * 1000);
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority,
        status,
        createdById: creator.id,
        assignedToId: status !== 'OPEN' ? agent.id : null,
        slaDeadline,
        firstResponseAt,
        resolvedAt,
        closedAt,
        resolution,
        createdAt,
        updatedAt: resolvedAt || createdAt,
      },
    });

    // Add history
    await prisma.ticketHistory.create({
      data: {
        ticket: { connect: { id: ticket.id } },
        field: 'status',
        oldValue: null,
        newValue: 'OPEN',
        changedById: creator.id,
        createdAt,
      },
    });

    if (status !== 'OPEN' && firstResponseAt) {
      await prisma.ticketHistory.create({
        data: {
          ticket: { connect: { id: ticket.id } },
          field: 'assignedTo',
          oldValue: null,
          newValue: agent.id,
          changedById: agent.id,
          createdAt: firstResponseAt,
        },
      });

      // Add a comment
      await prisma.comment.create({
        data: {
          ticket: { connect: { id: ticket.id } },
          author: { connect: { id: agent.id } },
          content: 'Revisando el problema, me comunico a la brevedad.',
          isInternal: false,
          createdAt: firstResponseAt,
        },
      });
    }

    if ((status === 'RESOLVED' || status === 'CLOSED') && resolvedAt) {
      await prisma.ticketHistory.create({
        data: {
          ticket: { connect: { id: ticket.id } },
          field: 'status',
          oldValue: 'IN_PROGRESS',
          newValue: 'RESOLVED',
          changedById: agent.id,
          createdAt: resolvedAt,
        },
      });
    }
  }

  console.log('✅ Tickets created');

  // Add maintenance record
  await prisma.assetMaintenance.create({
    data: {
      assetId: createdAssets[11]!.id, // Headset in repair
      type: 'Correctivo',
      description: 'Falla en el conector USB. Se envió a reparación con el proveedor.',
      performedAt: new Date('2024-01-15'),
      nextDue: new Date('2024-07-15'),
      performedBy: 'Proveedor externo',
    },
  });

  console.log('✅ Maintenance records created');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('  Admin:    admin@empresa.com     / Admin1234!');
  console.log('  Agent:    it.agent@empresa.com  / Agent1234!');
  console.log('  Employee: empleado@empresa.com  / Empleado1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
