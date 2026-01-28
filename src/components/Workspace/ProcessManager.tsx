import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Square, Plus, Terminal as TerminalIcon, LayoutList } from 'lucide-react';
import { ProjectTerminal } from './ProjectTerminal';
import { invokeCommand } from '../../lib/tauri';
import { toast } from 'sonner';

interface Process {
    id: string;
    command: string;
    cwd: string;
    running: boolean;
    pid: number;
}

interface ProcessManagerProps {
    path: string;
}

export const ProcessManager: React.FC<ProcessManagerProps> = ({ path }) => {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [newCommand, setNewCommand] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        invokeCommand<Process[]>('get_active_processes')
            .then(setProcesses)
            .catch(err => {
                console.error("Failed to fetch active processes:", err);
                toast.error("Failed to restore process list");
            });
    }, []);

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommand.trim()) return;

        try {
            const process = await invokeCommand<Process>('start_process', { 
                command: newCommand, 
                cwd: path 
            });
            setProcesses(prev => [...prev, process]);
            setSelectedId(process.id);
            setNewCommand('');
            toast.success("Process started");
        } catch (err) {
            console.error(err);
            toast.error("Failed to start process");
        }
    };

    const handleStop = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await invokeCommand('stop_process', { id });
            setProcesses(prev => prev.filter(p => p.id !== id));
            if (selectedId === id) setSelectedId(null);
            toast.success("Process terminated");
        } catch (err) {
            toast.error("Failed to stop process");
        }
    };

    return (
        <div className="flex h-full w-full bg-background">
            {/* Sidebar List */}
            <div className="w-64 border-r border-border flex flex-col bg-muted/5">
                <div className="p-4 border-b border-border">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <LayoutList className="w-4 h-4" />
                        Active Processes
                    </h3>
                    <form onSubmit={handleStart} className="flex gap-2">
                        <Input 
                            value={newCommand}
                            onChange={(e) => setNewCommand(e.target.value)}
                            placeholder="npm run dev..."
                            className="h-8 text-xs font-mono"
                        />
                        <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
                
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {processes.map(proc => (
                            <div 
                                key={proc.id}
                                onClick={() => setSelectedId(proc.id)}
                                className={`
                                    group flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors
                                    ${selectedId === proc.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                                `}
                            >
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                                    <span className="truncate font-mono text-xs" title={proc.command}>
                                        {proc.command}
                                    </span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => handleStop(proc.id, e)}
                                >
                                    <Square className="w-3 h-3 fill-current" />
                                </Button>
                            </div>
                        ))}
                        {processes.length === 0 && (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No active processes
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Terminal Area */}
            <div className="flex-1 h-full min-w-0 bg-zinc-950 flex flex-col">
                {selectedId ? (
                    <ProjectTerminal processId={selectedId} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2">
                        <TerminalIcon className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Select or start a process</p>
                    </div>
                )}
            </div>
        </div>
    );
};
