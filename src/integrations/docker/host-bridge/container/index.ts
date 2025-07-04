/**
 * Host-Bridge Communication System
 * Unified container-host communication
 */

export { HostBridge, hostBridge } from './bridge.js';
export type {
  BridgeRequest,
  BridgeResponse,
  VSCodePayload,
  AudioPayload,
  SpeechPayload,
  ServiceConfig,
  ServicesConfig
} from '../shared/types';