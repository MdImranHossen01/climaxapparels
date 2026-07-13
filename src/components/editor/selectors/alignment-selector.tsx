"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { useEditor } from "novel";
import "@tiptap/extension-text-align";

type Alignment = "left" | "center" | "right";

const alignments: { value: Alignment; icon: React.ElementType; label: string }[] = [
    { value: "left",   icon: AlignLeft,   label: "Align Left"   },
    { value: "center", icon: AlignCenter, label: "Align Center" },
    { value: "right",  icon: AlignRight,  label: "Align Right"  },
];

export const AlignmentSelector = () => {
    const { editor } = useEditor();
    if (!editor) return null;

    const current: Alignment =
        editor.isActive({ textAlign: "center" }) ? "center" :
        editor.isActive({ textAlign: "right" })  ? "right"  :
        "left";

    return (
        <div className="flex">
            {alignments.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    type="button"
                    title={label}
                    className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "rounded-none border-none px-2",
                        current === value && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                        const chain = editor.chain().focus() as any;
                        if (chain.setTextAlign(value).run()) {
                            chain.setTextAlign(value).run();
                        } else {
                            console.error("setTextAlign command is unavailable for current selection.");
                        }
                    }}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
};

