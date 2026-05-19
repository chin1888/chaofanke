import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Store, Link2, Percent, TestTube, Save, Eye, EyeOff } from 'lucide-react';

interface GatewayConfig {
  apiKey: string;
  merchantId: string;
  publicKey: string;
  privateKey: string;
  feeRate: string;
  callbackUrl: string;
}

interface PaymentGatewayFormProps {
  gatewayName: string;
  initialConfig?: Partial<GatewayConfig>;
  onSave: (config: GatewayConfig) => void;
  onTest: (config: GatewayConfig) => Promise<boolean>;
}

export default function PaymentGatewayForm({ gatewayName, initialConfig, onSave, onTest }: PaymentGatewayFormProps) {
  const [config, setConfig] = useState<GatewayConfig>({
    apiKey: initialConfig?.apiKey || '',
    merchantId: initialConfig?.merchantId || '',
    publicKey: initialConfig?.publicKey || '',
    privateKey: initialConfig?.privateKey || '',
    feeRate: initialConfig?.feeRate || '2.9',
    callbackUrl: initialConfig?.callbackUrl || '',
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    onSave(config);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const success = await onTest(config);
      setTestResult({ success, message: success ? '连接测试成功' : '连接测试失败' });
    } catch {
      setTestResult({ success: false, message: '测试异常' });
    }
    setTesting(false);
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold mb-6">{gatewayName} 配置</h3>
      
      <div className="space-y-4">
        <motion.div whileFocus={{ scale: 1.01 }}>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Key className="w-4 h-4" /> API 密钥
          </label>
          <input type="text" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} className={inputClass} placeholder="输入 API 密钥" />
        </motion.div>

        <motion.div whileFocus={{ scale: 1.01 }}>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Store className="w-4 h-4" /> 商户 ID
          </label>
          <input type="text" value={config.merchantId} onChange={(e) => setConfig({ ...config, merchantId: e.target.value })} className={inputClass} placeholder="输入商户 ID" />
        </motion.div>

        <motion.div whileFocus={{ scale: 1.01 }}>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Key className="w-4 h-4" /> 公钥
          </label>
          <textarea value={config.publicKey} onChange={(e) => setConfig({ ...config, publicKey: e.target.value })} className={inputClass} rows={3} placeholder="输入公钥" />
        </motion.div>

        <motion.div whileFocus={{ scale: 1.01 }}>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Key className="w-4 h-4" /> 私钥
          </label>
          <div className="relative">
            <input type={showPrivateKey ? 'text' : 'password'} value={config.privateKey} onChange={(e) => setConfig({ ...config, privateKey: e.target.value })} className={inputClass} placeholder="输入私钥" />
            <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div whileFocus={{ scale: 1.01 }}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Percent className="w-4 h-4" /> 手续费率 (%)
            </label>
            <input type="number" step="0.1" value={config.feeRate} onChange={(e) => setConfig({ ...config, feeRate: e.target.value })} className={inputClass} placeholder="2.9" />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.01 }}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Link2 className="w-4 h-4" /> 回调 URL
            </label>
            <input type="url" value={config.callbackUrl} onChange={(e) => setConfig({ ...config, callbackUrl: e.target.value })} className={inputClass} placeholder="https://example.com/callback" />
          </motion.div>
        </div>

        {testResult && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResult.message}
          </motion.div>
        )}

        <div className="flex gap-3 pt-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTest} disabled={testing} className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50">
            <TestTube className="w-4 h-4" />
            {testing ? '测试中...' : '测试连接'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800">
            <Save className="w-4 h-4" />
            保存配置
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
