import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, Grid, Receipt, UtensilsCrossed, CreditCard, PieChart, Settings, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Layout() {
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Stollar', href: '/tables', icon: Grid },
    { name: 'Buyurtmalar', href: '/orders', icon: Receipt },
    { name: 'Menyu', href: '/menu', icon: UtensilsCrossed },
    { name: 'To‘lovlar', href: '/payments', icon: CreditCard },
    { name: 'Hisobotlar', href: '/reports', icon: PieChart },
    { name: 'Sozlamalar', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar text-white flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">RestoPOS</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'
                )
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Kassir</p>
              <p className="text-sm font-semibold text-white">{user?.full_name || 'Kassir'}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors group">
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Chiqish</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
