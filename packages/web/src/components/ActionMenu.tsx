import { useEffect, useRef, useState } from "react";

/** The menu under ⋮ and its items; the board menu uses the same look. */
export const MENU =
  "absolute top-[calc(100%_+_8px)] right-0 z-10 flex w-[220px] flex-col border border-accent border-solid bg-surface kiosk:w-[280px]";
export const MENU_ITEM =
  "min-h-12 justify-start border-0 border-line-soft border-t border-solid bg-transparent px-3.5 text-left hover:bg-accent-tint focus-visible:bg-accent-tint kiosk:min-h-14 kiosk:px-4 kiosk:text-[14px]";
export const MENU_BUTTON =
  "kiosk:min-h-10 min-h-[30px] kiosk:min-w-10 min-w-[30px] bg-transparent p-0 font-text kiosk:text-[28px] text-[22px] tracking-normal aria-expanded:border-accent aria-expanded:bg-accent aria-expanded:text-accent-text";

export interface MenuItem {
  label: string;
  /** Destructive: shown in red. */
  danger?: boolean;
  run(): void;
}

/** A ⋮ button with a menu of actions; closes on a pick, a tap outside or Escape. */
export function ActionMenu(props: { label: string; items: MenuItem[] }) {
  const { label, items } = props;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className={`${MENU_BUTTON} min-h-11 min-w-11`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>
      {open && (
        <div className={MENU} role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`${MENU_ITEM} first:border-t-0 ${item.danger ? "text-danger" : ""}`}
              onClick={() => {
                setOpen(false);
                item.run();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
