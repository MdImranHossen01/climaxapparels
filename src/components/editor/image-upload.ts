import { createImageUpload } from "novel";
import { toast } from "sonner";

// Uploads image directly to Cloudflare R2 storage via /api/upload

const onUpload = (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const promise = fetch("/api/upload", {
        method: "POST",
        body: formData,
    });

    return new Promise((resolve, reject) => {
        toast.promise(
            promise.then(async (res) => {
                // Successfully uploaded image
                if (res.status === 200) {
                    const { url } = (await res.json()) as { url: string };
                    // preload the image
                    const image = new Image();
                    image.src = url;
                    image.onload = () => {
                        resolve(url);
                    };
                    // No blob store configured
                } else if (res.status === 401) {
                    resolve(file);
                    throw new Error("`BLOB_READ_WRITE_TOKEN` environment variable not found, reading image locally instead.");
                    // Unknown error
                } else {
                    throw new Error("Error uploading image. Please try again.");
                }
            }),
            {
                loading: "Uploading image...",
                success: "Image uploaded successfully.",
                error: (e) => {
                    reject(e);
                    return e.message;
                },
            },
        );
    });
};

export const uploadFn = createImageUpload({
    onUpload,
    validateFn: (file) => {
        if (!file.type.includes("image/")) {
            toast.error("File type not supported.");
            return false;
        }
        if (file.size > 1 * 1024 * 1024) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            toast.error(`Image size cannot exceed 1 MB! Your file is ${sizeMB} MB.`);
            return false;
        }
        return true;
    },
});

