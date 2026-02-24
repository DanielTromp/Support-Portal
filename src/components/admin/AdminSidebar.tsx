'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Upload,
  Activity,
  FileText,
  BarChart3,
  LogOut,
  ArrowLeft,
  Users,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/chat-config', label: 'Chat Config', icon: Settings },
  { href: '/admin/chat-history', label: 'Chat History', icon: MessageSquare },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/usage', label: 'Usage', icon: BarChart3 },
  { href: '/admin/uploads', label: 'Uploads', icon: Upload },
  { href: '/admin/logs', label: 'System Logs', icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <p className="text-xs text-gray-400 mt-0.5">Support Portal</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-purple text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1 border-t border-gray-800 pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Portal
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full text-left"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
