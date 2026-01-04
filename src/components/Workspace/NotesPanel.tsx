import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Plus, Trash2, Edit2, Notebook, Calendar, Loader2, Settings2, Filter, X } from 'lucide-react';
import { invokeCommand } from '../../lib/tauri';
import { toast } from 'sonner';
import { useAppStore } from '../../stores/useAppStore';
import type { ProjectNote, ProjectSettings } from '../../types';

interface NotesPanelProps {
    projectId: string;
}

const DEFAULT_LABELS: Record<string, string> = {
    yellow: 'General',
    blue: 'Idea',
    green: 'Done',
    red: 'Bug',
    purple: 'Feature'
};

const COLORS = [
    { id: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', indicator: 'bg-yellow-400' },
    { id: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', indicator: 'bg-blue-400' },
    { id: 'green', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', indicator: 'bg-green-400' },
    { id: 'red', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', indicator: 'bg-red-400' },
    { id: 'purple', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', indicator: 'bg-purple-400' },
];

export const NotesPanel: React.FC<NotesPanelProps> = ({ projectId }) => {
    const [notes, setNotes] = useState<ProjectNote[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Project Settings from Store
    const project = useAppStore(s => s.projects.find(p => p.id === projectId));
    const updateProjectSettings = useAppStore(s => s.updateProjectSettings);

    const labels = useMemo(() => {
        if (!project?.settings) return DEFAULT_LABELS;
        try {
            const parsed: ProjectSettings = JSON.parse(project.settings);
            return { ...DEFAULT_LABELS, ...parsed.note_labels };
        } catch (e) {
            return DEFAULT_LABELS;
        }
    }, [project?.settings]);

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState('yellow');

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempLabels, setTempLabels] = useState<Record<string, string>>(DEFAULT_LABELS);

    // Delete State
    const [noteToDelete, setNoteToDelete] = useState<ProjectNote | null>(null);

    // Filter State
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    // Filtered Notes
    const filteredNotes = useMemo(() => {
        if (!activeFilter) return notes;
        return notes.filter(n => n.color === activeFilter);
    }, [notes, activeFilter]);

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const data = await invokeCommand<ProjectNote[]>('get_project_notes', { projectId });
            setNotes(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load notes");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [projectId]);

    const handleCreate = () => {
        setEditingNote(null);
        setTitle('');
        setContent('');
        setColor('yellow');
        setIsEditorOpen(true);
    };

    const handleEdit = (note: ProjectNote) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setColor(note.color);
        setIsEditorOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        try {
            if (editingNote) {
                await invokeCommand('update_project_note', {
                    id: editingNote.id,
                    title,
                    content,
                    color
                });
                toast.success("Note updated");
            } else {
                await invokeCommand('create_project_note', {
                    projectId,
                    title,
                    content,
                    color
                });
                toast.success("Note created");
            }
            setIsEditorOpen(false);
            fetchNotes(); 
        } catch (e) {
            console.error(e);
            toast.error("Failed to save note");
        }
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;
        
        try {
            await invokeCommand('delete_project_note', { id: noteToDelete.id });
            toast.success("Note deleted");
            setNoteToDelete(null);
            fetchNotes();
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete note");
        }
    };

    const openSettings = () => {
        setTempLabels({...labels});
        setIsSettingsOpen(true);
    }

    const saveSettings = async () => {
        try {
            const settingsObj: ProjectSettings = { note_labels: tempLabels };
            await updateProjectSettings(projectId, JSON.stringify(settingsObj));
            toast.success("Labels updated");
            setIsSettingsOpen(false);
        } catch (e) {
            toast.error("Failed to save labels");
        }
    }

    const getColorStyle = (id: string) => COLORS.find(c => c.id === id) || COLORS[0];

    return (
        <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Notebook className="w-5 h-5 text-primary" />
                        Project Notes
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Keep track of ideas, bugs, and requirements.
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Filter UI */}
                    <div className="flex gap-1 mr-2 px-2 py-1 bg-muted/20 rounded-lg">
                        {COLORS.map(c => {
                            const isActive = activeFilter === c.id;
                            const label = labels[c.id];
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveFilter(isActive ? null : c.id)}
                                    className={`w-4 h-4 rounded-full transition-all ${c.indicator} ${isActive ? 'ring-2 ring-foreground ring-offset-2 scale-110' : 'opacity-40 hover:opacity-80 hover:scale-105'}`}
                                    title={`Filter by ${label}`}
                                />
                            )
                        })}
                        {activeFilter && (
                             <button
                                onClick={() => setActiveFilter(null)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                title="Clear filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                
                    <Button variant="outline" size="sm" onClick={openSettings}>
                        <Settings2 className="w-4 h-4 mr-1" />
                        Labels
                    </Button>
                    <Button size="sm" onClick={handleCreate} className="gap-1">
                        <Plus className="w-4 h-4" />
                        New Note
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Notebook className="w-10 h-10 mb-2 opacity-20" />
                        <p>{notes.length > 0 ? "No notes match this filter" : "No notes yet"}</p>
                        {notes.length === 0 && (
                            <Button variant="link" onClick={handleCreate}>Create one</Button>
                        )}
                        {notes.length > 0 && (
                            <Button variant="link" onClick={() => setActiveFilter(null)}>Clear filter</Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                        {filteredNotes.map(note => {
                            const style = getColorStyle(note.color);
                            const label = labels[note.color] || 'Note';
                            
                            return (
                                <Card 
                                    key={note.id} 
                                    className={`group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${style.bg} ${style.border} border`}
                                    onClick={() => handleEdit(note)}
                                >
                                    <div className={`h-1 w-full rounded-t-lg ${style.indicator}`} />
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                                                    {label}
                                                </div>
                                                <h3 className="font-semibold leading-tight line-clamp-1">{note.title}</h3>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 -mt-1 -mr-2 relative z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNoteToDelete(note);
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-4 font-mono whitespace-pre-wrap">
                                            {note.content || <span className="italic opacity-50">Empty note...</span>}
                                        </p>
                                        <div className="pt-2 flex items-center text-[10px] text-muted-foreground/70 gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {note.updated_at} 
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Editor Dialog */}
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto py-2 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input 
                                placeholder="Note Title" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setColor(c.id)}
                                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-2 ${c.bg} ${c.border} ${color === c.id ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${c.indicator}`} />
                                        {labels[c.id] || c.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col min-h-[200px]">
                            <label className="text-sm font-medium">Content</label>
                            <Textarea 
                                placeholder="Write something..." 
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="flex-1 font-mono text-sm resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Note</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Customize Labels</DialogTitle>
                        <DialogDescription>
                            Define what each color represents for this project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {COLORS.map(c => (
                            <div key={c.id} className="grid grid-cols-4 items-center gap-4">
                                <div className="flex items-center gap-2 col-span-1">
                                    <div className={`w-4 h-4 rounded-full ${c.indicator}`} />
                                    <span className="text-sm font-medium capitalize">{c.id}</span>
                                </div>
                                <Input 
                                    className="col-span-3" 
                                    value={tempLabels[c.id] || ''} 
                                    onChange={e => setTempLabels(prev => ({...prev, [c.id]: e.target.value}))}
                                    placeholder={`Label for ${c.id}`}
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={saveSettings}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Note</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{noteToDelete?.title}"</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
