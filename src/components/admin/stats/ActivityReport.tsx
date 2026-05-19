import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, TrendingUp, Download } from 'lucide-react';
import { supabase } from '../../../supabase/client';

interface ActivityStats {
  activeUsers: number;
  retainedUsers: number;
  churnedUsers: number;
  retentionRate: number;
}

export default function ActivityReport() {
  const [stats, setStats] = useState<ActivityStats>({
    activeUsers: 0,
    retainedUsers: 0,
    churnedUsers: 0,
    retentionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityStats();
  }, []);

  const fetchActivityStats = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: activityStats } = await supabase.from('user_activity_stats').select('*');
      
      const totalUsers = profiles?.length || 0;
      const activeUsers = activityStats?.filter(a => {
        const lastActive = new Date(a.last_active_at || '');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return lastActive >= sevenDaysAgo;
      }).length || 0;
      
      const retainedUsers = activityStats?.filter(a => (a.login_count || 0) > 3).length || 0;
      const churnedUsers = totalUsers - activeUsers;
      const retentionRate = totalUsers > 0 ? Math.round((retainedUsers / totalUsers) * 100) : 0;
      
      setStats({
        activeUsers,
        retainedUsers,
        churnedUsers,
        retentionRate
      });
    } catch (err) {
      console.error('Fetch activity stats error:', err);
    }
    setLoading(false);
  };

  const exportToExcel = () => {
    const data = [
      ['指标', '数值'],
      ['活跃用户', stats.activeUsers],
      ['留存用户', stats.retainedUsers],
      ['流失用户', stats.churnedUsers],
      ['留存率', `${stats.retentionRate}%`]
    ];
    
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '用户活跃度报表.csv';
    link.click();
  };

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">用户活跃度报表</h2>
        <button
          onClick={exportToExcel}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <Download className="w-4 h-4" />
          <span>导出 Excel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">活跃用户</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">留存用户</p>
              <p className="text-2xl font-bold">{stats.retainedUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">流失用户</p>
              <p className="text-2xl font-bold">{stats.churnedUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">留存率</p>
              <p className="text-2xl font-bold">{stats.retentionRate}%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
