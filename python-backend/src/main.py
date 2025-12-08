"""
FastAPI server for controlling iPixel Color LED panel
This server wraps the pypixelcolor library and exposes it via REST API
"""

import asyncio
import logging
import tempfile
import os
from typing import List, Optional
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import our BLE and LED controller modules
from ble_manager import BLEManager
from led_controller import LEDController

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Pydantic models for request/response
class Device(BaseModel):
    """BLE Device information"""
    name: str
    address: str
    rssi: Optional[int] = None


class ConnectRequest(BaseModel):
    """Request to connect to a device"""
    address: str


class TextRequest(BaseModel):
    """Request to send text to the panel"""
    text: str
    color: str = "ffffff"
    font: str = "CUSONG"
    animation: int = 0
    speed: int = 80
    rainbow_mode: int = 0
    char_height: Optional[int] = None


class BrightnessRequest(BaseModel):
    """Request to set brightness"""
    brightness: int  # 0-100


class OrientationRequest(BaseModel):
    """Request to set orientation"""
    orientation: int  # 0-3 (0°, 90°, 180°, 270°)


class StatusResponse(BaseModel):
    """Device status response"""
    connected: bool
    device_address: Optional[str] = None


class ClockSettings(BaseModel):
    """Request to set clock mode"""
    style: int = 1  # 0-8
    format_24: bool = True
    show_date: bool = True


class RhythmSettings(BaseModel):
    """Request to set rhythm mode v1"""
    style: int = 0  # 0-4
    levels: List[int] = [0] * 11  # 11 values 0-15


class RhythmSettings2(BaseModel):
    """Request to set rhythm mode v2"""
    style: int = 0  # 0-1
    time: int = 0   # 0-7


class PowerRequest(BaseModel):
    """Request to set power"""
    on: bool = True


class PixelData(BaseModel):
    """Request to send pixel art"""
    pixels: List[dict]  # [{"x": 0, "y": 0, "color": "FF0000"}, ...]


# Global state
class AppState:
    ble_manager: BLEManager
    led_controller: LEDController
    websocket_connections: List[WebSocket] = []

    def __init__(self):
        self.ble_manager = BLEManager()
        self.led_controller = LEDController()
        self.websocket_connections = []


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    logger.info("Starting LED Panel Control Backend")
    yield
    logger.info("Shutting down LED Panel Control Backend")
    # Cleanup: disconnect from device if connected
    if app_state.led_controller.connected:
        try:
            await app_state.led_controller.disconnect()
            logger.info("Disconnected from device")
        except Exception as e:
            logger.error(f"Error disconnecting: {e}")


# Create FastAPI app
app = FastAPI(
    title="LED Panel Control API",
    description="API for controlling iPixel Color LED panel",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware to allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "LED Panel Control Backend is running",
        "version": "1.0.0"
    }


@app.get("/devices/scan", response_model=List[Device])
async def scan_devices():
    """
    Scan for BLE devices (iPixel Color panels)
    Returns a list of discovered devices
    """
    logger.info("Scanning for BLE devices...")

    try:
        # Use BLE manager to scan for iPixel devices
        devices = await app_state.ble_manager.scan_for_ipixel_devices(timeout=10.0)

        # Convert to Device models
        device_list = [Device(**dev) for dev in devices]

        logger.info(f"Found {len(device_list)} iPixel device(s)")
        return device_list

    except Exception as e:
        logger.error(f"Scan failed: {e}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@app.get("/devices/scan/all", response_model=List[Device])
async def scan_all_devices():
    """
    Scan for ALL BLE devices (no filter)
    Useful for debugging to find your LED panel
    """
    logger.info("Scanning for ALL BLE devices...")

    try:
        # Use BLE manager to scan for ALL devices
        devices = await app_state.ble_manager.scan_all_devices(timeout=10.0)

        # Convert to Device models
        device_list = [Device(**dev) for dev in devices]

        logger.info(f"Found {len(device_list)} total device(s)")
        return device_list

    except Exception as e:
        logger.error(f"Scan failed: {e}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@app.post("/devices/connect")
async def connect_device(request: ConnectRequest):
    """
    Connect to a specific BLE device
    """
    logger.info(f"Connecting to device: {request.address}")

    try:
        # Use LED controller to connect to the device
        await app_state.led_controller.connect(request.address)

        # Notify WebSocket clients
        await broadcast_status()

        logger.info(f"Successfully connected to device: {request.address}")
        return {"status": "connected", "address": request.address}

    except Exception as e:
        logger.error(f"Connection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")


@app.post("/devices/disconnect")
async def disconnect_device():
    """
    Disconnect from the current device
    """
    # Allow disconnect even if already disconnected (idempotent)
    if not app_state.led_controller.connected:
        logger.info("Already disconnected")
        return {"status": "disconnected", "message": "Already disconnected"}

    old_address = app_state.led_controller.device_address
    logger.info(f"Disconnecting from device: {old_address}")

    try:
        await app_state.led_controller.disconnect()

        # Notify WebSocket clients
        await broadcast_status()

        logger.info(f"Successfully disconnected from device: {old_address}")
        return {"status": "disconnected"}

    except Exception as e:
        logger.error(f"Disconnection failed: {e}")
        # Even if disconnect fails, force the state to disconnected
        # This handles cases where the device was already powered off
        app_state.led_controller.connected = False
        app_state.led_controller.device = None
        app_state.led_controller.device_address = None

        # Notify WebSocket clients of the new state
        await broadcast_status()

        logger.warning(f"Forced disconnection due to error")
        return {"status": "disconnected", "forced": True}


@app.get("/devices/status", response_model=StatusResponse)
async def get_status():
    """
    Get current device connection status
    """
    status = app_state.led_controller.get_status()
    return StatusResponse(
        connected=status["connected"],
        device_address=status["device_address"]
    )


@app.post("/panel/text")
async def send_text(request: TextRequest):
    """
    Send text to the LED panel with full pypixelcolor options
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info(f"Sending text: '{request.text}' with color: {request.color}, font: {request.font}, animation: {request.animation}")

    try:
        await app_state.led_controller.send_text(
            text=request.text,
            color=request.color,
            font=request.font,
            animation=request.animation,
            speed=request.speed,
            rainbow_mode=request.rainbow_mode,
            char_height=request.char_height
        )

        return {
            "status": "success",
            "text": request.text,
            "color": request.color,
            "font": request.font,
            "animation": request.animation,
            "speed": request.speed,
            "rainbow_mode": request.rainbow_mode,
            "char_height": request.char_height
        }

    except Exception as e:
        logger.error(f"Failed to send text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send text: {str(e)}")


@app.post("/panel/image")
async def send_image(file: UploadFile = File(...)):
    """
    Upload and send an image or GIF to the LED panel

    Supports: PNG, GIF, JPEG, WebP, BMP, TIFF, HEIC/HEIF
    All formats are handled by send_image() which auto-detects the type
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info(f"Receiving image: {file.filename}")

    # Read file content
    content = await file.read()

    try:
        # Save to temporary file
        suffix = Path(file.filename).suffix if file.filename else ".tmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            # send_image() handles ALL formats (PNG, GIF, JPEG, etc.)
            # The method auto-detects the format via file extension
            await app_state.led_controller.send_image(tmp_path)

            logger.info(f"Image sent: {file.filename} ({len(content)} bytes)")

            return {
                "status": "success",
                "filename": file.filename,
                "size": len(content)
            }

        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Failed to send image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send image: {str(e)}")


@app.post("/panel/mode/diy")
async def set_diy_mode():
    """
    Activate DIY mode (pixel by pixel control)
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info("Activating DIY mode")

    try:
        await app_state.led_controller.set_diy_mode()
        return {"status": "success", "mode": "diy"}

    except Exception as e:
        logger.error(f"Failed to set DIY mode: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set DIY mode: {str(e)}")


@app.post("/panel/brightness")
async def set_brightness(request: BrightnessRequest):
    """
    Set LED panel brightness (0-100)
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    if not 0 <= request.brightness <= 100:
        raise HTTPException(status_code=400, detail="Brightness must be between 0 and 100")

    logger.info(f"Setting brightness to {request.brightness}%")

    try:
        await app_state.led_controller.set_brightness(request.brightness)
        return {"status": "success", "brightness": request.brightness}

    except Exception as e:
        logger.error(f"Failed to set brightness: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set brightness: {str(e)}")


@app.post("/panel/orientation")
async def set_orientation(request: OrientationRequest):
    """
    Set LED panel orientation (0-3: 0°, 90°, 180°, 270°)
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    if request.orientation not in [0, 1, 2, 3]:
        raise HTTPException(status_code=400, detail="Orientation must be 0, 1, 2, or 3")

    logger.info(f"Setting orientation to {request.orientation * 90}°")

    try:
        await app_state.led_controller.set_orientation(request.orientation)
        return {"status": "success", "orientation": request.orientation}

    except Exception as e:
        logger.error(f"Failed to set orientation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set orientation: {str(e)}")


@app.get("/panel/device-info")
async def get_device_info():
    """
    Get device information (dimensions, type, etc.)
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    try:
        device_info = app_state.led_controller.get_device_info()
        logger.info(f"Device info: {device_info['width']}x{device_info['height']}, type: {device_info['device_type']}")
        return device_info

    except Exception as e:
        logger.error(f"Failed to get device info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get device info: {str(e)}")


@app.post("/panel/mode/clock")
async def set_clock_mode(settings: ClockSettings):
    """
    Activate clock mode with style options
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info(f"Setting clock mode: style={settings.style}, 24h={settings.format_24}, show_date={settings.show_date}")

    try:
        await app_state.led_controller.set_clock_mode(
            style=settings.style,
            format_24=settings.format_24,
            show_date=settings.show_date
        )
        return {"status": "success", "mode": "clock", "settings": settings.dict()}

    except Exception as e:
        logger.error(f"Failed to set clock mode: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set clock mode: {str(e)}")


@app.post("/panel/mode/rhythm")
async def set_rhythm_mode(settings: RhythmSettings):
    """
    Activate rhythm/beat mode v1 with 11 level controls
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info(f"Setting rhythm mode: style={settings.style}, levels={settings.levels}")

    try:
        await app_state.led_controller.set_rhythm_mode(
            style=settings.style,
            levels=settings.levels
        )
        return {"status": "success", "mode": "rhythm", "settings": settings.dict()}

    except Exception as e:
        logger.error(f"Failed to set rhythm mode: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set rhythm mode: {str(e)}")


@app.post("/panel/mode/rhythm2")
async def set_rhythm_mode_2(settings: RhythmSettings2):
    """
    Activate rhythm/beat mode v2 (alternative version)
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info(f"Setting rhythm mode v2: style={settings.style}, time={settings.time}")

    try:
        await app_state.led_controller.set_rhythm_mode_2(
            style=settings.style,
            time=settings.time
        )
        return {"status": "success", "mode": "rhythm2", "settings": settings.dict()}

    except Exception as e:
        logger.error(f"Failed to set rhythm mode v2: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set rhythm mode v2: {str(e)}")


@app.post("/panel/power")
async def set_power(request: PowerRequest):
    """
    Power the device on or off
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info(f"Setting power: {'ON' if request.on else 'OFF'}")

    try:
        await app_state.led_controller.set_power(on=request.on)
        return {"status": "success", "power": "on" if request.on else "off"}

    except Exception as e:
        logger.error(f"Failed to set power: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set power: {str(e)}")


@app.post("/panel/pixels")
async def send_pixels(data: PixelData):
    """
    Send pixel art (multiple pixels at once)
    """
    if not app_state.led_controller.connected:
        raise HTTPException(status_code=400, detail="No device connected")

    logger.info(f"Sending {len(data.pixels)} pixels")

    try:
        # Activate DIY mode first
        await app_state.led_controller.set_diy_mode()

        # Send each pixel
        for pixel in data.pixels:
            await app_state.led_controller.set_pixel(
                pixel["x"],
                pixel["y"],
                pixel["color"]
            )

        return {"status": "success", "pixels_sent": len(data.pixels)}

    except Exception as e:
        logger.error(f"Failed to send pixels: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send pixels: {str(e)}")


async def broadcast_status():
    """
    Broadcast device status to all connected WebSocket clients
    """
    if not app_state.websocket_connections:
        return

    controller_status = app_state.led_controller.get_status()
    status = {
        "type": "status",
        "connected": controller_status["connected"],
        "device_address": controller_status["device_address"]
    }

    # Send to all connected clients
    disconnected = []
    for ws in app_state.websocket_connections:
        try:
            await ws.send_json(status)
        except Exception:
            disconnected.append(ws)

    # Remove disconnected clients
    for ws in disconnected:
        app_state.websocket_connections.remove(ws)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time device status updates
    """
    await websocket.accept()
    app_state.websocket_connections.append(websocket)

    logger.info("WebSocket client connected")

    # Send initial status
    controller_status = app_state.led_controller.get_status()
    await websocket.send_json({
        "type": "status",
        "connected": controller_status["connected"],
        "device_address": controller_status["device_address"]
    })

    try:
        # Keep connection alive and wait for messages
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {data}")
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
        app_state.websocket_connections.remove(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
