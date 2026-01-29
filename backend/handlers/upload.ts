import { Context } from "hono";
import { join } from "node:path";
import type { ImageAttachment, UploadResponse } from "../../shared/types.ts";
import { getHomeDir } from "../utils/os.ts";
import { exists, mkdir, writeBinaryFile } from "../utils/fs.ts";
import { logger } from "../utils/logger.ts";
import { generateId } from "../utils/id.ts";

const UPLOAD_DIR = ".claude/uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type AllowedMediaType = (typeof ALLOWED_TYPES)[number];

interface UploadRequest {
  file: string; // Base64 encoded file data
  filename: string;
  mediaType: string;
}

/**
 * Handles POST /api/upload requests for image uploads
 * @param c - Hono context object
 * @returns Response with upload result
 */
export async function handleUploadRequest(c: Context): Promise<Response> {
  try {
    const request: UploadRequest = await c.req.json();

    // Validate media type
    if (!ALLOWED_TYPES.includes(request.mediaType as AllowedMediaType)) {
      const response: UploadResponse = {
        success: false,
        error: `Invalid image type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      };
      return c.json(response, 400);
    }

    // Decode base64 and validate size
    let buffer: Uint8Array;
    try {
      const binaryString = atob(request.file);
      buffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt(i);
      }
    } catch {
      const response: UploadResponse = {
        success: false,
        error: "Invalid base64 data",
      };
      return c.json(response, 400);
    }

    if (buffer.length > MAX_FILE_SIZE) {
      const response: UploadResponse = {
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
      return c.json(response, 400);
    }

    // Get home directory
    const homeDir = getHomeDir();
    if (!homeDir) {
      const response: UploadResponse = {
        success: false,
        error: "Home directory not found",
      };
      return c.json(response, 500);
    }

    // Ensure upload directory exists
    const uploadPath = join(homeDir, UPLOAD_DIR);
    if (!(await exists(uploadPath))) {
      await mkdir(uploadPath);
      logger.api.debug("Created upload directory: {uploadPath}", { uploadPath });
    }

    // Generate unique filename and save
    const id = generateId();
    const ext = request.mediaType.split("/")[1];
    const filename = `${id}.${ext}`;
    const filePath = join(uploadPath, filename);

    await writeBinaryFile(filePath, buffer);
    logger.api.debug("Saved uploaded file: {filePath}", { filePath });

    const image: ImageAttachment = {
      id,
      filename: request.filename,
      mediaType: request.mediaType as AllowedMediaType,
      base64Data: request.file,
      size: buffer.length,
    };

    const response: UploadResponse = {
      success: true,
      image,
    };

    return c.json(response);
  } catch (error) {
    logger.api.error("Upload failed: {error}", { error });
    const response: UploadResponse = {
      success: false,
      error: "Upload failed",
    };
    return c.json(response, 500);
  }
}
