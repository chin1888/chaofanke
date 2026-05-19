import React from 'react';
import { motion } from 'framer-motion';

interface AgeVerificationModalProps {
  onConfirm: () => void;
  onDeny: () => void;
}

export default function AgeVerificationModal({ onConfirm, onDeny }: AgeVerificationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
      >
        <h2 className="text-2xl font-bold mb-4">年龄验证</h2>
        <p className="text-gray-600 mb-8">
          本网站包含仅限成人观看的内容。请确认您已年满18岁。
        </p>
        <div className="flex gap-4">
          <button
            onClick={onDeny}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            未满18岁
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800"
          >
            我已满18岁
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
