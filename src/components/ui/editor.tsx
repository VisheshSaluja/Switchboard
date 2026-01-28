import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, CheckSquare, Heading1, Heading2, Quote, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

// Helper for classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Setup lowlight
const lowlight = createLowlight(common);

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    className?: string;
    projectId?: string; // Keeping as optional or removing if unused in parents. Let's make it optional to avoidbreaking parent if passed
}

export const Editor = ({ content, onChange, editable = true, className }: EditorProps) => {
    
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                codeBlock: false,
            }),
            Placeholder.configure({
                placeholder: 'Type "/" for commands, or just start writing...',
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            BubbleMenuExtension,
        ],
        content: content,
        editable: editable,
        editorProps: {
            attributes: {
                class: cn(
                    "prose dark:prose-invert max-w-none focus:outline-none min-h-[300px]",
                    "prose-p:my-2 prose-headings:my-4 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic",
                    "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6",
                    "prose-img:rounded-lg prose-img:border prose-img:shadow-sm",
                    "prose-pre:bg-muted/50 prose-pre:border prose-pre:p-4 prose-pre:rounded-lg prose-pre:text-green-600 dark:prose-pre:text-green-400 prose-pre:font-mono",
                    className
                ),
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Update editable state when prop changes
    useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);

    // Update content when prop changes (external updates)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if content is sufficiently different to avoid cursor jumps
            // Use a simple check or just check if it's empty vs not
             if (editor.getHTML() === '<p></p>' && content === '') return;
             
             // This check is a bit naive but prevents loops if onChange updates content immediately
             // Ideally we only setContent if it's a "reset" or "load"
             // For now, let's trust the parent passes the correct content on mount/reset
             // and only update if the editor is empty (initial load) or we really moved to a new note
             // But WAIT, if we switch notes, content changes. 
             // Since we use the same Editor instance in the Dialog, we MUST update content.
             const currentContent = editor.getHTML();
             if (currentContent !== content) {
                 // We need to be careful not to overwrite typing.
                 // The parent 'content' state is updated via onChange.
                 // So 'content' should match 'currentContent' mostly.
                 // The only time they differ significantly is when we switch notes.
                 // But we can't easily detect "switching notes" here without an ID.
                 // Let's rely on the fact that if we are typing, the update loop is fast.
                 // But wait, if I type "a", onChange("a"), parent updates content="a", prop content="a".
                 // Editor has "a". They match.
                 // If I switch to Note B, prop content="B". Editor has "A". They differ.
                 // So we should setContent.
                 // The only risk is if there are slight HTML variations.
                 // TipTap cleans HTML.
                 // Let's implement a safer check: compare text content? No.
                 // Let's use emitUpdate: false to prevent loops?
                 // Let's use emitUpdate: false to prevent loops
                 editor.commands.setContent(content, { emitUpdate: false });
             }
        }
    }, [editor, content]);

    if (!editor) return null;

    return (
        <div className="relative w-full h-full flex flex-col">
            {editable && (
                <div className="flex items-center gap-1 p-2 border-b bg-muted/20 sticky top-0 z-10 flex-wrap">
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                        isActive={editor.isActive('heading', { level: 1 })}
                    >
                        <Heading1 className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                        isActive={editor.isActive('heading', { level: 2 })}
                    >
                        <Heading2 className="w-4 h-4" />
                    </ToolbarButton>
                    
                    <div className="w-px h-6 bg-border mx-1" />

                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleBold().run()} 
                        isActive={editor.isActive('bold')}
                    >
                        <Bold className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleItalic().run()} 
                        isActive={editor.isActive('italic')}
                    >
                        <Italic className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleStrike().run()} 
                        isActive={editor.isActive('strike')}
                    >
                        <Strikethrough className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleCode().run()} 
                        isActive={editor.isActive('code')}
                    >
                        <Code className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                        isActive={editor.isActive('codeBlock')}
                    >
                        <Terminal className="w-4 h-4" />
                    </ToolbarButton>

                    <div className="w-px h-6 bg-border mx-1" />

                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleBulletList().run()} 
                        isActive={editor.isActive('bulletList')}
                    >
                        <List className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                        isActive={editor.isActive('orderedList')}
                    >
                        <ListOrdered className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleTaskList().run()} 
                        isActive={editor.isActive('taskList')}
                    >
                        <CheckSquare className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                        isActive={editor.isActive('blockquote')}
                    >
                        <Quote className="w-4 h-4" />
                    </ToolbarButton>
                </div>
            )}
            
            {/* {editable && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="flex items-center gap-1 p-1 rounded-lg border bg-background shadow-lg">
                        <ToolbarButton 
                            onClick={() => editor.chain().focus().toggleBold().run()} 
                            isActive={editor.isActive('bold')}
                            size="xs"
                        >
                            <Bold className="w-3 h-3" />
                        </ToolbarButton>
                        <ToolbarButton 
                            onClick={() => editor.chain().focus().toggleItalic().run()} 
                            isActive={editor.isActive('italic')}
                            size="xs"
                        >
                            <Italic className="w-3 h-3" />
                        </ToolbarButton>
                         <ToolbarButton 
                            onClick={() => editor.chain().focus().toggleStrike().run()} 
                            isActive={editor.isActive('strike')}
                            size="xs"
                        >
                            <Strikethrough className="w-3 h-3" />
                        </ToolbarButton>
                        <ToolbarButton 
                            onClick={() => editor.chain().focus().toggleCode().run()} 
                            isActive={editor.isActive('code')}
                            size="xs"
                        >
                            <Code className="w-3 h-3" />
                        </ToolbarButton>
                    </div>
                </BubbleMenu>
            )} */}

            <div className="flex-1 overflow-y-auto cursor-text p-4" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

// Toolbar Button Component
interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    size?: 'sm' | 'xs';
}

const ToolbarButton = ({ onClick, isActive, children, size = 'sm' }: ToolbarButtonProps) => (
    <button
        onClick={onClick}
        className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 hover:bg-muted text-muted-foreground hover:text-foreground",
            size === 'sm' ? "h-8 w-8" : "h-6 w-6",
            isActive && "bg-muted text-primary"
        )}
    >
        {children}
    </button>
);
