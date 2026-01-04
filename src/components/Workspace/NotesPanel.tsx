import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Textarea } from '../ui/textarea';

interface NotesPanelProps {
    projectId: string;
    initialNotes?: string;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ projectId, initialNotes }) => {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isSaving, setIsSaving] = useState(false);
    
    // We can use a ref to debounce saving
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setNotes(initialNotes || '');
    }, [initialNotes]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNotes(val);
        setIsSaving(true);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                // await invokeCommand('update_project_notes', { projectId, notes: val });
                await useAppStore.getState().updateProjectNotes(projectId, val);
                
                // We'll optimistically assume it saved, but good to maybe fetch/refresh if critical
                // For now, simple auto-save logic
                setIsSaving(false);
            } catch (err) {
                console.error("Failed to save notes", err);
                setIsSaving(false);
            }
        }, 1000);
    };

    return (
        <div className="h-full flex flex-col space-y-2">
            <div className="flex justify-between items-center px-1">
                <span className="text-xs text-muted-foreground">
                    {isSaving ? 'Saving...' : 'All changes saved locally'}
                </span>
            </div>
            <Textarea 
                value={notes} 
                onChange={handleChange}
                className="flex-1 resize-none font-mono text-sm leading-relaxed p-4 bg-card/50"
                placeholder="Markdown notes, meeting minutes, TODOs..."
            />
        </div>
    );
};
