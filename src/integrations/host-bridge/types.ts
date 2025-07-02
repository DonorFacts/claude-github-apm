/**
 * Host-Bridge Communication Types
 * Unified container-host communication system
 */

export interface BridgeRequest {
  id: string;
  service: 'vscode' | 'audio' | 'speech';
  action: string;
  timestamp: string;
  payload: Record<string, any>;
  timeout: number;
  priority: 'high' | 'normal' | 'low';
}

export interface BridgeResponse {
  id: string;
  status: 'success' | 'error' | 'timeout';
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface VSCodePayload {
  path: string;
}

export interface AudioPayload {
  sound: string;
  volume?: number;
}

export interface SpeechPayload {
  message: string;
  voice?: string;
  rate?: number;
}

export interface ServiceConfig {
  enabled: boolean;
  timeout: number;
  description: string;
  [key: string]: any;
}

export interface ServicesConfig {
  vscode: ServiceConfig & {
    command: string;
    path_translation: boolean;
  };
  audio: ServiceConfig & {
    sounds_dir: string;
  };
  speech: ServiceConfig & {
    voice: string;
  };
}