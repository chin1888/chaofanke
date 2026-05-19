import React from 'react';
import { motion } from 'framer-motion';
import { X, Package, Truck, CreditCard, MapPin } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  items?: OrderItem[];
}

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const map: Record<string, string> = {
      unpaid: '未支付',
      paid: '已支付',
      refunded: '已退款'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">订单详情</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">订单号: {order.order_number}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
            <span className="text-2xl font-bold">${order.total_amount.toFixed(2)}</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-gray-700 mb-3">
              <Package className="w-4 h-4" />
              <span className="font-medium">商品信息</span>
            </div>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="font-medium">${item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无商品信息</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-gray-700 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">收货地址</span>
            </div>
            <p className="font-medium">{order.customer_name} {order.customer_phone}</p>
            <p className="text-gray-500 text-sm mt-1">{order.shipping_address}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-gray-700 mb-3">
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">支付信息</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">支付状态</span>
              <span>{getPaymentStatusText(order.payment_status || 'unpaid')}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">下单时间</span>
              <span>{new Date(order.created_at).toLocaleString('zh-CN')}</span>
            </div>
          </div>

          {order.status === 'shipped' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-700 mb-2">
                <Truck className="w-4 h-4" />
                <span className="font-medium">物流信息</span>
              </div>
              <p className="text-sm text-blue-600">您的订单已发货，请注意查收</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
