/**
 * Whether the cart drawer is open.
 *
 * A store rather than local state inside `CartDrawer`, because two other places
 * need to open it: the floating button that lives beside it, and the "done"
 * button at the bottom of the product modal. That last one is the reason this
 * exists at all — finishing a model and landing straight in the cart is what
 * tells the buyer their taps were recorded, on a flow whose whole promise is
 * that it is obvious what just happened.
 *
 * Not persisted. A drawer that is still open after a reload is a drawer nobody
 * opened.
 */
import { create } from 'zustand';

interface CartUiState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCartUi = create<CartUiState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
