import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function Card({ title, icon: Icon, children, className = '' }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`glass-effect rounded-2xl p-6 hover:shadow-glow transition-all ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>
      </div>

      {/* Card Content */}
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}
