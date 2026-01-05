import React from 'react';
import { Terminal as TermIcon } from 'lucide-react';
import { Sidebar } from '../Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  onNewProject: (mode: 'create' | 'import' | 'clone') => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  onNewProject 
}) => {
  return (
    <div className="flex h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <Sidebar 
        onNewProject={onNewProject}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-full bg-background relative">
         {/* Breadcrumb / Top Bar */}
         <header className="h-16 border-b border-border/40 flex items-center px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center text-sm text-muted-foreground gap-2">
                <TermIcon className="w-4 h-4" />
                <span>/</span>
                <span className="text-foreground font-medium capitalize">Projects</span>
            </div>
         </header>

         <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
         </div>
      </main>
    </div>
  );
};

