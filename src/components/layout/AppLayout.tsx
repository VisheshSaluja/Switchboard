import React from 'react';
import { LayoutGrid, Server, Plus, Settings, Terminal as TermIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: 'projects' | 'ssh';
  onChangeView: (view: 'projects' | 'ssh') => void;
  onNewProject: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  activeView, 
  onChangeView, 
  onNewProject 
}) => {
  return (
    <div className="flex h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/50 backdrop-blur-xl flex flex-col h-full fixed left-0 top-0 z-10">
        <div className="p-6 h-16 flex items-center border-b border-border/40">
           <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
             Switchboard
           </div>
        </div>

        <div className="flex-1 px-3 py-6 space-y-1">
          <NavItem 
            isActive={activeView === 'projects'} 
            onClick={() => onChangeView('projects')} 
            icon={<LayoutGrid className="w-4 h-4" />}
            label="Projects"
          />
          <NavItem 
            isActive={activeView === 'ssh'} 
            onClick={() => onChangeView('ssh')} 
            icon={<Server className="w-4 h-4" />}
            label="SSH Hosts"
          />
        </div>

        <div className="p-4 border-t border-border/40 space-y-2">
            <Button onClick={onNewProject} className="w-full justify-start gap-2" variant="outline">
                <Plus className="w-4 h-4" />
                New Workspace
            </Button>
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
                <Settings className="w-3 h-3" />
                <span>v0.1.0 Beta</span>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-w-0 flex flex-col h-full bg-background relative">
         {/* Breadcrumb / Top Bar */}
         <header className="h-16 border-b border-border/40 flex items-center px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center text-sm text-muted-foreground gap-2">
                <TermIcon className="w-4 h-4" />
                <span>/</span>
                <span className="text-foreground font-medium capitalize">{activeView}</span>
            </div>
         </header>

         <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
         </div>
      </main>
    </div>
  );
};

interface NavItemProps {
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const NavItem: React.FC<NavItemProps> = ({ isActive, onClick, icon, label }) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group relative",
                isActive 
                    ? "text-foreground bg-accent" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
        >
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 bg-blue-500 rounded-r-full" />
            )}
            {icon}
            {label}
        </button>
    )
};
