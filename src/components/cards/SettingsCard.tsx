import { motion } from 'framer-motion';
import { Settings, Sun, RotateCw, Power } from 'lucide-react';
import { Card } from '../Card';
import { useApp } from '../../context/AppContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function SettingsCard() {
  const { status, setBrightness, setOrientation, setPower } = useApp();
  const [brightness, setBrightnessLocal] = useState(50);
  const [orientation, setOrientationLocal] = useState(0);
  const [isPowered, setIsPowered] = useState(true);

  const handleBrightnessChange = async (value: number) => {
    setBrightnessLocal(value);
    if (!status.connected) return;

    try {
      await setBrightness({ brightness: value });
    } catch (error) {
      toast.error('Failed to set brightness');
    }
  };

  const handleOrientationChange = async (value: number) => {
    setOrientationLocal(value);
    if (!status.connected) return;

    try {
      await setOrientation({ orientation: value });
      toast.success(`Rotated to ${value * 90}°`);
    } catch (error) {
      toast.error('Failed to set orientation');
    }
  };

  const handlePowerToggle = async () => {
    if (!status.connected) {
      toast.error('Connect to a device first');
      return;
    }

    const newPowerState = !isPowered;
    setIsPowered(newPowerState);

    try {
      await setPower({ on: newPowerState });
      toast.success(newPowerState ? 'Power ON' : 'Power OFF');
    } catch (error) {
      toast.error('Failed to toggle power');
      setIsPowered(!newPowerState);
    }
  };

  return (
    <Card title="Settings" icon={Settings}>
      <div className="space-y-4">
        {/* Brightness */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Brightness
            </label>
            <span className="text-sm font-medium text-white">{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => handleBrightnessChange(Number(e.target.value))}
            disabled={!status.connected}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Orientation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              Orientation
            </label>
            <span className="text-sm font-medium text-white">{orientation * 90}°</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((value) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOrientationChange(value)}
                disabled={!status.connected}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                           ${orientation === value
                             ? 'bg-purple-500 text-white'
                             : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                           } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {value * 90}°
              </motion.button>
            ))}
          </div>
        </div>

        {/* Power Toggle */}
        <div>
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
            <Power className="w-4 h-4" />
            Power
          </label>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePowerToggle}
            disabled={!status.connected}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all
                       ${isPowered
                         ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                         : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                       } disabled:opacity-50 disabled:cursor-not-allowed
                       hover:shadow-lg`}
          >
            {isPowered ? 'Power ON' : 'Power OFF'}
          </motion.button>
        </div>

        {!status.connected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-gray-400"
          >
            Connect to a device to adjust settings
          </motion.p>
        )}
      </div>
    </Card>
  );
}
