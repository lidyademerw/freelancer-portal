import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderClosed, 
  MessageSquare, 
  FileText, 
  LogOut, 
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { Profile } from '../types/portal';

interface SidebarProps {
  activeTab: 'overview' | 'tasks' | 'files' | 'messages' | 'invoices';
  setActiveTab: (tab: 'overview' | 'tasks' | 'files' | 'messages' | 'invoices') => void;
  currentProfile: Profile;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentProfile,
  onLogout,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  
  const navItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare },
    { id: 'files', name: 'Files', icon: FolderClosed },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'invoices', name: 'Invoices', icon: FileText },
  ] as const;

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            id="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Section */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md"
                style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
              >
                <Layers className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="font-sans font-bold text-base tracking-tight text-white block">Sydney.</span>
                <span className="text-[10px] text-slate-500 font-medium block tracking-wider uppercase -mt-0.5">Client Portal</span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Status Tag */}
          <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Active View</span>
              <span 
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  currentProfile.role === 'admin' 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {currentProfile.role === 'admin' ? 'Admin / Freelancer' : 'Client Access'}
              </span>
            </div>
            {currentProfile.company_name && (
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium truncate">
                Representing: <strong className="text-white">{currentProfile.company_name}</strong>
              </p>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer relative ${
                    isActive 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--brand-color, #6366f1)' } : undefined}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110 text-white' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer Section */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/80">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/40 transition-all">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative">
                <img
                  src={currentProfile.avatar_url}
                  alt={currentProfile.full_name}
                  className="w-10 h-10 rounded-full border border-slate-800 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-white truncate">{currentProfile.full_name}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {currentProfile.role === 'admin' ? 'Studio Partner' : 'Client Partner'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer group shrink-0"
              title="Logout from session"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
