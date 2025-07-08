// Shared types for session management

export interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: any;
}

export interface SessionData {
  sessionId: string;
  transcriptPath: string;
  capturedAt: string;
  firstToolUse?: string;
}

export interface SessionInfo extends SessionData {
  modifiedTime: number;
}