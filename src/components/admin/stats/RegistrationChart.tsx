import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, ChevronDown } from 'lucide-react';

interface ChartData {
  labels: string[];
  data: number[];
}

export default function RegistrationChart() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [showDropdown, setShowDropdown] = useState(false);

  const mockData: Record<string, ChartData> = {
    day: {
      labels: ['1日', '2日', '3日', '4日', '5日', '6日', '7日'],
      data: [12, 19, 8, 15, 22, 18, 25]
    },
    week: {
      labels: ['第1周', '第2周', '第3周', '第4周'],
      data: [45, 62, 38, 55]
    },
    month: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      data: [120, 180, 150, 220, 190, 240]
    }
  };

  const currentData = mockData[period];
  const maxValue = Math.max(...currentData.data);

  const periodLabels = {
    day: '日',
    week: '周',
    month: '月'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">用户注册趋势</h3>
            <p className="text-sm text-gray-500">新增用户统计</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>按{periodLabels[period]}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border z-10">
              {(['day', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    period === p ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  按{periodLabels[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-64 flex items-end space-x-4">
        {currentData.data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
              style={{ height: `${(value / maxValue) * 100}%` }}
            />
            <span className="text-xs text-gray-500 mt-2">{currentData.labels[index]}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">总注册量</p>
          <p className="text-2xl font-bold text-gray-900">
            {currentData.data.reduce((a, b) => a + b, 0)}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">平均{periodLabels[period]}</p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(currentData.data.reduce((a, b) => a + b, 0) / currentData.data.length)}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">最高{periodLabels[period]}</p>
          <p className="text-2xl font-bold text-gray-900">{maxValue}</p>
        </div>
      </div>
    </motion.div>
  );
}
