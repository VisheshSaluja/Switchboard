import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { OverviewPanel } from './OverviewPanel';
import { GitPanel } from './GitPanel';
import { KeysPanel } from './KeysPanel';
import { SnippetsPanel } from './SnippetsPanel';
import { NotesPanel } from './NotesPanel';
import type { Project } from '../../types';
import { FolderOpen, ScrollText, Play, LayoutDashboard, Lock, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectWorkspaceProps {
    project: Project;
    onClose: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const handleRunSnippet = async (command: string) => {
        // For external terminal, we can't easily inject commands yet.
        // Fallback to clipboard for now.
        try {
            await navigator.clipboard.writeText(command);
            toast.success("Command copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy command");
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] md:max-w-5xl h-[85vh] flex flex-col p-0 gap-0 border-border bg-background overflow-hidden shadow-2xl">
                <DialogHeader className="px-4 py-3 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 mr-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                        </div>
                        <DialogTitle className="text-sm font-medium flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-primary" />
                            {project.name}
                        </DialogTitle>
                        <DialogDescription className="hidden">Project Workspace</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-4 py-2 border-b border-border/40 bg-muted/20">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="overview" className="gap-2">
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="git" className="gap-2">
                                    <GitBranch className="w-3.5 h-3.5" />
                                    Git
                                </TabsTrigger>
                                <TabsTrigger value="keys" className="gap-2">
                                    <Lock className="w-3.5 h-3.5" />
                                    Keys
                                </TabsTrigger>
                                <TabsTrigger value="snippets" className="gap-2">
                                    <Play className="w-3.5 h-3.5" />
                                    Commands
                                </TabsTrigger>
                                <TabsTrigger value="notes" className="gap-2">
                                    <ScrollText className="w-3.5 h-3.5" />
                                    Notes
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <div className="flex-1 overflow-hidden p-0 bg-background relative">
                            {activeTab === 'overview' && (
                                <OverviewPanel project={project} onNavigate={setActiveTab} />
                            )}

                            <div className={activeTab === 'git' ? 'h-full' : 'hidden h-full'}>
                                {activeTab === 'git' && (
                                    <GitPanel path={project.path} />
                                )}
                            </div>

                            <div className={activeTab === 'keys' ? 'h-full' : 'hidden h-full'}>
                                {activeTab === 'keys' && (
                                    <KeysPanel 
                                        projectId={project.id} 
                                    />
                                )}
                            </div>

                            <div className={activeTab === 'snippets' ? 'h-full' : 'hidden h-full'}>
                                {activeTab === 'snippets' && (
                                    <SnippetsPanel 
                                        projectId={project.id} 
                                        onRun={handleRunSnippet} 
                                    />
                                )}
                            </div>

                            <div className={activeTab === 'notes' ? 'h-full' : 'hidden h-full'}>
                                {activeTab === 'notes' && (
                                    <NotesPanel 
                                        projectId={project.id} 
                                    />
                                )}
                            </div>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
