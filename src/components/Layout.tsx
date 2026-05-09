import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { motion } from 'motion/react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isHeadAdmin } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { name: 'Prefects', path: '/prefects', icon: Users, show: isHeadAdmin || role === 'teacher' },
    { name: 'Logs & Reports', path: '/reports', icon: ClipboardList, show: isHeadAdmin || role === 'teacher' },
    { name: 'System Admin', path: '/admin', icon: Settings, show: isHeadAdmin },
  ];

  if (!user) return <div className="min-h-screen bg-bento-bg flex items-center justify-center p-4">{children}</div>;

  return (
    <div className="min-h-screen bg-bento-bg flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#1E293B] text-white flex-shrink-0 flex flex-col border-r-2 border-bento-border relative z-10">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_0px_white]">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="font-display font-black text-2xl tracking-tighter block leading-none">PrefectGate</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">Duty System</span>
          </div>
        </div>
        
        <nav className="mt-4 px-6 flex-1 space-y-3">
          {navItems.filter(i => i.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all border-2 ${
                location.pathname === item.path 
                  ? 'bg-blue-600 border-white text-white shadow-[4px_4px_0px_0px_white]' 
                  : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-bold tracking-tight">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-6 bg-slate-900 border-t-2 border-slate-800">
          <div className="flex items-center gap-3 mb-6 p-3 bg-slate-800/50 rounded-2xl border border-slate-700">
            <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-slate-400 flex items-center justify-center text-sm font-black text-white">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-200">{user.email}</p>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">{role || 'Authorized'}</p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 text-red-400 bg-red-400/10 border-2 border-transparent hover:border-red-400 rounded-xl font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out System</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.25 }}
           className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
