import { useState, useCallback } from "react";

const STORAGE_KEY = "vco_cart";

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const items = parsed.items
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        ...item,
        quantity: Math.max(1, Number(item.quantity) || 1),
        priceMinor: Math.max(0, Number(item.priceMinor) || 0),
      }));

    if (!parsed.businessId || items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return { ...parsed, items };
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable.
    }
    return null;
  }
}

function writeCart(cart) {
  try {
    if (cart) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Private browsing
  }
}

export function useCart() {
  const [cart, setCart] = useState(() => readCart());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addToCart = useCallback((business, product, quantity = 1, variant = "") => {
    setCart((prev) => {
      // If different business, replace
      if (prev && prev.businessId !== business._id) {
        const confirmed = window.confirm(
          `Your cart already has items from ${prev.businessName}. One business per checkout. Replace?`
        );
        if (!confirmed) return prev;
      }

      const base = prev?.businessId === business._id ? prev : {
        businessId: business._id,
        businessName: business.businessName,
        businessSlug: business.slug,
        cashbackPercent: business.cashbackPercent || 0,
        items: [],
      };

      const existingIdx = base.items.findIndex(
        (i) => i.productId === product._id && i.variant === variant
      );

      let items;
      if (existingIdx >= 0) {
        items = base.items.map((item, i) =>
          i === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        items = [...base.items, {
          productId: product._id,
          name: product.name,
          type: product.type,
          priceMinor: product.priceMinor,
          currency: product.currency || "eur",
          quantity,
          variant,
          imageUrl: product.imageUrls?.[0] || null,
        }];
      }

      const next = { ...base, items };
      writeCart(next);
      return next;
    });
    setDrawerOpen(true);
  }, []);

  const removeFromCart = useCallback((productId, variant = "") => {
    setCart((prev) => {
      if (!prev) return null;
      const items = prev.items.filter(
        (i) => !(i.productId === productId && i.variant === variant)
      );
      const next = items.length > 0 ? { ...prev, items } : null;
      writeCart(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((productId, variant = "", quantity) => {
    setCart((prev) => {
      if (!prev) return null;
      if (quantity <= 0) {
        const items = prev.items.filter(
          (i) => !(i.productId === productId && i.variant === variant)
        );
        const next = items.length > 0 ? { ...prev, items } : null;
        writeCart(next);
        return next;
      }
      const items = prev.items.map((i) =>
        i.productId === productId && i.variant === variant ? { ...i, quantity } : i
      );
      const next = { ...prev, items };
      writeCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    writeCart(null);
    setCart(null);
  }, []);

  const cartItems = Array.isArray(cart?.items) ? cart.items : [];
  const subtotalMinor = cartItems.reduce(
    (sum, i) => sum + i.priceMinor * i.quantity,
    0
  );
  const cashbackMinor = cart
    ? Math.round((subtotalMinor * (cart.cashbackPercent || 0)) / 100)
    : 0;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    subtotalMinor,
    cashbackMinor,
    itemCount,
  };
}
