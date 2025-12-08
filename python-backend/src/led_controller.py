"""
LED Controller - Wrapper for pypixelcolor library
Handles connection and control of iPixel Color LED panels
"""

import asyncio
import logging
from typing import Optional
from pathlib import Path
from pypixelcolor import AsyncClient

logger = logging.getLogger(__name__)


class LEDController:
    """
    Controls iPixel Color LED panel using pypixelcolor library
    """

    def __init__(self):
        self.device: Optional[AsyncClient] = None
        self.connected: bool = False
        self.device_address: Optional[str] = None
        logger.info("LED Controller initialized")

    async def connect(self, address: str) -> None:
        """
        Connect to an iPixel Color device

        Args:
            address: BLE device address (MAC address)
        """
        logger.info(f"Attempting to connect to device: {address}")

        try:
            # Create AsyncClient instance
            self.device = AsyncClient(address)

            # Connect to the device
            await self.device.connect()

            self.connected = True
            self.device_address = address
            logger.info(f"Successfully connected to {address}")

        except Exception as e:
            logger.error(f"Failed to connect to {address}: {e}")
            self.connected = False
            self.device = None
            self.device_address = None
            raise

    async def disconnect(self) -> None:
        """
        Disconnect from the current device
        """
        if not self.device:
            logger.warning("No device to disconnect from")
            return

        logger.info(f"Disconnecting from {self.device_address}")

        try:
            await self.device.disconnect()
            logger.info("Disconnected successfully")

        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

        finally:
            self.device = None
            self.connected = False
            self.device_address = None

    def ensure_connected(self) -> None:
        """
        Ensure device is connected, raise exception if not
        """
        if not self.connected or not self.device:
            raise RuntimeError("No device connected")

    async def send_text(
        self,
        text: str,
        color: str = "ffffff",
        font: str = "CUSONG",
        animation: int = 0,
        speed: int = 80,
        rainbow_mode: int = 0,
        char_height: int = None
    ) -> None:
        """
        Send text to the LED panel with full pypixelcolor parameters

        Args:
            text: Text to display
            color: Hex color (e.g., "FF0000" for red)
            font: Font name ("CUSONG", "SIMSUN", "VCR_OSD_MONO")
            animation: Animation type (0-7)
            speed: Animation speed (0-100)
            rainbow_mode: Rainbow mode style (0-9)
            char_height: Character height in pixels (16, 20, 24, 32 for CUSONG)
        """
        self.ensure_connected()
        logger.info(f"Sending text: '{text}', color: {color}, font: {font}, animation: {animation}, speed: {speed}, rainbow: {rainbow_mode}, char_height: {char_height}")

        try:
            await self.device.send_text(
                text=text,
                color=color,
                font=font,
                animation=animation,
                speed=speed,
                rainbow_mode=rainbow_mode,
                save_slot=0,
                char_height=char_height
            )
            logger.info("Text sent successfully")

        except Exception as e:
            logger.error(f"Failed to send text: {e}")
            raise

    async def send_image(self, image_path: str) -> None:
        """
        Send an image (PNG) to the LED panel

        Args:
            image_path: Path to the image file
        """
        self.ensure_connected()
        logger.info(f"Sending image: {image_path}")

        try:
            # pypixelcolor can send images
            await self.device.send_image(image_path)
            logger.info("Image sent successfully")

        except Exception as e:
            logger.error(f"Failed to send image: {e}")
            raise


    async def set_brightness(self, brightness: int) -> None:
        """
        Set LED panel brightness

        Args:
            brightness: Brightness level (0-100)
        """
        self.ensure_connected()

        if not 0 <= brightness <= 100:
            raise ValueError("Brightness must be between 0 and 100")

        logger.info(f"Setting brightness to {brightness}%")

        try:
            await self.device.set_brightness(brightness)
            logger.info("Brightness set successfully")

        except Exception as e:
            logger.error(f"Failed to set brightness: {e}")
            raise

    async def set_orientation(self, orientation: int) -> None:
        """
        Set LED panel orientation

        Args:
            orientation: Orientation (0-3: 0°, 90°, 180°, 270°)
        """
        self.ensure_connected()

        if orientation not in [0, 1, 2, 3]:
            raise ValueError("Orientation must be 0, 1, 2, or 3")

        logger.info(f"Setting orientation to {orientation * 90}°")

        try:
            await self.device.set_orientation(orientation)
            logger.info("Orientation set successfully")

        except Exception as e:
            logger.error(f"Failed to set orientation: {e}")
            raise

    async def set_pixel(self, x: int, y: int, color: str) -> None:
        """
        Set a single pixel color (requires DIY mode)

        Args:
            x: X coordinate
            y: Y coordinate
            color: Hex color string (e.g., "FF0000" for red, "00FF00" for green)
        """
        self.ensure_connected()
        logger.debug(f"Setting pixel ({x}, {y}) to #{color}")

        try:
            await self.device.set_pixel(x, y, color)

        except Exception as e:
            logger.error(f"Failed to set pixel: {e}")
            raise

    async def power_on(self) -> None:
        """
        Turn on the LED panel
        """
        self.ensure_connected()
        logger.info("Powering on device")

        try:
            # pypixelcolor might have a power_on method
            if hasattr(self.device, 'power_on'):
                await self.device.power_on()
            else:
                # Alternative: send a text to "wake" the panel
                await self.device.send_text(" ")
            logger.info("Device powered on")

        except Exception as e:
            logger.error(f"Failed to power on: {e}")
            raise

    async def power_off(self) -> None:
        """
        Turn off the LED panel
        """
        self.ensure_connected()
        logger.info("Powering off device")

        try:
            # pypixelcolor might have a power_off method
            if hasattr(self.device, 'power_off'):
                await self.device.power_off()
            else:
                # Alternative: set brightness to 0
                await self.device.set_brightness(0)
            logger.info("Device powered off")

        except Exception as e:
            logger.error(f"Failed to power off: {e}")
            raise

    def get_status(self) -> dict:
        """
        Get current controller status

        Returns:
            Dictionary with connection status
        """
        return {
            "connected": self.connected,
            "device_address": self.device_address
        }

    def get_device_info(self) -> dict:
        """
        Get device information (dimensions, type, etc.)

        Returns:
            Dictionary with device info
        """
        self.ensure_connected()

        device_info = self.device.get_device_info()
        return {
            "width": device_info.width,
            "height": device_info.height,
            "device_type": device_info.device_type,
            "led_type": device_info.led_type,
            "has_wifi": device_info.has_wifi
        }

    async def set_clock_mode(self, style: int = 1, format_24: bool = True, show_date: bool = True) -> None:
        """
        Activate clock mode on the LED panel

        Args:
            style: Clock style (0-8)
            format_24: Use 24-hour format
            show_date: Show date
        """
        self.ensure_connected()
        logger.info(f"Activating clock mode: style={style}, 24h={format_24}, show_date={show_date}")

        try:
            await self.device.set_clock_mode(
                style=style,
                format_24=format_24,
                show_date=show_date
            )
            logger.info("Clock mode activated")

        except Exception as e:
            logger.error(f"Failed to set clock mode: {e}")
            raise

    async def set_rhythm_mode(self, style: int = 0, levels: list = None) -> None:
        """
        Activate rhythm/beat mode with 11 level controls

        Args:
            style: Rhythm style (0-4)
            levels: List of 11 level values (0-15 each)
        """
        self.ensure_connected()

        if levels is None:
            levels = [0] * 11

        logger.info(f"Activating rhythm mode: style={style}, levels={levels}")

        try:
            await self.device.set_rhythm_mode(
                style=style,
                l1=levels[0], l2=levels[1], l3=levels[2], l4=levels[3],
                l5=levels[4], l6=levels[5], l7=levels[6], l8=levels[7],
                l9=levels[8], l10=levels[9], l11=levels[10]
            )
            logger.info("Rhythm mode activated")

        except Exception as e:
            logger.error(f"Failed to set rhythm mode: {e}")
            raise

    async def set_rhythm_mode_2(self, style: int = 0, time: int = 0) -> None:
        """
        Activate rhythm mode v2 (alternative version)

        Args:
            style: Rhythm style (0-1)
            time: Animation time (0-7)
        """
        self.ensure_connected()
        logger.info(f"Activating rhythm mode v2: style={style}, time={time}")

        try:
            await self.device.set_rhythm_mode_2(style=style, t=time)
            logger.info("Rhythm mode v2 activated")

        except Exception as e:
            logger.error(f"Failed to set rhythm mode v2: {e}")
            raise

    async def set_power(self, on: bool = True) -> None:
        """
        Power the device on or off

        Args:
            on: True to power on, False to power off
        """
        self.ensure_connected()
        logger.info(f"Setting power: {'ON' if on else 'OFF'}")

        try:
            await self.device.set_power(on=on)
            logger.info(f"Power set to {'ON' if on else 'OFF'}")

        except Exception as e:
            logger.error(f"Failed to set power: {e}")
            raise

    async def set_diy_mode(self) -> None:
        """
        Activate DIY/fun mode for pixel-by-pixel control
        """
        self.ensure_connected()
        logger.info("Activating DIY mode for pixel control")

        try:
            await self.device.set_fun_mode(enable=True)
            logger.info("DIY mode activated")

        except Exception as e:
            logger.error(f"Failed to activate DIY mode: {e}")
            raise
