import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import type { Product } from '@/types/database';

const mockProduct: Product = {
  id: 'prod-001',
  name: 'Cinto Premium JR',
  price: 299.90,
  cost: 100,
  image: '/placeholder.svg',
  category: 'cintos',
  stock: 10,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext — fluxo de compra', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicia com carrinho vazio', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.getTotalItems()).toBe(0);
    expect(result.current.getTotalPrice()).toBe(0);
  });

  it('adiciona produto ao carrinho', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(mockProduct));
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].id).toBe('prod-001');
    expect(result.current.getTotalItems()).toBe(1);
  });

  it('incrementa quantidade ao adicionar produto já existente', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.addToCart(mockProduct));
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(2);
    expect(result.current.getTotalItems()).toBe(2);
  });

  it('calcula total corretamente', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.addToCart(mockProduct));
    expect(result.current.getTotalPrice()).toBeCloseTo(599.80);
  });

  it('remove produto do carrinho', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.removeFromCart('prod-001'));
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('atualiza quantidade manualmente', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.updateQuantity('prod-001', 5));
    expect(result.current.cartItems[0].quantity).toBe(5);
    expect(result.current.getTotalItems()).toBe(5);
  });

  it('remove item ao atualizar quantidade para zero', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.updateQuantity('prod-001', 0));
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('limpa carrinho completamente', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.clearCart());
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.getTotalItems()).toBe(0);
  });
});
