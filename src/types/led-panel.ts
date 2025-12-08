/**
 * TypeScript types for LED Panel API
 */

export interface Device {
  name: string;
  address: string;
  rssi?: number;
}

export interface DeviceStatus {
  connected: boolean;
  device_address?: string;
}

export interface DeviceInfo {
  width: number;
  height: number;
  device_type: number;
  led_type: number;
  has_wifi: boolean;
}

export interface TextRequest {
  text: string;
  color?: string;
  font?: string;
  animation?: number;
  speed?: number;
  rainbow_mode?: number;
  char_height?: number;
}

export interface BrightnessRequest {
  brightness: number; // 0-100
}

export interface OrientationRequest {
  orientation: number; // 0-3 (0°, 90°, 180°, 270°)
}

export interface PixelData {
  x: number;
  y: number;
  color: string; // Hex format "RRGGBB"
}

export interface ClockSettings {
  style: number; // 0-8
  format_24: boolean;
  show_date: boolean;
}

export interface RhythmSettings {
  style: number; // 0-4
  levels: number[]; // 11 values 0-15
}

export interface RhythmSettings2 {
  style: number; // 0-1
  time: number; // 0-7
}

export interface PowerRequest {
  on: boolean;
}

export type ResizeMethod = "crop" | "fit";

export interface ApiResponse {
  status: string;
  [key: string]: any;
}

export interface WebSocketMessage {
  type: string;
  connected: boolean;
  device_address?: string;
}

export type PanelMode = 'clock' | 'rhythm' | 'diy';
