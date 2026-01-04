import React, { useEffect, useState, useMemo } from 'react';
import type { Project, ProjectNote, ProjectSettings } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Terminal, ScrollText, Play, FolderOpen, Activity, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { invokeCommand } from '../../lib/tauri';

interface OverviewPanelProps {
    project: Project;
    onNavigate: (tab: string) => void;
}

const DEFAULT_LABELS: Record<string, string> = {
    yellow: 'General',
    blue: 'Idea',
    green: 'Done',
    red: 'Bug',
    purple: 'Feature'
};

const COLORS = [
    { id: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', indicator: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
    { id: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', indicator: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400' },
    { id: 'green', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', indicator: 'bg-green-400', text: 'text-green-600 dark:text-green-400' },
    { id: 'red', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', indicator: 'bg-red-400', text: 'text-red-600 dark:text-red-400' },
    { id: 'purple', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', indicator: 'bg-purple-400', text: 'text-purple-600 dark:text-purple-400' },
];

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ project, onNavigate }) => {
    const [notes, setNotes] = useState<ProjectNote[]>([]);

    useEffect(() => {
        invokeCommand<ProjectNote[]>('get_project_notes', { projectId: project.id })
            .then(setNotes)
            .catch(console.error);
    }, [project.id]);

    const labels = useMemo(() => {
        if (!project.settings) return DEFAULT_LABELS;
        try {
            const parsed: ProjectSettings = JSON.parse(project.settings);
            return { ...DEFAULT_LABELS, ...parsed.note_labels };
        } catch (e) {
            return DEFAULT_LABELS;
        }
    }, [project.settings]);

    const noteStats = useMemo(() => {
        const stats: Record<string, number> = {};
        notes.forEach(note => {
            stats[note.color] = (stats[note.color] || 0) + 1;
        });
        return stats;
    }, [notes]);

    const handleLaunchTerminal = async () => {
        try {
            await invokeCommand('open_external_terminal', { path: project.path });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-full w-full p-4 overflow-y-auto bg-muted/5 scrollbar-thin">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FolderOpen className="w-8 h-8 text-primary/80" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
                            <div className="text-xs text-muted-foreground font-mono truncate max-w-md">
                                {project.path}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm" onClick={handleLaunchTerminal}>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-blue-500" />
                                    Terminal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-xs text-muted-foreground mb-3">Integrated shell access</p>
                                <Button variant="secondary" size="sm" className="w-full h-8 text-xs" onClick={(e) => {
                                    e.stopPropagation();
                                    handleLaunchTerminal();
                                }}>Launch External</Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm" onClick={() => onNavigate('notes')}>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <ScrollText className="w-4 h-4 text-yellow-500" />
                                    Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-xs text-muted-foreground mb-3">
                                    {notes.length === 0 ? "No notes yet" : `${notes.length} note${notes.length === 1 ? '' : 's'} recorded`}
                                </p>
                                <Button variant="secondary" size="sm" className="w-full h-8 text-xs">Manage Notes</Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm" onClick={() => onNavigate('snippets')}>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Play className="w-4 h-4 text-green-500" />
                                    Commands
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-xs text-muted-foreground mb-3">Run snippets</p>
                                <Button variant="secondary" size="sm" className="w-full h-8 text-xs">View All</Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Project Status / Health */}
                <Card className="border-border/50 bg-card/50 shadow-sm">
                    <CardHeader className="p-4 py-3 border-b border-border/50">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" />
                            Project Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {notes.length === 0 ? (
                             <div className="p-8 text-xs text-muted-foreground text-center italic flex flex-col items-center gap-2">
                                <Tag className="w-8 h-8 opacity-20" />
                                Create notes with labels to see project health stats here.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-border/50">
                                {COLORS.map(c => {
                                    const count = noteStats[c.id] || 0;
                                    const label = labels[c.id] || c.id;
                                    
                                    return (
                                        <div key={c.id} className="p-4 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors">
                                            <div className={`text-2xl font-bold ${c.text}`}>
                                                {count}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${c.indicator}`} />
                                                <span className="text-xs font-medium text-muted-foreground capitalize truncate max-w-[80px]" title={label}>
                                                    {label}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
