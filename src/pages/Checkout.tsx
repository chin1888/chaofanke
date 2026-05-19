import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, Check, Wallet, Building2, Smartphone } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase/client';
import SEO from '../components/SEO';

const iconMap: Record<string, React.ElementType> = {
  credit_card: CreditCard,
  paypal: Wallet,
  bank_transfer: Building2,
  alipay: Smartphone,
  wechat: Smartphone,
  apple_pay: CreditCard,
  google_pay: Wallet,
  stripe: CreditCard,
};

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_gateways')
      .select('id, code, name, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data) {
      setPaymentMethods(data);
      if (data.length > 0) {
        setPaymentMethod(data[0].code);
      }
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Please add items to your cart first</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        total_amount: totalPrice,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (order && !error) {
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);
      clearCart();
      alert('Order created successfully!');
      navigate('/');
    } else {
      alert('Order creation failed: ' + (error?.message || 'Unknown error'));
    }
    setIsSubmitting(false);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <>
      <SEO title="Checkout - ALWAHA | Secure & Convenient Shopping" description="Complete your ALWAHA order with multiple payment options." />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/cart')} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </button>

          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-gray-900' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                  <div className="space-y-4">
                    <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                    <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                    <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                    <textarea placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 border rounded-lg" rows={3} />
                  </div>
                  <button onClick={nextStep} className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Next Step</button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Select Payment Method</h2>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No payment methods available</div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((method) => {
                        const IconComponent = iconMap[method.code] || CreditCard;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.code)}
                            className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                              paymentMethod === method.code ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <IconComponent className="w-6 h-6" />
                            <span className="font-medium">{method.name}</span>
                            {paymentMethod === method.code && <Check className="w-5 h-5 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-4 mt-6">
                    <button onClick={prevStep} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">Previous</button>
                    <button onClick={nextStep} disabled={paymentMethods.length === 0} className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Next Step</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Confirmation</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between"><span className="text-gray-600">Recipient</span><span>{formData.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Contact</span><span>{formData.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Shipping Address</span><span>{formData.address}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Payment Method</span><span>{paymentMethods.find(m => m.code === paymentMethod)?.name}</span></div>
                    <div className="border-t pt-4 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={prevStep} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">Previous</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
                      {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-6 pt-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>€{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
