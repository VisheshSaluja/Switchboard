import React, { useEffect, useState } from 'react';
import { invokeCommand } from '../../lib/tauri';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { ExternalLink, Plus, Trash2, Globe, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectLink {
    id: string;
    project_id: string;
    title: string;
    url: string;
    icon: string | null;
}

interface LinksPanelProps {
    projectId: string;
}

export const LinksPanel: React.FC<LinksPanelProps> = ({ projectId }) => {
    const [links, setLinks] = useState<ProjectLink[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadLinks();
    }, [projectId]);

    const loadLinks = async () => {
        try {
            const data = await invokeCommand<ProjectLink[]>('get_project_links', { projectId });
            setLinks(data);
        } catch (e) {
            console.error(e);
        }
    };

    const ensureProtocol = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const handleCreate = async () => {
        if (!newTitle || !newUrl) return;
        const validUrl = ensureProtocol(newUrl);
        try {
            await invokeCommand('add_project_link', {
                projectId,
                title: newTitle,
                url: validUrl,
                icon: null
            });
            setNewTitle('');
            setNewUrl('');
            setIsCreating(false);
            loadLinks();
            toast.success("Link added");
        } catch (e) {
            console.error(e);
            toast.error("Failed to add link");
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await invokeCommand('delete_project_link', { id });
            loadLinks();
            toast.success("Link removed");
        } catch (e) {
            console.error(e);
            toast.error("Failed to remove link");
        }
    };

    const handleOpen = async (url: string) => {
        try {
            const validUrl = ensureProtocol(url);
            await invokeCommand('open_url', { url: validUrl });
        } catch (e) {
            console.error(e);
            toast.error("Failed to open link");
        }
    };

    const handleOpenAll = async () => {
        if (links.length === 0) return;
        try {
            for (const link of links) {
                const validUrl = ensureProtocol(link.url);
                await invokeCommand('open_url', { url: validUrl });
            }
            toast.success(`Opened ${links.length} tabs`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to launch links");
        }
    };

    return (
        <div className="space-y-3 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-1">
                 <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Context Links
                </h3>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setIsCreating(!isCreating)} title="Add Link">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Launch Action */}
            {links.length > 0 && (
                <Button variant="default" className="w-full gap-2 shadow-sm" onClick={handleOpenAll}>
                    <Rocket className="w-4 h-4" />
                    Launch Environment
                </Button>
            )}

            {isCreating && (
                <div className="p-3 border border-border/50 rounded-lg bg-muted/50 space-y-3">
                    <Input 
                        placeholder="Title (e.g. Figma Design)" 
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)}
                        className="bg-background h-8 text-sm"
                    />
                    <div className="flex gap-2">
                        <Input 
                            placeholder="URL (e.g. https://www.figma.com/...)" 
                            value={newUrl} 
                            onChange={e => setNewUrl(e.target.value)}
                            className="font-mono text-xs bg-background h-8"
                        />
                        <Button onClick={handleCreate} disabled={!newTitle || !newUrl} size="sm" className="h-8">
                            Save
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto pr-1">
                {links.length === 0 && !isCreating && (
                   <p className="text-center text-xs text-muted-foreground py-8 col-span-2 border border-dashed border-border rounded-lg">
                       No links recorded. Add your deployed URL, Figma, or Linear board.
                   </p>
                )}
                {links.map(link => (
                    <Card key={link.id} className="group hover:border-primary/40 transition-all shadow-sm cursor-pointer" onClick={() => handleOpen(link.url)}>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-sm text-foreground truncate">{link.title}</div>
                                    <div className="text-xs text-muted-foreground truncate opacity-70 font-mono max-w-[150px]">{link.url}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => handleDelete(link.id, e)}
                                    title="Remove Link"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-primary hover:bg-primary/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpen(link.url);
                                    }}
                                    title="Open Exterior"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
