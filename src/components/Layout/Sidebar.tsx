import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { gsap } from 'gsap';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Timer,
  FileText,
  Target,
  GraduationCap,
  Menu,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Smart Routine', path: '/routine' },
    { icon: BookOpen, label: 'Syllabus Tracker', path: '/syllabus' },
    { icon: Timer, label: 'Study Timer', path: '/timer' },
    { icon: FileText, label: 'Notes', path: '/notes' },
    { icon: GraduationCap, label: 'Exams', path: '/exams' },
    { icon: Target, label: 'Goals', path: '/goals' },
  ];

  useEffect(() => {
    // Animate sidebar expansion/collapse
    gsap.to('.sidebar', {
      width: isExpanded ? '240px' : '64px',
      duration: 0.3,
      ease: 'power2.out'
    });
  }, [isExpanded]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="sidebar fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          {isExpanded && (
            <h1 className="font-bold text-sidebar-foreground text-lg">EduSync</h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start h-10 ${
                  isExpanded ? 'px-3' : 'px-0 justify-center'
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {isExpanded && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-2">
        {/* Theme Toggle */}
{isExpanded && (
  <div className="flex items-center justify-between px-3 h-10">
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <span className="text-sm">Theme</span>
    </div>
    <div className="flex items-center gap-2">
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-primary"
      />
      <Moon className="h-4 w-4" />
    </div>
  </div>
)}

        {/* Logout */}
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 text-destructive hover:text-destructive-foreground hover:bg-destructive ${
            isExpanded ? 'px-3' : 'px-0 justify-center'
          }`}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {isExpanded && <span className="ml-3 text-sm font-medium">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;