"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

/**
 * ── Why the sheet animates in but not out ─────────────────────────────────
 * Radix keeps a closing node mounted until it observes an `animationend` for
 * the exit animation. When that event never arrives the sheet stays up
 * *forever*, and because Radix also sets `pointer-events: none` on `<body>`
 * while a dialog is open, the whole page goes dead — the worst failure this
 * component can have, and one that cannot be recovered from without a reload.
 *
 * The event genuinely can fail to arrive. CSS animations do not advance in a
 * tab the browser is not compositing, so a sheet closed in a backgrounded or
 * hidden tab freezes mid-exit and is still frozen when the buyer comes back.
 * (That is not hypothetical: it is exactly what this component did under
 * automated inspection, where the page reported zero animation frames.)
 *
 * So the exit animations are removed and only the entrance is animated.
 * Closing is instant, which is what a dismissal should feel like anyway, and
 * the unmount no longer depends on an event the browser may never send. The
 * walkthrough dialog in `onboarding/how-to-use.tsx` reaches the same
 * conclusion from a different cause — see the note there.
 */

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * `forwardRef`, unlike most of the components in this folder.
 *
 * Radix wraps the overlay and the content in `Presence`, which keeps a closing
 * node mounted until it observes the exit animation ending — and it needs a ref
 * to the DOM node to do that. As a plain function component this silently
 * dropped the ref (React 18 warns about it), which risks leaving a dismissed
 * sheet's overlay on top of the page. The same failure mode is documented at
 * length in `onboarding/how-to-use.tsx`.
 */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn(
      "data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

/** Forwards its ref for the same reason `SheetOverlay` does — see there. */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
  }
>(({ className, children, side = "right", ...props }, ref) => {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in fixed z-50 flex flex-col gap-4 shadow-lg data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" && "data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
