import React from 'react';
import type { Project } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Terminal, ScrollText, Play, FolderOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { invokeCommand } from '../../lib/tauri';

interface OverviewPanelProps {
    project: Project;
    onNavigate: (tab: string) => void;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ project, onNavigate }) => {
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

                {/* Quick Actions Grid - More Compact */}
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
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                                    {project.notes ? "View documentation" : "No notes yet"}
                                </p>
                                <Button variant="secondary" size="sm" className="w-full h-8 text-xs">Open Notes</Button>
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

                {/* Activity / Stats Mockup */}
                <Card className="border-border/50 bg-card/50 shadow-sm">
                    <CardHeader className="p-4 py-3 border-b border-border/50">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col divide-y divide-border/50">
                             <div className="p-3 text-xs text-muted-foreground text-center italic">
                                No activity recorded in this session.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
