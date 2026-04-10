'use client';

import { createContext, useContext } from 'react';
import type { CartContextType } from '@/types/types';

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
