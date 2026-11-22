import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  UploadCloud,
  Users,
  GitCompare,
  Sparkles,
  BotMessageSquare,
  BookOpenText,
  HelpCircle,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Job Openings', path: '/jobs', icon: Briefcase },
  { name: 'Upload Resume', path: '/upload', icon: UploadCloud },
  { name: 'Candidates', path: '/candidates', icon: Users },
  { name: 'Candidate Compare', path: '/compare', icon: GitCompare },
  { name: 'AI Job Matching', path: '/matching', icon: Sparkles },
  { name: 'RAG Resume Chat', path: '/rag-resume', icon: BotMessageSquare, badge: 'RAG' },
  { name: 'HR Knowledge Hub', path: '/rag-knowledge', icon: BookOpenText },
  { name: 'Interview Generator', path: '/interview', icon: HelpCircle },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-md shadow-primary-500/20 font-bold text-lg">
            T
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
              TalentMatch AI
            </h1>
            <p className="text-[11px] font-medium text-primary-600 dark:text-primary-400 mt-1 uppercase tracking-wider">
              RAG Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Recruitment Hub
          </div>
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/80 text-primary-700 dark:text-primary-300 font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.full_name ? user.full_name[0] : 'R'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.full_name || 'Recruiter'}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                  {user?.company_name || 'TechCorp AI'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
