import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSocket } from '../../hooks/useSocket';
import { useChatStore } from '../../store/chat.store';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/tickets/my': 'Mis Tickets',
  '/tickets/new': 'Nuevo Ticket',
  '/assets': 'Activos IT',
  '/assets/new': 'Nuevo Activo',
  '/users': 'Usuarios',
  '/metrics': 'Métricas',
  '/profile': 'Mi Perfil',
  '/chat': 'Chat',
  '/knowledge': 'Base de Conocimiento',
};

export default function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Tickora';
  const { fetchUnreadCount } = useChatStore();

  // Initialize socket connection and fetch unread count on mount
  useSocket();
  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
