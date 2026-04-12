import { useState, useEffect, useCallback } from "react";
import { sdk } from "./medusa";
import type { HttpTypes } from "@medusajs/types";

const CART_ID_KEY = "medusa_cart_id";
const REGION_ID_KEY = "medusa_region_id";

const getCartId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_ID_KEY);
};

const setCartId = (id: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_ID_KEY, id);
};

const removeCartId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_ID_KEY);
};

let cachedRegionId: string | null = null;
let regionPromise: Promise<string | null> | null = null;

const fetchDefaultRegionId = async (): Promise<string | null> => {
  if (cachedRegionId) return cachedRegionId;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(REGION_ID_KEY);
    if (stored) {
      cachedRegionId = stored;
      return stored;
    }
  }

  if (regionPromise) return regionPromise;

  regionPromise = sdk.store.region
    .list({ limit: 1 })
    .then(({ regions }) => {
      const id = regions?.[0]?.id ?? null;
      if (id) {
        cachedRegionId = id;
        if (typeof window !== "undefined") {
          localStorage.setItem(REGION_ID_KEY, id);
        }
      }
      return id;
    })
    .catch(() => null)
    .finally(() => {
      regionPromise = null;
    });

  return regionPromise;
};

export const useProducts = () => {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const regionId = await fetchDefaultRegionId();
        const { products } = await sdk.store.product.list({
          fields:
            "*variants,*variants.calculated_price,+variants.inventory_quantity,*categories",
          limit: 100,
          ...(regionId ? { region_id: regionId } : {}),
        });
        setProducts(products);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

export const useProduct = (id: string | undefined) => {
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const regionId = await fetchDefaultRegionId();
        const { product } = await sdk.store.product.retrieve(id, {
          fields:
            "*variants,*variants.calculated_price,+variants.inventory_quantity,*images,*options,*options.values,*categories,*tags",
          ...(regionId ? { region_id: regionId } : {}),
        });
        setProduct(product);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<
    HttpTypes.StoreProductCategory[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { product_categories } = await sdk.store.category.list({
          fields: "+category_children",
        });
        setCategories(product_categories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};

export const useRegions = () => {
  const [regions, setRegions] = useState<HttpTypes.StoreRegion[]>([]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { regions } = await sdk.store.region.list();
        setRegions(regions);
      } catch (err) {
        console.error("Failed to fetch regions:", err);
      }
    };

    fetchRegions();
  }, []);

  return { regions };
};

export const useMedusaCart = () => {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    const cartId = getCartId();
    if (!cartId) {
      setLoading(false);
      return;
    }

    try {
      const { cart } = await sdk.store.cart.retrieve(cartId);
      if (cart.completed_at) {
        removeCartId();
        setCart(null);
      } else {
        setCart(cart);
      }
    } catch {
      removeCartId();
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const createCart = useCallback(async () => {
    try {
      const regionId = await fetchDefaultRegionId();
      const { cart } = await sdk.store.cart.create({
        ...(regionId ? { region_id: regionId } : {}),
      });
      setCartId(cart.id);
      setCart(cart);
      return cart;
    } catch (err) {
      console.error("Failed to create cart:", err);
      throw err;
    }
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity: number = 1) => {
      let currentCart = cart;
      if (!currentCart) {
        currentCart = await createCart();
      }

      try {
        await sdk.store.cart.createLineItem(currentCart.id, {
          variant_id: variantId,
          quantity,
        });
        await refreshCart();
      } catch (err) {
        console.error("Failed to add item:", err);
        throw err;
      }
    },
    [cart, createCart, refreshCart]
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      if (!cart) return;

      try {
        await sdk.store.cart.updateLineItem(cart.id, lineItemId, { quantity });
        await refreshCart();
      } catch (err) {
        console.error("Failed to update item:", err);
        throw err;
      }
    },
    [cart, refreshCart]
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      if (!cart) return;

      try {
        await sdk.store.cart.deleteLineItem(cart.id, lineItemId);
        await refreshCart();
      } catch (err) {
        console.error("Failed to remove item:", err);
        throw err;
      }
    },
    [cart, refreshCart]
  );

  const updateCart = useCallback(
    async (data: HttpTypes.StoreUpdateCart) => {
      if (!cart) return;

      try {
        const { cart: updatedCart } = await sdk.store.cart.update(
          cart.id,
          data
        );
        setCart(updatedCart);
        return updatedCart;
      } catch (err) {
        console.error("Failed to update cart:", err);
        throw err;
      }
    },
    [cart]
  );

  const completeCart = useCallback(async () => {
    if (!cart) return;

    try {
      const result = await sdk.store.cart.complete(cart.id);
      if (result.type === "order") {
        removeCartId();
        setCart(null);
      }
      return result;
    } catch (err) {
      console.error("Failed to complete cart:", err);
      throw err;
    }
  }, [cart]);

  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  return {
    cart,
    loading,
    totalItems,
    addItem,
    updateItem,
    removeItem,
    updateCart,
    completeCart,
    refreshCart,
    createCart,
  };
};

export const getProductPrice = (
  product: HttpTypes.StoreProduct
): { amount: number; currencyCode: string } | null => {
  const variant = product.variants?.[0];
  if (!variant) return null;

  const price = variant.calculated_price;
  if (!price) return null;

  return {
    amount: price.calculated_amount ?? 0,
    currencyCode: price.currency_code ?? "EUR",
  };
};

export const getVariantPrice = (
  variant: HttpTypes.StoreProductVariant
): { amount: number; currencyCode: string } | null => {
  const price = variant.calculated_price;
  if (!price) return null;

  return {
    amount: price.calculated_amount ?? 0,
    currencyCode: price.currency_code ?? "EUR",
  };
};

export const formatPrice = (amount: number, currencyCode: string): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
};
