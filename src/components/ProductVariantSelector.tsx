import React from 'react';
import { motion } from 'framer-motion';

interface VariantOption {
  id: string;
  name: string;
  value: string;
  color?: string;
}

interface VariantGroup {
  id: string;
  name: string;
  type: 'color' | 'size' | 'select';
  options: VariantOption[];
}

interface ProductVariantSelectorProps {
  variants: VariantGroup[];
  selectedVariants: Record<string, string>;
  onVariantChange: (groupId: string, optionId: string) => void;
}

export default function ProductVariantSelector({
  variants,
  selectedVariants,
  onVariantChange,
}: ProductVariantSelectorProps) {
  return (
    <div className="space-y-6">
      {variants.map((group) => (
        <div key={group.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{group.name}</span>
            <span className="text-red-500">*</span>
            {selectedVariants[group.id] && (
              <span className="text-sm text-gray-500">
                : {group.options.find((o) => o.id === selectedVariants[group.id])?.name}
              </span>
            )}
          </div>

          {group.type === 'color' ? (
            <div className="flex gap-3">
              {group.options.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => onVariantChange(group.id, option.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                    selectedVariants[group.id] === option.id
                      ? 'border-gray-900 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: option.color || option.value }}
                >
                  {selectedVariants[group.id] === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => onVariantChange(group.id, option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                    selectedVariants[group.id] === option.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {option.name}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
