import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Trash } from "lucide-react";
import { useEditor } from "novel";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function isValidUrl(url: string) {
    try {
        const parsed = new URL(url);
        return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
    } catch (_e) {
        return false;
    }
}
export function getUrlFromString(str: string) {
    if (isValidUrl(str)) return str;
    try {
        if (str.includes(".") && !str.includes(" ")) {
            return new URL(`https://${str}`).toString();
        }
    } catch (_e) {
        return null;
    }
    return null;
}
interface LinkSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { editor } = useEditor();
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

    // Calculate position from trigger button when opened
    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 8, left: rect.left });
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    if (!editor) return null;

    const existingHref = editor.getAttributes("link").href || "";

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => onOpenChange(!open)}
                className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "gap-2 rounded-none border-none cursor-pointer",
                    open && "bg-accent"
                )}
            >
                <p className="text-base">↗</p>
                <p
                    className={cn("underline decoration-stone-400 underline-offset-4", {
                        "text-blue-500": editor.isActive("link"),
                    })}
                >
                    Link
                </p>
            </button>

            {open && dropdownPos && createPortal(
                <div
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    className="fixed z-[99999] w-60 rounded-md border border-muted bg-background shadow-md p-0"
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = getUrlFromString(inputRef.current?.value || "");
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run();
                                onOpenChange(false);
                            }
                        }}
                        className="flex p-1"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Paste a link"
                            className="flex-1 bg-background p-1 text-sm outline-none"
                            defaultValue={existingHref}
                        />
                        {existingHref ? (
                            <button
                                type="button"
                                className="flex h-8 items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    editor.chain().focus().unsetLink().run();
                                    if (inputRef.current) {
                                        inputRef.current.value = "";
                                    }
                                    onOpenChange(false);
                                }}
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="flex h-8 items-center rounded-sm bg-primary px-2 text-primary-foreground hover:bg-primary/90"
                            >
                                <Check className="h-4 w-4" />
                            </button>
                        )}
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
};

