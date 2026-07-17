import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  RiDashboardLine, 
  RiHistoryLine, 
  RiBarChartGroupedLine, 
  RiSettings4Line, 
  RiLogoutBoxLine,
  RiCloseLine
} from 'react-icons/ri'; // Import icons

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <RiDashboardLine size={20} /> },
    { name: 'History Logs', path: '/history', icon: <RiHistoryLine size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <RiBarChartGroupedLine size={20} /> },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin Console', path: '/admin', icon: <RiSettings4Line size={20} /> });
  }

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-text-primary/45 z-20 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 bg-card-white border-r border-border-light/50 
        flex flex-col z-35 transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-border-light/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-luxury-gold flex items-center justify-center text-white font-bold font-display shadow-gold">
              FG
            </div>
            <span className="text-lg font-bold font-display tracking-tight text-text-primary">
              FuelGuard <span className="text-luxury-gold">AI</span>
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-lg text-text-secondary hover:bg-russian-white"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                isActive ? 'sidebar-item-active' : 'sidebar-item'
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-light/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-danger hover:bg-red-50 font-medium transition-colors"
          >
            <RiLogoutBoxLine size={20} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};
