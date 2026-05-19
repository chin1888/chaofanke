import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, Check, AlertCircle } from 'lucide-react';

interface PaymentGateway {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  isTestMode: boolean;
  config?: {
    apiKey?: string;
    merchantId?: string;
    feeRate?: number;
  };
}

interface PaymentGatewayCardProps {
  gateway: PaymentGateway;
  onToggle: (id: string) => void;
  onUpdate: (id: string, config: any) => void;
}

export default function PaymentGatewayCard({ gateway, onToggle, onUpdate }: PaymentGatewayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState(gateway.config || { apiKey: '', merchantId: '', feeRate: 0 });

  const handleSave = () => {
    onUpdate(gateway.id, config);
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{gateway.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{gateway.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {gateway.isActive ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="w-3 h-3" /> 已启用
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <AlertCircle className="w-3 h-3" /> 已禁用
                </span>
              )}
              {gateway.isTestMode && (
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">测试模式</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onToggle(gateway.id)}
            className={`w-12 h-6 rounded-full transition-colors ${gateway.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <motion.div
              animate={{ x: gateway.isActive ? 24 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="输入 API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商户 ID</label>
                <input
                  type="text"
                  value={config.merchantId}
                  onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="输入商户 ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手续费率 (%)</label>
                <input
                  type="number"
                  value={config.feeRate}
                  onChange={(e) => setConfig({ ...config, feeRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
                >
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
