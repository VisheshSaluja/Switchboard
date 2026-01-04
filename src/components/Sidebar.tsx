import React from 'react';
import { LayoutGrid, Server, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeView: 'projects' | 'ssh';
  onChangeView: (view: 'projects' | 'ssh') => void;
  onNewProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, onNewProject }) => {
  return (
    <div className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          Switchboard
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <button
          onClick={() => onChangeView('projects')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            activeView === 'projects' 
              ? "bg-gray-900 text-white" 
              : "text-gray-400 hover:text-white hover:bg-gray-900/50"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Projects
        </button>
        <button
          onClick={() => onChangeView('ssh')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            activeView === 'ssh' 
              ? "bg-gray-900 text-white" 
              : "text-gray-400 hover:text-white hover:bg-gray-900/50"
          )}
        >
          <Server className="w-4 h-4" />
          SSH Hosts
        </button>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>
    </div>
  );
};
