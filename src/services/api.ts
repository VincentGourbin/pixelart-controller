/**
 * API Client for LED Panel Control Backend
 * Handles all communication with the Python FastAPI backend
 */

import type {
  Device,
  DeviceStatus,
  DeviceInfo,
  TextRequest,
  BrightnessRequest,
  OrientationRequest,
  PixelData,
  ClockSettings,
  RhythmSettings,
  RhythmSettings2,
  PowerRequest,
  ApiResponse,
  WebSocketMessage,
  PanelMode
} from '../types/led-panel';

class LEDPanelAPI {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private wsReconnectTimer: number | null = null;
  private statusCallbacks: ((message: WebSocketMessage) => void)[] = [];

  constructor(baseUrl: string = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the backend is running
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Backend ping failed:', error);
      return false;
    }
  }

  /**
   * Scan for BLE devices (iPixel Color panels)
   */
  async scanDevices(): Promise<Device[]> {
    const response = await fetch(`${this.baseUrl}/devices/scan`);
    if (!response.ok) {
      throw new Error(`Scan failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Connect to a specific device
   */
  async connect(deviceAddress: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/devices/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: deviceAddress })
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/devices/disconnect`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Disconnection failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current device status
   */
  async getStatus(): Promise<DeviceStatus> {
    const response = await fetch(`${this.baseUrl}/devices/status`);
    if (!response.ok) {
      throw new Error(`Get status failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Send text to the LED panel
   */
  async sendText(request: TextRequest): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send text');
    }

    return response.json();
  }

  /**
   * Upload and send an image or GIF to the panel
   */
  async sendImage(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/panel/image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send image');
    }

    return response.json();
  }

  /**
   * Set panel mode (clock, rhythm, DIY)
   */
  async setMode(mode: PanelMode): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/mode/${mode}`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Failed to set ${mode} mode`);
    }

    return response.json();
  }

  /**
   * Set panel brightness (0-100)
   */
  async setBrightness(request: BrightnessRequest): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/brightness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to set brightness');
    }

    return response.json();
  }

  /**
   * Set panel orientation (0-3)
   */
  async setOrientation(request: OrientationRequest): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/orientation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to set orientation');
    }

    return response.json();
  }

  /**
   * Connect to WebSocket for real-time status updates
   */
  connectWebSocket(onMessage: (message: WebSocketMessage) => void): void {
    this.statusCallbacks.push(onMessage);

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        if (this.wsReconnectTimer) {
          clearTimeout(this.wsReconnectTimer);
          this.wsReconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.statusCallbacks.forEach(callback => callback(message));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after 3 seconds
        this.wsReconnectTimer = setTimeout(() => {
          this.connectWebSocket(onMessage);
        }, 3000) as unknown as number;
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.statusCallbacks = [];
  }

  /**
   * Get device information (dimensions, type, etc.)
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const response = await fetch(`${this.baseUrl}/panel/device-info`);
    if (!response.ok) {
      throw new Error('Failed to get device info');
    }
    return response.json();
  }

  /**
   * Send pixel art (multiple pixels at once)
   */
  async sendPixels(pixels: PixelData[]): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/pixels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pixels })
    });
    if (!response.ok) {
      throw new Error('Failed to send pixels');
    }
    return response.json();
  }

  /**
   * Set clock mode with style options
   */
  async setClockMode(settings: ClockSettings): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/mode/clock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) {
      throw new Error('Failed to set clock mode');
    }
    return response.json();
  }

  /**
   * Set rhythm/beat mode v1 (11 level controls)
   */
  async setRhythmMode(settings: RhythmSettings): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/mode/rhythm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) {
      throw new Error('Failed to set rhythm mode');
    }
    return response.json();
  }

  /**
   * Set rhythm/beat mode v2 (alternative version)
   */
  async setRhythmMode2(settings: RhythmSettings2): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/mode/rhythm2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) {
      throw new Error('Failed to set rhythm mode 2');
    }
    return response.json();
  }

  /**
   * Set power (on/off)
   */
  async setPower(request: PowerRequest): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/panel/power`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to set power');
    }
    return response.json();
  }

  /**
   * Remove a status callback
   */
  removeStatusCallback(callback: (message: WebSocketMessage) => void): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }
}

// Export a singleton instance
export const api = new LEDPanelAPI();

// Export the class for creating custom instances if needed
export { LEDPanelAPI };
