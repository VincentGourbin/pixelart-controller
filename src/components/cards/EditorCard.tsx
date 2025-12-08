import { motion } from 'framer-motion';
import { Type, Image, Grid3x3, Upload } from 'lucide-react';
import { Card } from '../Card';
import { useApp } from '../../context/AppContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

type EditorTab = 'text' | 'image' | 'pixels';

export function EditorCard() {
  const { status, sendText, sendImage } = useApp();
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  const [text, setText] = useState('Hello!');
  const [textColor, setTextColor] = useState('#FF00FF');

  const tabs = [
    { id: 'text' as const, name: 'Text', icon: Type },
    { id: 'image' as const, name: 'Image', icon: Image },
    { id: 'pixels' as const, name: 'Pixel Art', icon: Grid3x3 },
  ];

  const handleSendText = async () => {
    if (!status.connected) {
      toast.error('Connect to a device first');
      return;
    }

    try {
      await sendText({
        text,
        color: textColor.replace('#', ''),
        font: 'CUSONG',
        animation: 0,
        speed: 80,
        rainbow_mode: 0,
      });
      toast.success('Text sent');
    } catch (error) {
      toast.error('Failed to send text');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!status.connected) {
      toast.error('Connect to a device first');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await sendImage(file);
      toast.success('Image sent');
    } catch (error) {
      toast.error('Failed to send image');
    }
  };

  return (
    <Card title="Editor" icon={Type}>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2
                       transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Text</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text..."
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700
                           text-white placeholder-gray-500 focus:border-purple-500
                           focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-16 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700
                             text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendText}
              disabled={!status.connected || !text}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500
                         text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed
                         hover:shadow-glow transition-all"
            >
              Send Text
            </motion.button>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center
                           hover:border-purple-500 transition-colors">
              <input
                type="file"
                id="image-upload"
                accept="image/*,.gif"
                onChange={handleImageUpload}
                disabled={!status.connected}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${!status.connected && 'opacity-50 cursor-not-allowed'}`}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-400">
                  Click to upload image or GIF
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF supported
                </p>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'pixels' && (
          <div className="space-y-3">
            <div className="aspect-square bg-gray-900 rounded-lg border border-gray-700 p-2">
              <p className="text-center text-gray-400 text-sm py-8">
                Pixel editor coming soon...
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </Card>
  );
}
