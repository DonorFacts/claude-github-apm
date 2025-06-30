/**
 * Host-Bridge Communication System
 * Unified container-host communication
 */

export { HostBridge, hostBridge } from './client.js';
export type {
  BridgeRequest,
  BridgeResponse,
  VSCodePayload,
  AudioPayload,
  SpeechPayload,
  ServiceConfig,
  ServicesConfig
} from './types.js';