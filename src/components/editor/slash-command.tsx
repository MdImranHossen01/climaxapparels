import {
    CheckSquare,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    ImageIcon,
    List,
    ListOrdered,
    Text,
    TextQuote,
} from "lucide-react";
import { Youtube } from "@/components/ui/social-icons";
import { Command, createSuggestionItems, renderItems } from "novel";
import { uploadFn } from "./image-upload";
import { toast } from "sonner";
import Swal from "sweetalert2";

export const suggestionItems = createSuggestionItems([

    {
        title: "Text",
        description: "Just start typing with plain text.",
        searchTerms: ["p", "paragraph"],
        icon: <Text size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
        },
    },
    {
        title: "To-do List",
        description: "Track tasks with a to-do list.",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    {
        title: "Heading 1",
        description: "Big section heading.",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
        },
    },
    {
        title: "Heading 2",
        description: "Medium section heading.",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
        },
    },
    {
        title: "Heading 3",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
        },
    },
    {
        title: "Heading 4",
        description: "Smaller section heading.",
        searchTerms: ["subtitle", "smaller"],
        icon: <Heading4 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 4 }).run();
        },
    },
    {
        title: "Heading 5",
        description: "Smallest section heading.",
        searchTerms: ["subtitle", "smallest"],
        icon: <Heading5 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 5 }).run();
        },
    },
    {
        title: "Heading 6",
        description: "Tiny section heading.",
        searchTerms: ["subtitle", "tiny"],
        icon: <Heading6 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 6 }).run();
        },
    },
    {
        title: "Bullet List",
        description: "Create a simple bullet list.",
        searchTerms: ["unordered", "point"],
        icon: <List size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Numbered List",
        description: "Create a list with numbering.",
        searchTerms: ["ordered"],
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "Quote",
        description: "Capture a quote.",
        searchTerms: ["blockquote"],
        icon: <TextQuote size={18} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").toggleBlockquote().run(),
    },
    {
        title: "Code",
        description: "Capture a code snippet.",
        searchTerms: ["codeblock"],
        icon: <Code size={18} />,
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        title: "Image",
        description: "Upload an image from your computer.",
        searchTerms: ["photo", "picture", "media"],
        icon: <ImageIcon size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            // upload image
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
                if (input.files?.length) {
                    const file = input.files[0];
                    const pos = editor.view.state.selection.from;
                    uploadFn(file, editor.view, pos);
                }
            };
            input.click();
        },
    },
    {
        title: "Youtube",
        description: "Embed a Youtube video.",
        searchTerms: ["video", "youtube", "embed"],
        icon: <Youtube size={18} />,
        command: ({ editor, range }) => {
            Swal.fire({
                title: 'Embed Youtube Video',
                input: 'text',
                inputPlaceholder: 'Please enter Youtube Video Link',
                showCancelButton: true,
                confirmButtonText: 'Embed',
                background: 'var(--card)',
                color: 'var(--foreground)',
                inputAttributes: {
                    autocapitalize: 'off'
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    const videoLink = result.value;
                    const ytregex = new RegExp(
                        /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
                    );

                    if (ytregex.test(videoLink)) {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .setYoutubeVideo({
                                src: videoLink,
                            })
                            .run();
                    } else {
                        toast.error("Please enter a correct Youtube Video Link");
                    }
                }
            });
        },
    },

]);

export const slashCommand = Command.configure({
    suggestion: {
        items: () => suggestionItems,
        render: renderItems,
    },
});

