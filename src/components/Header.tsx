import { motion } from 'framer-motion';
import { Wifi, WifiOff, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Header() {
  const { status, deviceInfo } = useApp();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect sticky top-0 z-50 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
          >
            <Zap className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold glow-text">
              iPixel Control
            </h1>
            <p className="text-xs text-gray-400">
              LED Panel Management
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          {/* Device Info */}
          {deviceInfo && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30"
            >
              <span className="text-sm font-medium text-purple-300">
                {deviceInfo.width}×{deviceInfo.height}
              </span>
            </motion.div>
          )}

          {/* Connection Status */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              status.connected
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-gray-500/20 border border-gray-500/30'
            }`}
          >
            {status.connected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-400">
                  Disconnected
                </span>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
