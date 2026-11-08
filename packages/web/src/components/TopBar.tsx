import type { ReactNode } from "react";
import { Logo } from "./Logo.tsx";
import { ThemeStar } from "./ThemeStar.tsx";

const STYLE = {
  page: {
    bar: "flex items-center justify-between gap-2 kiosk:gap-4 kiosk:px-6 px-4 kiosk:py-3 py-2.5",
    side: "flex min-w-0 items-center gap-1.5 kiosk:gap-2.5",
    start: "flex min-w-0 items-center gap-4",
    logo: "72px",
    star: { className: "size-11 kiosk:size-14" },
  },
  projector: {
    bar: "flex flex-none items-center justify-between gap-[calc(20*min(100vw,177.78vh)/1280)]",
    side: "flex min-w-0 items-center gap-[calc(20*min(100vw,177.78vh)/1280)]",
    start: "flex min-w-0 items-center gap-[calc(20*min(100vw,177.78vh)/1280)]",
    logo: "calc(72*min(100vw,177.78vh)/1280)",
    star: {
      className: "size-[max(36px,calc(44*min(100vw,177.78vh)/1280))] min-h-0",
      star: "w-[calc(20*min(100vw,177.78vh)/1280)]",
      flash: "text-[calc(18*min(100vw,177.78vh)/1280)]",
    },
  },
};

/** A page's top bar: the logo first, the theme star last (or before a ⋮ menu), the page's own content between. */
export function TopBar(props: {
  size?: "page" | "projector";
  contained?: boolean;
  hideLogoOnPhone?: boolean;
  start?: ReactNode;
  end?: ReactNode;
  menu?: ReactNode;
  className?: string;
}) {
  const style = STYLE[props.size ?? "page"];
  const bar = (
    <div className={`${style.bar} ${props.contained ? "mx-auto max-w-[1200px]" : ""}`}>
      <div className={style.start}>
        <Logo
          width={style.logo}
          className={`flex-none ${props.hideLogoOnPhone ? "max-kiosk:hidden" : ""}`}
        />
        {props.start}
      </div>
      <div className={style.side}>
        {props.end}
        <ThemeStar {...style.star} />
        {props.menu}
      </div>
    </div>
  );
  return <header className={props.className}>{bar}</header>;
}
