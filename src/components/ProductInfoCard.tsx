import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Package, Check, Truck, Shield, RotateCcw } from 'lucide-react';

interface ProductInfoCardProps {
  name: string;
  sku: string;
  price: number;
  originalPrice?: number | null;
  shortDescription: string;
  boxContents?: string[];
}

export default function ProductInfoCard({
  name,
  sku,
  price,
  originalPrice,
  shortDescription,
  boxContents = []
}: ProductInfoCardProps) {
  const [isBoxOpen, setIsBoxOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
        <p className="text-sm text-gray-500 mb-3">SKU: {sku}</p>
        <p className="text-gray-600 text-lg leading-relaxed">{shortDescription}</p>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold text-gray-900">€{price.toFixed(2)}</span>
        {originalPrice && originalPrice > price && (
          <span className="text-xl text-gray-400 line-through">€{originalPrice.toFixed(2)}</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-200">
        <div className="flex flex-col items-center text-center gap-2">
          <Truck className="w-6 h-6 text-gray-600" />
          <span className="text-sm text-gray-600">免费配送</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          <Shield className="w-6 h-6 text-gray-600" />
          <span className="text-sm text-gray-600">2年质保</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          <RotateCcw className="w-6 h-6 text-gray-600" />
          <span className="text-sm text-gray-600">30天退换</span>
        </div>
      </div>

      {boxContents.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsBoxOpen(!isBoxOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">包装内含</span>
            </div>
            {isBoxOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          <AnimatePresence>
            {isBoxOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-4 pb-4">
                  <ul className="space-y-3">
                    {boxContents.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
