"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MarketplaceProduct } from "@/types/api";

const CART_KEY = "routiq.marketplace.cart.v1";
const WISHLIST_KEY = "routiq.marketplace.wishlist.v1";
const LOCATION_KEY = "routiq.marketplace.location.v1";

export interface CartLine {
  product: MarketplaceProduct;
  quantity: number;
}

interface MarketplaceContextValue {
  hydrated: boolean;
  cart: CartLine[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: MarketplaceProduct, quantity?: number) => boolean;
  setCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  wishlist: MarketplaceProduct[];
  wishlistCount: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: MarketplaceProduct) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  location: string;
  setLocation: (location: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private or restricted contexts.
  }
}

function isProduct(value: unknown): value is MarketplaceProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<MarketplaceProduct>;
  return (
    typeof product._id === "string" &&
    typeof product.name === "string" &&
    typeof product.price === "number"
  );
}

function normaliseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const line = entry as Partial<CartLine>;
    if (!isProduct(line.product)) return [];

    const max = Math.max(1, line.product.stock || 1);
    const quantity = Math.min(
      max,
      Math.max(1, Math.round(Number(line.quantity) || 1)),
    );

    return [{ product: line.product, quantity }];
  });
}

function normaliseWishlist(value: unknown): MarketplaceProduct[] {
  return Array.isArray(value) ? value.filter(isProduct) : [];
}

export default function MarketplaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<MarketplaceProduct[]>([]);
  const [location, setLocationState] = useState("Nigeria");

  useEffect(() => {
    // Hydration must start from the server snapshot, then adopt browser-only
    // storage. Reading storage during render would cause a hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart(normaliseCart(readStored<unknown>(CART_KEY, [])));
    setWishlist(normaliseWishlist(readStored<unknown>(WISHLIST_KEY, [])));
    setLocationState(readStored<string>(LOCATION_KEY, "Nigeria"));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(CART_KEY, cart);
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(WISHLIST_KEY, wishlist);
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(LOCATION_KEY, location);
  }, [location, hydrated]);

  const addToCart = useCallback(
    (product: MarketplaceProduct, quantity = 1) => {
      if (!product.inStock || product.stock <= 0) return false;

      setCart((current) => {
        const existing = current.find(
          (line) => line.product._id === product._id,
        );

        if (!existing) {
          return [
            ...current,
            {
              product,
              quantity: Math.min(product.stock, Math.max(1, quantity)),
            },
          ];
        }

        return current.map((line) =>
          line.product._id === product._id
            ? {
                ...line,
                quantity: Math.min(
                  product.stock,
                  line.quantity + Math.max(1, quantity),
                ),
              }
            : line,
        );
      });

      return true;
    },
    [],
  );

  const setCartQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.product._id !== productId);
      }

      return current.map((line) =>
        line.product._id === productId
          ? {
              ...line,
              quantity: Math.min(
                Math.max(1, line.product.stock || 1),
                Math.round(quantity),
              ),
            }
          : line,
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) =>
      current.filter((line) => line.product._id !== productId),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((product: MarketplaceProduct) => {
    let added = false;

    setWishlist((current) => {
      const exists = current.some((entry) => entry._id === product._id);
      added = !exists;

      return exists
        ? current.filter((entry) => entry._id !== product._id)
        : [product, ...current];
    });

    return added;
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((current) =>
      current.filter((entry) => entry._id !== productId),
    );
  }, []);

  const clearWishlist = useCallback(() => setWishlist([]), []);

  const isWishlisted = useCallback(
    (productId: string) =>
      wishlist.some((entry) => entry._id === productId),
    [wishlist],
  );

  const setLocation = useCallback((value: string) => {
    const trimmed = value.trim();
    setLocationState(trimmed || "Nigeria");
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((total, line) => total + line.quantity, 0),
    [cart],
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (total, line) => total + line.product.price * line.quantity,
        0,
      ),
    [cart],
  );

  const value = useMemo<MarketplaceContextValue>(
    () => ({
      hydrated,
      cart,
      cartCount,
      cartSubtotal,
      addToCart,
      setCartQuantity,
      removeFromCart,
      clearCart,
      wishlist,
      wishlistCount: wishlist.length,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
      location,
      setLocation,
    }),
    [
      hydrated,
      cart,
      cartCount,
      cartSubtotal,
      addToCart,
      setCartQuantity,
      removeFromCart,
      clearCart,
      wishlist,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
      location,
      setLocation,
    ],
  );

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);

  if (!context) {
    throw new Error("useMarketplace must be used inside MarketplaceProvider");
  }

  return context;
}
