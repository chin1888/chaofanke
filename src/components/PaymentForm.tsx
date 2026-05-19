import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentFormProps {
  onSubmit: (data: PaymentData) => void;
}

interface PaymentData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  name: string;
}

export default function PaymentForm({ onSubmit }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentData>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [errors, setErrors] = useState<Partial<PaymentData>>({});

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validate = (): boolean => {
    const newErrors: Partial<PaymentData> = {};
    if (formData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = '请输入有效的卡号';
    }
    if (formData.expiry.length < 5) {
      newErrors.expiry = '请输入有效期';
    }
    if (formData.cvv.length < 3) {
      newErrors.cvv = '请输入CVV';
    }
    if (formData.name.length < 2) {
      newErrors.name = '请输入持卡人姓名';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-gray-900" />
        <h2 className="text-xl font-bold text-gray-900">支付信息</h2>
        <Lock className="w-4 h-4 text-green-600 ml-auto" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">卡号</label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            maxLength={19}
            placeholder="0000 0000 0000 0000"
            value={formData.cardNumber}
            onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">有效期</label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              maxLength={5}
              placeholder="MM/YY"
              value={formData.expiry}
              onChange={(e) => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            {errors.expiry && <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              maxLength={4}
              placeholder="123"
              value={formData.cvv}
              onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">持卡人姓名</label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            placeholder="NAME ON CARD"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          确认支付
        </motion.button>
      </form>
    </motion.div>
  );
}
