import React, { createContext, useContext, useState, useCallback } from 'react';

type PaymentMethod = 'credit_card' | 'paypal' | 'alipay' | 'wechat_pay' | 'bank_transfer';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

interface PaymentState {
  method: PaymentMethod | null;
  status: PaymentStatus;
  error: string | null;
  transactionId: string | null;
}

interface PaymentContextType {
  state: PaymentState;
  selectMethod: (method: PaymentMethod) => void;
  processPayment: (amount: number) => Promise<boolean>;
  resetPayment: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PaymentState>({
    method: null,
    status: 'idle',
    error: null,
    transactionId: null,
  });

  const selectMethod = useCallback((method: PaymentMethod) => {
    setState(prev => ({ ...prev, method, error: null }));
  }, []);

  const processPayment = useCallback(async (amount: number): Promise<boolean> => {
    if (!state.method) {
      setState(prev => ({ ...prev, error: '请选择支付方式' }));
      return false;
    }

    setState(prev => ({ ...prev, status: 'processing', error: null }));

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const success = Math.random() > 0.1;
      
      if (success) {
        setState({
          method: state.method,
          status: 'success',
          error: null,
          transactionId: `TXN-${Date.now()}`,
        });
        return true;
      } else {
        setState(prev => ({ ...prev, status: 'failed', error: '支付失败，请重试' }));
        return false;
      }
    } catch {
      setState(prev => ({ ...prev, status: 'failed', error: '支付处理异常' }));
      return false;
    }
  }, [state.method]);

  const resetPayment = useCallback(() => {
    setState({
      method: null,
      status: 'idle',
      error: null,
      transactionId: null,
    });
  }, []);

  return (
    <PaymentContext.Provider value={{ state, selectMethod, processPayment, resetPayment }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayment must be used within PaymentProvider');
  return context;
}
