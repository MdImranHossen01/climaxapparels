import {
    CharacterCount,
    CodeBlockLowlight,
    Color,
    CustomKeymap,
    GlobalDragHandle,
    HighlightExtension,
    HorizontalRule,
    Placeholder,
    StarterKit,
    TaskItem,
    TaskList,
    TextStyle,
    TiptapImage,
    TiptapLink,
    TiptapUnderline,
    Twitter,
    UpdatedImage,
    UploadImagesPlugin,
    Youtube,
} from "novel";

import { TextAlign } from "@tiptap/extension-text-align";
import { Markdown } from "tiptap-markdown";
import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";

//TODO I am using cx here to get tailwind autocomplete working, idk if someone else can write a regex to just capture the class key in objects

//You can overwrite the placeholder with your own configuration
const placeholder = Placeholder.configure({
    placeholder: ({ node }) => {
        if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
        }
        return "Press '/' for commands";
    },
    includeChildren: false,
});
const tiptapLink = TiptapLink.configure({
    HTMLAttributes: {
        class: cx(
            "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
        ),
        target: null,
        rel: null,
    },
});

const updatedImage = UpdatedImage.extend({
    addProseMirrorPlugins() {
        return [
            UploadImagesPlugin({
                imageClass: cx("opacity-40 rounded-lg border border-stone-200"),
            }),
        ];
    },
}).configure({
    HTMLAttributes: {
        class: cx("rounded-lg border border-muted"),
    },
});

const taskList = TaskList.configure({
    HTMLAttributes: {
        class: cx("not-prose pl-2 "),
    },
});
const taskItem = TaskItem.configure({
    HTMLAttributes: {
        class: cx("flex gap-2 items-start my-4"),
    },
    nested: true,
});

const horizontalRule = HorizontalRule.configure({
    HTMLAttributes: {
        class: cx("mt-4 mb-6 border-t border-muted-foreground"),
    },
});

const starterKit = StarterKit.configure({
    bulletList: {
        HTMLAttributes: {
            class: cx("list-disc list-outside leading-3 -mt-2 ml-4"),
        },
    },
    orderedList: {
        HTMLAttributes: {
            class: cx("list-decimal list-outside leading-3 -mt-2 ml-4"),
        },
    },
    listItem: {
        HTMLAttributes: {
            class: cx("leading-normal -mb-2"),
        },
    },
    blockquote: {
        HTMLAttributes: {
            class: cx("border-l-4 border-primary"),
        },
    },
    codeBlock: false,
    code: {
        HTMLAttributes: {
            class: cx("rounded-md bg-muted  px-1.5 py-1 font-mono font-medium"),
            spellcheck: "false",
        },
    },
    horizontalRule: false,
    dropcursor: {
        color: "#DBEAFE",
        width: 4,
    },
    gapcursor: false,
});

const codeBlockLowlight = CodeBlockLowlight.configure({
    // configure lowlight: common /  all / use highlightJS in case there is a need to specify certain language grammars only
    // common: covers 37 language grammars which should be good enough in most cases
    lowlight: createLowlight(common),
});

const youtube = Youtube.configure({
    HTMLAttributes: {
        class: cx("rounded-lg border border-muted"),
    },
    inline: false,
});

const twitter = Twitter.configure({
    HTMLAttributes: {
        class: cx("not-prose"),
    },
    inline: false,
});


const characterCount = CharacterCount.configure();

const textAlign = TextAlign.configure({
    types: ["heading", "paragraph", "blockquote"],
    defaultAlignment: "left",
});

const markdownExtension = Markdown.configure({
    html: false,
    transformCopiedText: true,
});



export const defaultExtensions = [
    starterKit,
    placeholder,
    tiptapLink,
    updatedImage,
    taskList,
    taskItem,
    horizontalRule,
    codeBlockLowlight,
    youtube,
    twitter,
    characterCount,
    textAlign,
    TiptapUnderline,
    markdownExtension,

    HighlightExtension,
    TextStyle,
    Color,
    CustomKeymap,

];

