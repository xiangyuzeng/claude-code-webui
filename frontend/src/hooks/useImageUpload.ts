import { useState, useCallback } from "react";
import type { ImageAttachment, UploadResponse } from "../types";
import { getUploadUrl } from "../config/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export type ImageUploadError =
  | "imageTypeError"
  | "imageSizeError"
  | "maxImagesError"
  | "uploadFailed";

interface UseImageUploadOptions {
  onError?: (error: ImageUploadError) => void;
}

/**
 * Convert File to base64 string (without data URL prefix)
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback(
    (file: File): ImageUploadError | null => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return "imageTypeError";
      }
      if (file.size > MAX_FILE_SIZE) {
        return "imageSizeError";
      }
      if (images.length >= MAX_IMAGES) {
        return "maxImagesError";
      }
      return null;
    },
    [images.length],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<ImageAttachment | null> => {
      const error = validateFile(file);
      if (error) {
        options.onError?.(error);
        return null;
      }

      setIsUploading(true);
      try {
        // Read file as base64
        const base64 = await fileToBase64(file);

        const response = await fetch(getUploadUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            filename: file.name,
            mediaType: file.type,
          }),
        });

        const result: UploadResponse = await response.json();
        if (result.success && result.image) {
          setImages((prev) => [...prev, result.image!]);
          return result.image;
        } else {
          options.onError?.("uploadFailed");
          return null;
        }
      } catch {
        options.onError?.("uploadFailed");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, options],
  );

  const uploadImages = useCallback(
    async (files: FileList | File[]): Promise<ImageAttachment[]> => {
      const uploadedImages: ImageAttachment[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // Check if we've hit the max images limit
        if (images.length + uploadedImages.length >= MAX_IMAGES) {
          options.onError?.("maxImagesError");
          break;
        }

        const uploaded = await uploadImage(file);
        if (uploaded) {
          uploadedImages.push(uploaded);
        }
      }

      return uploadedImages;
    },
    [images.length, uploadImage, options],
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    images,
    isUploading,
    uploadImage,
    uploadImages,
    removeImage,
    clearImages,
    maxImages: MAX_IMAGES,
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
  };
}
