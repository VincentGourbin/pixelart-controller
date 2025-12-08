/**
 * Global App Context
 * Provides shared state and API methods across all components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import type {
  Device,
  DeviceInfo,
  TextRequest,
  BrightnessRequest,
  OrientationRequest,
  PowerRequest,
  PanelMode,
} from '../types/led-panel';

interface DeviceStatus {
  connected: boolean;
  device_address?: string;
}

interface AppContextType {
  // Device state
  deviceInfo: DeviceInfo | null;
  setDeviceInfo: (info: DeviceInfo | null) => void;
  connected: boolean;
  setConnected: (connected: boolean) => void;
  deviceAddress: string | null;
  setDeviceAddress: (address: string | null) => void;

  // Scanner state
  devices: Device[];
  scanning: boolean;
  status: DeviceStatus;

  // Scanner methods
  scanDevices: () => Promise<void>;
  connect: (address: string) => Promise<void>;
  disconnect: () => Promise<void>;

  // Panel control methods
  sendText: (request: TextRequest) => Promise<void>;
  sendImage: (file: File) => Promise<void>;
  setMode: (mode: PanelMode) => Promise<void>;
  setBrightness: (request: BrightnessRequest) => Promise<void>;
  setOrientation: (request: OrientationRequest) => Promise<void>;
  setPower: (request: PowerRequest) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [deviceAddress, setDeviceAddress] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<DeviceStatus>({ connected: false });

  // Initialize WebSocket connection
  useEffect(() => {
    api.connectWebSocket((msg) => {
      setStatus({
        connected: msg.connected,
        device_address: msg.device_address,
      });
      setConnected(msg.connected);
      if (msg.device_address) {
        setDeviceAddress(msg.device_address);
      }
    });

    return () => {
      api.disconnectWebSocket();
    };
  }, []);

  // Scan for devices
  const scanDevices = async () => {
    setScanning(true);
    try {
      const foundDevices = await api.scanDevices();
      setDevices(foundDevices);
    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    } finally {
      setScanning(false);
    }
  };

  // Connect to device
  const connect = async (address: string) => {
    try {
      await api.connect(address);
      const info = await api.getDeviceInfo();
      setDeviceInfo(info);
      setConnected(true);
      setDeviceAddress(address);
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  };

  // Disconnect from device
  const disconnect = async () => {
    try {
      await api.disconnect();
      setConnected(false);
      setDeviceAddress(null);
      setDeviceInfo(null);
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  };

  // Send text to panel
  const sendText = async (request: TextRequest) => {
    try {
      await api.sendText(request);
    } catch (error) {
      console.error('Send text failed:', error);
      throw error;
    }
  };

  // Send image to panel
  const sendImage = async (file: File) => {
    try {
      await api.sendImage(file);
    } catch (error) {
      console.error('Send image failed:', error);
      throw error;
    }
  };

  // Set panel mode
  const setMode = async (mode: PanelMode) => {
    try {
      await api.setMode(mode);
    } catch (error) {
      console.error('Set mode failed:', error);
      throw error;
    }
  };

  // Set brightness
  const setBrightness = async (request: BrightnessRequest) => {
    try {
      await api.setBrightness(request);
    } catch (error) {
      console.error('Set brightness failed:', error);
      throw error;
    }
  };

  // Set orientation
  const setOrientation = async (request: OrientationRequest) => {
    try {
      await api.setOrientation(request);
    } catch (error) {
      console.error('Set orientation failed:', error);
      throw error;
    }
  };

  // Set power
  const setPower = async (request: PowerRequest) => {
    try {
      await api.setPower(request);
    } catch (error) {
      console.error('Set power failed:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        deviceInfo,
        setDeviceInfo,
        connected,
        setConnected,
        deviceAddress,
        setDeviceAddress,
        devices,
        scanning,
        status,
        scanDevices,
        connect,
        disconnect,
        sendText,
        sendImage,
        setMode,
        setBrightness,
        setOrientation,
        setPower,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// Export types
export type { DeviceInfo, DeviceStatus };
