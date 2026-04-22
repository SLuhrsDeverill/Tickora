import { PrismaClient, TicketCategory } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de producción...');

  // ─── Admin credentials from env ─────────────────────────────────────────
  const adminEmail = process.env['ADMIN_EMAIL'] || 'admin@tuempresa.com';
  const adminFirstName = process.env['ADMIN_FIRST_NAME'] || 'Administrador';
  const adminLastName = process.env['ADMIN_LAST_NAME'] || 'Sistema';

  // If ADMIN_PASSWORD is set in env, use it; otherwise generate a random one
  const rawPassword =
    process.env['ADMIN_PASSWORD'] || crypto.randomBytes(12).toString('base64url');
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  // ─── Upsert admin user ───────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword, firstName: adminFirstName, lastName: adminLastName },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'ADMIN',
      position: 'Administrador del Sistema',
      isActive: true,
    },
  });

  // ─── System settings (defaults) ─────────────────────────────────────────
  const defaultSettings: Array<{ key: string; value: string; type: string }> = [
    { key: 'company_name', value: process.env['COMPANY_NAME'] || 'Tickora', type: 'string' },
    { key: 'company_logo_url', value: process.env['COMPANY_LOGO_URL'] || '', type: 'string' },
    { key: 'timezone', value: 'America/Argentina/Buenos_Aires', type: 'string' },
    { key: 'language', value: 'es', type: 'string' },
    { key: 'sla_critical_hours', value: '4', type: 'number' },
    { key: 'sla_high_hours', value: '8', type: 'number' },
    { key: 'sla_medium_hours', value: '24', type: 'number' },
    { key: 'sla_low_hours', value: '72', type: 'number' },
    { key: 'business_hours_start', value: '9', type: 'number' },
    { key: 'business_hours_end', value: '18', type: 'number' },
    { key: 'business_days', value: '1,2,3,4,5', type: 'json' },
    { key: 'sla_pause_outside_hours', value: 'false', type: 'boolean' },
    { key: 'bot_enabled', value: 'true', type: 'boolean' },
    { key: 'bot_welcome_message', value: '¡Hola! Soy Tika, la asistente de Tickora. ¿En qué puedo ayudarte hoy?', type: 'string' },
    { key: 'smtp_host', value: process.env['SMTP_HOST'] || '', type: 'string' },
    { key: 'smtp_port', value: process.env['SMTP_PORT'] || '587', type: 'number' },
    { key: 'smtp_user', value: process.env['SMTP_USER'] || '', type: 'string' },
    { key: 'email_from', value: process.env['EMAIL_FROM'] || 'helpdesk@tuempresa.com', type: 'string' },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // ─── Knowledge base articles ─────────────────────────────────────────────
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    const kbArticles = [
      {
        title: 'Cómo conectarse a la VPN',
        content: `# Cómo conectarse a la VPN\n\n## Requisitos\n- Cliente VPN instalado (GlobalProtect o similar)\n- Credenciales de red corporativa\n\n## Pasos\n1. Abrí el cliente VPN desde el menú de inicio\n2. Ingresá la dirección del servidor VPN: **vpn.tuempresa.com**\n3. Autenticate con tu usuario y contraseña de red\n4. Hacé click en "Conectar"\n5. Verificá el ícono de VPN en la barra de tareas (debe aparecer en verde)\n\n## Problemas comunes\n- **Error de autenticación**: Verificá que tu contraseña no haya expirado\n- **No conecta**: Intentá desactivar el firewall temporalmente para diagnosticar\n- **Lento después de conectar**: Normal en conexiones remotas, reiniciá el cliente VPN`,
        category: 'NETWORK' as TicketCategory,
        tags: ['vpn', 'red', 'remoto', 'acceso'],
        isPublic: true,
      },
      {
        title: 'Qué hacer si no tenés internet',
        content: `# Sin conexión a internet\n\n## Diagnóstico rápido\n1. **Verificá el cable de red** o la señal WiFi\n2. **Reiniciá el router** (desenchufar 30 segundos y volver a enchufar)\n3. Probá abrir **cmd** y escribí \`ping 8.8.8.8\`\n\n## Si el ping falla\n- Revisá el adaptador de red en el Panel de Control\n- Ejecutá \`ipconfig /release\` y luego \`ipconfig /renew\` en CMD como administrador\n\n## Si el WiFi no aparece\n- Activá el adaptador WiFi (tecla Fn + WiFi en notebooks)\n- Actualizá los drivers del adaptador de red\n\n## Si nada funciona\nCreá un ticket con categoría **Red** y prioridad **Alta**. Describí qué dispositivos están afectados.`,
        category: 'NETWORK' as TicketCategory,
        tags: ['internet', 'red', 'wifi', 'conectividad'],
        isPublic: true,
      },
      {
        title: 'Cómo configurar el email en Outlook',
        content: `# Configurar email en Outlook\n\n## Configuración automática\n1. Abrí Outlook\n2. Ingresá tu dirección de email corporativa\n3. Hacé click en "Conectar" — Outlook intentará configurarlo automáticamente\n\n## Configuración manual (si la automática falla)\n- **Servidor de correo**: mail.tuempresa.com\n- **Puerto IMAP**: 993 (SSL)\n- **Puerto SMTP**: 587 (TLS)\n- **Usuario**: tu email completo\n\n## Problemas comunes\n- **No llegan emails**: Verificá la carpeta de Spam\n- **No puedo enviar**: Confirmá que SMTP está configurado correctamente\n- **Outlook se cierra**: Ejecutá Outlook en modo seguro: \`outlook /safe\``,
        category: 'EMAIL' as TicketCategory,
        tags: ['outlook', 'email', 'correo', 'configuracion'],
        isPublic: true,
      },
      {
        title: 'Cómo solicitar acceso a una carpeta compartida',
        content: `# Solicitud de acceso a carpetas compartidas\n\n## Proceso\n1. Identificá la ruta de la carpeta (ejemplo: \`\\\\servidor\\Marketing\\Proyectos\`)\n2. Creá un ticket con:\n   - **Categoría**: Accesos y Permisos\n   - **Título**: Solicitud de acceso a [nombre carpeta]\n   - **Descripción**: Incluí la ruta exacta y el motivo del acceso\n3. El ticket será revisado por tu supervisor y por IT\n\n## Tiempos estimados\n- Acceso a carpetas estándar: 2-4 horas hábiles\n- Acceso a carpetas restringidas: requiere aprobación adicional, 1-2 días\n\n## Importante\n- Los accesos se otorgan por grupo, no individualmente\n- Los accesos temporales se revocan automáticamente al vencer`,
        category: 'ACCESS_PERMISSIONS' as TicketCategory,
        tags: ['acceso', 'carpeta', 'permisos', 'red'],
        isPublic: true,
      },
      {
        title: 'Qué hacer si olvidaste tu contraseña',
        content: `# Recuperación de contraseña\n\n## Contraseña de Windows/Red\n1. En la pantalla de login, hacé click en "¿Olvidaste tu contraseña?"\n2. Seguí las instrucciones para verificar tu identidad\n3. Si no funciona, llamá a IT: **Interno 100** o creá un ticket urgente\n\n## Contraseña de email\n- Usá el portal de recuperación: **https://password.tuempresa.com**\n- Necesitarás tu número de empleado\n\n## Contraseñas de aplicaciones\n- Consultá directamente con IT indicando qué aplicación necesitás\n\n## Prevención\n- Usá un gestor de contraseñas (recomendamos Bitwarden)\n- No reutilices contraseñas\n- Cambiá tu contraseña cada 90 días`,
        category: 'ACCESS_PERMISSIONS' as TicketCategory,
        tags: ['contraseña', 'password', 'acceso', 'reset'],
        isPublic: true,
      },
      {
        title: 'Cómo conectar una impresora',
        content: `# Conectar una impresora\n\n## Impresora de red (recomendado)\n1. Abrí **Configuración → Dispositivos → Impresoras y escáneres**\n2. Hacé click en "Agregar una impresora o escáner"\n3. Esperá que aparezca la impresora de red o hacé click en "La impresora no está en la lista"\n4. Ingresá la dirección IP de la impresora (consultá con IT)\n\n## Impresora USB\n1. Conectá el cable USB\n2. Windows instalará los drivers automáticamente\n3. Si no instala, descargá los drivers del sitio del fabricante\n\n## Impresoras disponibles en la oficina\nConsultá con IT el listado actualizado de impresoras por piso.\n\n## Problemas comunes\n- **Offline**: Verificá que esté encendida y con papel\n- **Error de driver**: Desinstalá y reinstalá el driver`,
        category: 'PRINTER' as TicketCategory,
        tags: ['impresora', 'printer', 'driver', 'instalacion'],
        isPublic: true,
      },
      {
        title: 'Cómo limpiar caché del navegador',
        content: `# Limpiar caché del navegador\n\n## Chrome\n1. Presioná **Ctrl + Shift + Del**\n2. Seleccioná "Todo el tiempo" en el rango\n3. Marcá: Cookies, Caché, Historial\n4. Hacé click en "Borrar datos"\n\n## Firefox\n1. Presioná **Ctrl + Shift + Del**\n2. Seleccioná el período\n3. Marcá todo lo que querés borrar\n4. Hacé click en "Borrar ahora"\n\n## Edge\n1. Presioná **Ctrl + Shift + Del**\n2. Seguí los mismos pasos que Chrome\n\n## ¿Cuándo hacerlo?\n- Cuando una página no carga correctamente\n- Cuando ves información desactualizada\n- Después de actualizaciones del sistema`,
        category: 'SOFTWARE' as TicketCategory,
        tags: ['cache', 'navegador', 'chrome', 'firefox', 'edge'],
        isPublic: true,
      },
      {
        title: 'Qué hacer si la PC está lenta',
        content: `# PC lenta — pasos de diagnóstico\n\n## Verificaciones rápidas\n1. **Reiniciá la PC** (no solo apagá/prendé, sino Reiniciar)\n2. Verificá que no haya actualizaciones pendientes que estén instalando\n3. Revisá el **Administrador de tareas** (Ctrl + Shift + Esc) — ¿qué proceso usa más CPU/RAM?\n\n## Soluciones comunes\n- **Disco lleno**: Eliminá archivos temporales con **Liberador de espacio en disco**\n- **Muchos programas al inicio**: Deshabilitá los innecesarios en el Administrador de tareas → Inicio\n- **Malware**: Ejecutá Windows Defender (Seguridad de Windows → Examen rápido)\n\n## Cuándo llamar a IT\n- Si la PC tiene menos de 8GB de RAM y trabaja con aplicaciones pesadas\n- Si el disco tiene menos del 10% libre y ya limpiaste\n- Si el problema persiste después de reiniciar`,
        category: 'HARDWARE' as TicketCategory,
        tags: ['lento', 'performance', 'ram', 'disco', 'optimizacion'],
        isPublic: true,
      },
      {
        title: 'Cómo hacer una videollamada',
        content: `# Videollamadas corporativas\n\n## Microsoft Teams\n1. Abrí Teams y buscá el contacto\n2. Hacé click en el ícono de video (📹)\n3. Verificá que el micrófono y la cámara estén habilitados\n\n## Zoom\n1. Abrí el link de reunión o usá el ID\n2. Permití el acceso al micrófono y cámara cuando lo pida\n3. Hacé click en "Unirse con video"\n\n## Problemas comunes\n- **Sin audio**: Verificá que el micrófono correcto esté seleccionado en configuración\n- **Sin video**: Verificá los permisos de cámara en Configuración → Privacidad\n- **Lag/corte**: Cerrá otras aplicaciones que usen internet, considerá usar cable en vez de WiFi\n\n## Equipamiento disponible\nConsultá con IT si necesitás auriculares con micrófono o cámara web`,
        category: 'SOFTWARE' as TicketCategory,
        tags: ['videollamada', 'teams', 'zoom', 'camara', 'microfono'],
        isPublic: true,
      },
      {
        title: 'Cómo reportar un virus o phishing',
        content: `# Reportar virus o phishing\n\n## ⚠️ IMPORTANTE: Si sospechás un virus\n1. **Desconectá el equipo de la red** (sacá el cable o apagá el WiFi)\n2. **NO apagues el equipo** (puede dificultar el análisis forense)\n3. Llamá a IT INMEDIATAMENTE: **Interno 100**\n4. Creá un ticket con prioridad **CRÍTICA** y categoría **Hardware**\n\n## Cómo identificar phishing\n- Email con urgencia inusual ("Tu cuenta será bloqueada")\n- Remitente con dominio extraño (tuempresa123.com en vez de tuempresa.com)\n- Links que no coinciden con el texto al pasar el mouse\n- Solicitudes de contraseña o datos personales\n\n## Si recibiste un email sospechoso\n1. **NO hagas click** en ningún link\n2. **NO descargues** ningún adjunto\n3. Reenviá el email a: **seguridad@tuempresa.com**\n4. Borrá el email de tu bandeja\n\n## Si ya hiciste click\n¡Avisá a IT de inmediato! El tiempo es crítico.`,
        category: 'SOFTWARE' as TicketCategory,
        tags: ['virus', 'phishing', 'seguridad', 'malware', 'email'],
        isPublic: true,
      },
    ];

    for (const article of kbArticles) {
      const existing = await prisma.knowledgeBase.findFirst({ where: { title: article.title } });
      if (!existing) {
        await prisma.knowledgeBase.create({
          data: { ...article, createdById: adminUser.id },
        });
      }
    }
  }

  // ─── Anuncios IT broadcast room ─────────────────────────────────────────
  if (adminUser) {
    const existingBroadcast = await prisma.chatRoom.findFirst({
      where: { type: 'BROADCAST', name: 'Anuncios IT' },
    });
    if (!existingBroadcast) {
      await prisma.chatRoom.create({
        data: {
          name: 'Anuncios IT',
          type: 'BROADCAST',
          members: { create: { userId: adminUser.id, role: 'ADMIN' } },
        },
      });
    }
  }

  const separator = '═'.repeat(44);
  console.log(`\n${separator}`);
  console.log('✅ Sistema listo para producción');
  console.log(`   Admin: ${adminEmail}`);
  if (!process.env['ADMIN_PASSWORD']) {
    console.log(`   Password: ${rawPassword}`);
    console.log('   ⚠️  Guardá esta contraseña, no se muestra de nuevo');
  } else {
    console.log('   Password: (configurada por ADMIN_PASSWORD en .env)');
  }
  console.log(`${separator}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
