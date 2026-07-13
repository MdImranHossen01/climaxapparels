import {
    Check,
    CheckSquare,
    ChevronDown,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    ListOrdered,
    type LucideIcon,
    TextIcon,
    TextQuote,
} from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";

import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SelectorItem = {
    name: string;
    icon: LucideIcon;
    command: (editor: ReturnType<typeof useEditor>["editor"]) => void;
    isActive: (editor: ReturnType<typeof useEditor>["editor"]) => boolean;
};

const items: SelectorItem[] = [
    {
        name: "Text",
        icon: TextIcon,
        command: (editor) => editor?.chain().focus().clearNodes().run(),
        isActive: (editor) =>
            editor
                ? editor.isActive("paragraph") && !editor.isActive("bulletList") && !editor.isActive("orderedList")
                : false,
    },
    {
        name: "Heading 1",
        icon: Heading1,
        command: (editor) => editor?.chain().focus().clearNodes().toggleHeading({ level: 1 }).run(),
        isActive: (editor) => (editor ? editor.isActive("heading", { level: 1 }) : false),
    },
    {
        name: "Heading 2",
        icon: Heading2,
        command: (editor) => editor?.chain().focus().clearNodes().toggleHeading({ level: 2 }).run(),
        isActive: (editor) => (editor ? editor.isActive("heading", { level: 2 }) : false),
    },
    {
        name: "Heading 3",
        icon: Heading3,
        command: (editor) => editor?.chain().focus().clearNodes().toggleHeading({ level: 3 }).run(),
        isActive: (editor) => (editor ? editor.isActive("heading", { level: 3 }) : false),
    },
    {
        name: "Heading 4",
        icon: Heading4,
        command: (editor) => editor?.chain().focus().clearNodes().toggleHeading({ level: 4 }).run(),
        isActive: (editor) => (editor ? editor.isActive("heading", { level: 4 }) : false),
    },
    {
        name: "Heading 5",
        icon: Heading5,
        command: (editor) => editor?.chain().focus().clearNodes().toggleHeading({ level: 5 }).run(),
        isActive: (editor) => (editor ? editor.isActive("heading", { level: 5 }) : false),
    },
    {
        name: "Heading 6",
        icon: Heading6,
        command: (editor) => editor?.chain().focus().clearNodes().toggleHeading({ level: 6 }).run(),
        isActive: (editor) => (editor ? editor.isActive("heading", { level: 6 }) : false),
    },
    {
        name: "To-do List",
        icon: CheckSquare,
        command: (editor) => editor?.chain().focus().clearNodes().toggleTaskList().run(),
        isActive: (editor) => (editor ? editor.isActive("taskItem") : false),
    },
    {
        name: "Bullet List",
        icon: ListOrdered,
        command: (editor) => editor?.chain().focus().clearNodes().toggleBulletList().run(),
        isActive: (editor) => (editor ? editor.isActive("bulletList") : false),
    },
    {
        name: "Numbered List",
        icon: ListOrdered,
        command: (editor) => editor?.chain().focus().clearNodes().toggleOrderedList().run(),
        isActive: (editor) => (editor ? editor.isActive("orderedList") : false),
    },
    {
        name: "Quote",
        icon: TextQuote,
        command: (editor) => editor?.chain().focus().clearNodes().toggleBlockquote().run(),
        isActive: (editor) => (editor ? editor.isActive("blockquote") : false),
    },
    {
        name: "Code",
        icon: Code,
        command: (editor) => editor?.chain().focus().clearNodes().toggleCodeBlock().run(),
        isActive: (editor) => (editor ? editor.isActive("codeBlock") : false),
    },
];

interface NodeSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NodeSelector = ({ open, onOpenChange }: NodeSelectorProps) => {
    const { editor } = useEditor();
    if (!editor) return null;
    const activeItem = items.filter((item) => item.isActive(editor)).pop() ?? {
        name: "Multiple",
    };

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger
                className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "gap-2 rounded-none border-none hover:bg-accent focus:ring-0 aria-expanded:bg-accent"
                )}
            >
                <span className="whitespace-nowrap text-[0.8rem]">{activeItem.name}</span>
                <ChevronDown className="h-4 w-4" />
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                sideOffset={12}
                align="start"
                className="z-[99999] w-48 max-h-80 overflow-y-auto p-1"
            >
                {items.map((item) => (
                    <EditorBubbleItem
                        key={item.name}
                        onSelect={(editor) => {
                            item.command(editor);
                            onOpenChange(false);
                        }}
                        className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="rounded-sm border p-1">
                                <item.icon className="h-3 w-3" />
                            </div>
                            <span>{item.name}</span>
                        </div>
                        {activeItem.name === item.name && <Check className="h-4 w-4" />}
                    </EditorBubbleItem>
                ))}
            </PopoverContent>
        </Popover>
    );
};

