import { motion } from 'framer-motion';
import { Palette, Clock, Music, Grid3x3 } from 'lucide-react';
import { Card } from '../Card';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export function ModesCard() {
  const { status, setMode } = useApp();

  const modes = [
    {
      id: 'diy' as const,
      name: 'DIY Mode',
      icon: Grid3x3,
      color: 'from-purple-500 to-pink-500',
      description: 'Pixel-by-pixel control',
    },
    {
      id: 'clock' as const,
      name: 'Clock',
      icon: Clock,
      color: 'from-cyan-500 to-blue-500',
      description: 'Display time',
    },
    {
      id: 'rhythm' as const,
      name: 'Music Beat',
      icon: Music,
      color: 'from-green-500 to-emerald-500',
      description: 'Audio visualization',
    },
  ];

  const handleModeChange = async (modeId: 'clock' | 'rhythm' | 'diy') => {
    if (!status.connected) {
      toast.error('Connect to a device first');
      return;
    }

    try {
      await setMode(modeId);
      toast.success(`${modes.find(m => m.id === modeId)?.name} activated`);
    } catch (error) {
      toast.error('Failed to set mode');
    }
  };

  return (
    <Card title="Quick Modes" icon={Palette}>
      <div className="grid grid-cols-1 gap-3">
        {modes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleModeChange(mode.id)}
            disabled={!status.connected}
            className={`p-4 rounded-xl bg-gradient-to-r ${mode.color}
                       text-white font-medium flex items-center gap-3
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:shadow-lg transition-all group`}
          >
            <div className="p-2 rounded-lg bg-white/20">
              <mode.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">{mode.name}</p>
              <p className="text-xs opacity-80">{mode.description}</p>
            </div>
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              whileHover={{ x: 0, opacity: 1 }}
              className="text-xl"
            >
              →
            </motion.div>
          </motion.button>
        ))}
      </div>

      {!status.connected && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-400 mt-2"
        >
          Connect to a device to enable modes
        </motion.p>
      )}
    </Card>
  );
}
