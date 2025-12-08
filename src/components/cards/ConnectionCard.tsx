import { motion } from 'framer-motion';
import { Wifi, RefreshCw, Check } from 'lucide-react';
import { Card } from '../Card';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export function ConnectionCard() {
  const { devices, status, scanning, scanDevices, connect, disconnect } = useApp();

  const handleScan = async () => {
    try {
      await scanDevices();
      toast.success(`Found ${devices.length} device(s)`);
    } catch (error) {
      toast.error('Scan failed');
    }
  };

  const handleConnect = async (address: string) => {
    try {
      await connect(address);
      toast.success('Connected successfully');
    } catch (error) {
      toast.error('Connection failed');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Disconnected');
    } catch (error) {
      toast.error('Disconnect failed');
    }
  };

  return (
    <Card title="Connection" icon={Wifi}>
      {/* Scan Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleScan}
        disabled={scanning || status.connected}
        className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500
                   text-white font-medium flex items-center justify-center gap-2
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:shadow-glow transition-all"
      >
        <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
        {scanning ? 'Scanning...' : 'Scan for Devices'}
      </motion.button>

      {/* Device List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {devices.length === 0 && !scanning && (
          <p className="text-center text-gray-400 py-4">
            No devices found. Click scan to search.
          </p>
        )}

        {devices.map((device, index) => (
          <motion.div
            key={device.address}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border transition-all ${
              status.device_address === device.address
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-gray-800/50 border-gray-700 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-white">{device.name}</p>
                <p className="text-xs text-gray-400">{device.address}</p>
                {device.rssi && (
                  <p className="text-xs text-gray-500">Signal: {device.rssi} dBm</p>
                )}
              </div>

              {status.device_address === device.address ? (
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-sm
                             hover:bg-red-500/30 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(device.address)}
                  disabled={status.connected}
                  className="px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-400 text-sm
                             hover:bg-purple-500/30 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Connected Status */}
      {status.connected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
        >
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-300">
            Connected to panel
          </span>
        </motion.div>
      )}
    </Card>
  );
}
