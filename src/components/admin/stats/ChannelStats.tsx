import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

interface ChannelData {
  channel: string;
  user_count: number;
  conversion_rate: number;
}

const mockData: ChannelData[] = [
  { channel: '搜索引擎', user_count: 120, conversion_rate: 15.5 },
  { channel: '社交媒体', user_count: 85, conversion_rate: 12.3 },
  { channel: '直接访问', user_count: 64, conversion_rate: 18.2 },
  { channel: '邮件营销', user_count: 32, conversion_rate: 8.5 },
  { channel: '广告投放', user_count: 48, conversion_rate: 10.1 },
];

export default function ChannelStats() {
  const handleExport = () => {
    const csv = [
      ['渠道', '用户数', '转化率(%)'],
      ...mockData.map(d => [d.channel, d.user_count, d.conversion_rate])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '渠道来源统计.csv';
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">渠道来源统计</h3>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <Download className="w-4 h-4" />
          <span>导出Excel</span>
        </button>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="channel" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="user_count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">渠道</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">用户数</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">转化率</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {mockData.map((item) => (
            <tr key={item.channel}>
              <td className="px-4 py-3">{item.channel}</td>
              <td className="px-4 py-3 text-right">{item.user_count}</td>
              <td className="px-4 py-3 text-right">{item.conversion_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
