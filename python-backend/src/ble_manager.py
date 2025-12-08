"""
BLE Manager for scanning and discovering iPixel Color LED panels
Uses bleak for cross-platform BLE support
"""

import asyncio
import logging
from typing import List, Optional
from bleak import BleakScanner
from bleak.backends.device import BLEDevice

logger = logging.getLogger(__name__)

# iPixel Color service UUID
IPIXEL_SERVICE_UUID = "0000FFF0-0000-1000-8000-00805F9B34FB"


class BLEManager:
    """
    Manages BLE device discovery for iPixel Color panels
    """

    def __init__(self):
        self.scanner: Optional[BleakScanner] = None
        logger.info("BLE Manager initialized")

    async def scan_for_ipixel_devices(self, timeout: float = 10.0) -> List[dict]:
        """
        Scan for iPixel Color LED panels

        Args:
            timeout: Scan duration in seconds

        Returns:
            List of discovered devices with their info
        """
        logger.info(f"Starting BLE scan for {timeout} seconds...")

        try:
            # Scan for BLE devices
            devices = await BleakScanner.discover(timeout=timeout, return_adv=True)

            ipixel_devices = []

            for device_address, (device, adv_data) in devices.items():
                # Filter for iPixel Color devices
                # They typically have "iPixel" or "Pixel" in their name
                device_name = device.name or "Unknown"

                # Check if it's likely an iPixel/LED panel device
                name_lower = device_name.lower()

                # Exclude known non-LED devices
                is_excluded = (
                    "thermobeacon" in name_lower or
                    "thermometer" in name_lower or
                    name_lower == "sps"  # Generic SPS devices
                )

                if is_excluded:
                    continue

                is_ipixel = (
                    "ipixel" in name_lower or
                    "pixel" in name_lower or
                    "led_ble" in name_lower or
                    "led-ble" in name_lower or
                    name_lower.startswith("led ") or
                    # Some devices might not advertise a name, check service UUIDs
                    IPIXEL_SERVICE_UUID.lower() in [str(uuid).lower() for uuid in adv_data.service_uuids]
                )

                if is_ipixel:
                    device_info = {
                        "name": device_name,
                        "address": device.address,
                        "rssi": adv_data.rssi if hasattr(adv_data, 'rssi') else None
                    }
                    ipixel_devices.append(device_info)
                    logger.info(f"Found iPixel device: {device_name} ({device.address}) RSSI: {adv_data.rssi}")

            logger.info(f"Scan complete. Found {len(ipixel_devices)} iPixel device(s)")
            return ipixel_devices

        except Exception as e:
            logger.error(f"Error during BLE scan: {e}")
            raise

    async def scan_all_devices(self, timeout: float = 10.0) -> List[dict]:
        """
        Scan for ALL BLE devices (useful for debugging)

        Args:
            timeout: Scan duration in seconds

        Returns:
            List of all discovered devices
        """
        logger.info(f"Starting BLE scan for all devices ({timeout} seconds)...")

        try:
            devices = await BleakScanner.discover(timeout=timeout, return_adv=True)

            all_devices = []

            for device_address, (device, adv_data) in devices.items():
                device_info = {
                    "name": device.name or "Unknown",
                    "address": device.address,
                    "rssi": adv_data.rssi if hasattr(adv_data, 'rssi') else None
                }
                all_devices.append(device_info)
                logger.debug(f"Found device: {device_info['name']} ({device_info['address']})")

            logger.info(f"Scan complete. Found {len(all_devices)} total device(s)")
            return all_devices

        except Exception as e:
            logger.error(f"Error during BLE scan: {e}")
            raise

    def is_ipixel_device(self, device_name: str) -> bool:
        """
        Check if a device name suggests it's an iPixel Color panel

        Args:
            device_name: The BLE device name

        Returns:
            True if likely an iPixel device
        """
        if not device_name:
            return False

        name_lower = device_name.lower()
        return "ipixel" in name_lower or "pixel" in name_lower
