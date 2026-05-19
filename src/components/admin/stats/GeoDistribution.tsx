import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface GeoData {
  province: string;
  city: string;
  user_count: number;
}

interface GeoDistributionProps {
  data: GeoData[];
}

export default function GeoDistribution({ data }: GeoDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.user_count, 0);
  const sortedData = [...data].sort((a, b) => b.user_count - a.user_count).slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">用户地域分布</h3>
      </div>

      <div className="space-y-4">
        {sortedData.map((item, index) => {
          const percentage = total > 0 ? (item.user_count / total) * 100 : 0;
          return (
            <div key={`${item.province}-${item.city}`} className="flex items-center">
              <span className="w-8 text-sm text-gray-400">{index + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{item.province} {item.city}</span>
                  <span className="text-sm text-gray-500">{item.user_count}人</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
              <span className="w-12 text-right text-sm text-gray-400">{percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
