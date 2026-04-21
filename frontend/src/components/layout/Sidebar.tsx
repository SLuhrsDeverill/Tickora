import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Monitor,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  MessageSquare,
  Bot,
  BookOpen,
  KanbanSquare,
  Package,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { useChatStore } from '../../store/chat.store';
import clsx from 'clsx';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
  badge?: () => number;
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const unreadCount = useChatStore((s) => s.unreadCount);
  const role = user?.role || '';

  const navItems: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },

    // Tickets section
    { to: '/tickets', icon: <Ticket size={20} />, label: 'Lista de tickets' },
    { to: '/tickets/kanban', icon: <KanbanSquare size={20} />, label: 'Vista Kanban', roles: ['ADMIN', 'IT_AGENT'] },
    { to: '/tickets/my', icon: <Ticket size={20} />, label: 'Mis tickets' },

    // Chat
    {
      to: '/chat',
      icon: <MessageSquare size={20} />,
      label: 'Chat',
      badge: () => unreadCount,
    },

    // HelpBot (employee only)
    ...(role === 'EMPLOYEE' ? [{ to: '/bot', icon: <Bot size={20} />, label: 'HelpBot' }] : []),

    // Knowledge base
    { to: '/knowledge', icon: <BookOpen size={20} />, label: 'Base de conocimiento' },

    // Assets
    { to: '/assets', icon: <Monitor size={20} />, label: 'Inventario', roles: ['ADMIN', 'IT_AGENT'] },
    { to: '/assets/assignments', icon: <Package size={20} />, label: 'Asignaciones', roles: ['ADMIN', 'IT_AGENT'] },

    // Metrics
    { to: '/metrics', icon: <BarChart3 size={20} />, label: 'Métricas', roles: ['ADMIN', 'IT_AGENT'] },

    // Users
    { to: '/users', icon: <Users size={20} />, label: 'Usuarios', roles: ['ADMIN', 'IT_AGENT'] },
  ];

  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside
      className={clsx(
        'flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 min-h-screen',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-base leading-none select-none">
              🎫
            </div>
            <span className="font-semibold text-sm">Tickora</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const badgeCount = item.badge ? item.badge() : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/tickets'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <span className="shrink-0 relative">
                {item.icon}
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="p-3 border-t border-slate-700 space-y-1">
        {role === 'ADMIN' && (
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Settings size={20} className="shrink-0" />
            {!sidebarCollapsed && <span>Configuración</span>}
          </NavLink>
        )}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )
          }
        >
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
          )}
        </NavLink>

        <button
          onClick={() => logout()}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-slate-400 hover:bg-slate-800 hover:text-white',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!sidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
