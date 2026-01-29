import { Context } from "hono";
import { query, type PermissionMode } from "@anthropic-ai/claude-code";
import type {
  ChatRequest,
  StreamResponse,
  ImageAttachment,
} from "../../shared/types.ts";
import { logger } from "../utils/logger.ts";

/**
 * Content block for multimodal messages
 */
interface ImageContent {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
}

interface TextContent {
  type: "text";
  text: string;
}

type ContentBlock = ImageContent | TextContent;

/**
 * SDK User Message type for AsyncIterable prompt
 * Based on Claude Code SDK expected format
 */
interface SDKUserMessage {
  type: "user";
  message: {
    role: "user";
    content: ContentBlock[];
  };
  parent_tool_use_id: string | null;
}

/**
 * Build prompt for Claude SDK query
 * If images are present, returns an AsyncIterable that yields SDKUserMessage
 * Otherwise returns a simple string
 */
function buildPrompt(
  message: string,
  images?: ImageAttachment[],
): string | AsyncIterable<SDKUserMessage> {
  if (!images || images.length === 0) {
    return message;
  }

  const content: ContentBlock[] = [];

  // Add images first
  for (const img of images) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: img.base64Data,
      },
    });
  }

  // Add text message
  content.push({
    type: "text",
    text: message,
  });

  // Return an AsyncIterable that yields the user message
  // and keeps the iterator open until Claude is done processing
  return {
    [Symbol.asyncIterator](): AsyncIterator<SDKUserMessage> {
      let yielded = false;
      return {
        async next(): Promise<IteratorResult<SDKUserMessage>> {
          if (!yielded) {
            yielded = true;
            return {
              done: false,
              value: {
                type: "user" as const,
                message: {
                  role: "user" as const,
                  content,
                },
                parent_tool_use_id: null,
              },
            };
          }
          // Keep the iterator open by returning a never-resolving promise
          // This ensures hooks and canUseTool work correctly (see Issue #9705)
          return new Promise<IteratorResult<SDKUserMessage>>(() => {});
        },
      };
    },
  };
}

/**
 * Executes a Claude command and yields streaming responses
 * @param message - User message or command
 * @param images - Optional array of image attachments
 * @param requestId - Unique request identifier for abort functionality
 * @param requestAbortControllers - Shared map of abort controllers
 * @param cliPath - Path to actual CLI script (detected by validateClaudeCli)
 * @param sessionId - Optional session ID for conversation continuity
 * @param allowedTools - Optional array of allowed tool names
 * @param workingDirectory - Optional working directory for Claude execution
 * @param permissionMode - Optional permission mode for Claude execution
 * @returns AsyncGenerator yielding StreamResponse objects
 */
async function* executeClaudeCommand(
  message: string,
  images: ImageAttachment[] | undefined,
  requestId: string,
  requestAbortControllers: Map<string, AbortController>,
  cliPath: string,
  sessionId?: string,
  allowedTools?: string[],
  workingDirectory?: string,
  permissionMode?: PermissionMode,
): AsyncGenerator<StreamResponse> {
  let abortController: AbortController;

  try {
    // Process commands that start with '/'
    let processedMessage = message;
    if (message.startsWith("/")) {
      // Remove the '/' and send just the command
      processedMessage = message.substring(1);
    }

    // Build prompt (string or multimodal message)
    const prompt = buildPrompt(processedMessage, images);

    // Create and store AbortController for this request
    abortController = new AbortController();
    requestAbortControllers.set(requestId, abortController);

    for await (const sdkMessage of query({
      prompt,
      options: {
        abortController,
        executable: "node" as const,
        executableArgs: [],
        pathToClaudeCodeExecutable: cliPath,
        ...(sessionId ? { resume: sessionId } : {}),
        ...(allowedTools ? { allowedTools } : {}),
        ...(workingDirectory ? { cwd: workingDirectory } : {}),
        ...(permissionMode ? { permissionMode } : {}),
      },
    })) {
      // Debug logging of raw SDK messages with detailed content
      logger.chat.debug("Claude SDK Message: {sdkMessage}", { sdkMessage });

      yield {
        type: "claude_json",
        data: sdkMessage,
      };
    }

    yield { type: "done" };
  } catch (error) {
    // Check if error is due to abort
    // TODO: Re-enable when AbortError is properly exported from Claude SDK
    // if (error instanceof AbortError) {
    //   yield { type: "aborted" };
    // } else {
    {
      logger.chat.error("Claude Code execution failed: {error}", { error });
      yield {
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } finally {
    // Clean up AbortController from map
    if (requestAbortControllers.has(requestId)) {
      requestAbortControllers.delete(requestId);
    }
  }
}

/**
 * Handles POST /api/chat requests with streaming responses
 * @param c - Hono context object with config variables
 * @param requestAbortControllers - Shared map of abort controllers
 * @returns Response with streaming NDJSON
 */
export async function handleChatRequest(
  c: Context,
  requestAbortControllers: Map<string, AbortController>,
) {
  const chatRequest: ChatRequest = await c.req.json();
  const { cliPath } = c.var.config;

  logger.chat.debug(
    "Received chat request {*}",
    chatRequest as unknown as Record<string, unknown>,
  );

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of executeClaudeCommand(
          chatRequest.message,
          chatRequest.images,
          chatRequest.requestId,
          requestAbortControllers,
          cliPath, // Use detected CLI path from validateClaudeCli
          chatRequest.sessionId,
          chatRequest.allowedTools,
          chatRequest.workingDirectory,
          chatRequest.permissionMode,
        )) {
          const data = JSON.stringify(chunk) + "\n";
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.close();
      } catch (error) {
        const errorResponse: StreamResponse = {
          type: "error",
          error: error instanceof Error ? error.message : String(error),
        };
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify(errorResponse) + "\n"),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
