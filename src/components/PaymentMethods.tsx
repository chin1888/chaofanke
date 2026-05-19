import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'credit_card', name: 'Credit Card', icon: '💳' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️' },
  { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
  { id: 'google_pay', name: 'Google Pay', icon: '🔍' },
  { id: 'alipay', name: 'Alipay', icon: '💙' },
  { id: 'wechat_pay', name: 'WeChat Pay', icon: '💚' },
  { id: 'stripe', name: 'Stripe', icon: '💳' },
];

interface PaymentMethodsProps {
  onSelect: (methodId: string) => void;
}

export default function PaymentMethods({ onSelect }: PaymentMethodsProps) {
  const [selected, setSelected] = useState<string>('');

  const handleSelect = (id: string) => {
    setSelected(id);
    onSelect(id);
  };

  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <motion.button
          key={method.id}
          onClick={() => handleSelect(method.id)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            selected === method.id
              ? 'border-gray-900 bg-gray-50'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{method.icon}</span>
            <span className="font-medium text-gray-900">{method.name}</span>
          </div>
          {selected === method.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
