import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Loader2, Truck, CheckCircle, XCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: '待处理', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  processing: { label: '处理中', color: 'text-blue-700', bg: 'bg-blue-100', icon: Loader2 },
  shipped: { label: '已发货', color: 'text-purple-700', bg: 'bg-purple-100', icon: Truck },
  completed: { label: '已完成', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </motion.span>
  );
}
