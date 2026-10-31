// The organiser's area's layout pieces, shared by its tabs: sections, two-column layouts,
// labelled fields and the bottom buttons.

/** A section: a heading and its content. */
export const SECTION = "flex min-w-0 flex-col gap-3";
/** A section set off from the one above by a rule. */
export const RULED = `${SECTION} border-0 border-border border-t border-solid pt-6`;
/** A section heading with something on its right ("Players (5)" · "Shuffle"). */
export const SECTION_HEAD = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1";
/** A count in a heading: "(5)". */
export const COUNT = "text-accent";

/** Two columns on a wide screen: a wide main column and a narrower aside. */
export const COLUMNS = "flex flex-wrap items-start gap-x-10 gap-y-7";
/** Two columns of equal width on a wide screen. */
export const EVEN_COLUMNS = `${COLUMNS} [&>*]:flex-[1_1_460px]`;
export const MAIN = "flex min-w-0 flex-[999_1_560px] flex-col gap-7";
export const ASIDE = "flex min-w-0 flex-[1_1_340px] flex-col gap-6";

/** A page's title and its line below. */
export const HEAD = "flex flex-col gap-2 [&_p]:m-0";

/** A label above its input. */
export const FIELD =
  "flex max-w-[420px] flex-col gap-2 font-pixel text-[12px] text-muted uppercase tracking-[1px] [&_input]:min-h-14 [&_input]:text-[28px] [&_input]:text-text [&_input]:normal-case [&_input]:tracking-normal";

/** The bottom buttons: secondary on the left, the slanted primary twice as wide. */
export const CONTROLS = "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2.5 [&>button]:min-h-16";
/** The primary button in CONTROLS: smaller than a station's. */
export const CONTROLS_CTA = "primary cta px-5! text-[13px]!";

/** A list of cards: stations, the tournament's stations and queue. */
export const CARD_LIST = "m-0 flex list-none flex-col gap-2.5 p-0";
/** A card: a main part (title and details) and actions, wrapping on a phone. */
export const cardRow = (editing = false) =>
  editing
    ? "flex flex-col flex-nowrap items-stretch gap-x-4 gap-y-3 border-2 border-accent border-solid bg-panel px-4 py-3.5"
    : "flex flex-wrap items-center gap-x-4 gap-y-3 border border-border border-solid bg-panel px-4 py-3.5";
export const CARD_MAIN = "flex min-w-0 flex-[1_1_260px] flex-col gap-1.5";
/** The card's title line; `spread` puts its parts at both ends. */
export const cardTitle = (spread = false) =>
  `flex flex-wrap items-center gap-x-3 gap-y-2 ${spread ? "justify-between" : ""}`;
export const CARD_NAME = "font-pixel text-[15px] uppercase tracking-[1px] [&_a]:no-underline";
export const CARD_DETAIL = "wrap-anywhere";
/** The card's buttons, small; at the end of the row unless `start`. */
export const cardActions = (start = false) =>
  `flex flex-wrap gap-1.5 [&_button]:min-h-10 [&_button]:px-3.5 [&_button]:text-[11px] ${start ? "justify-start" : "justify-end"}`;

/** A small tag: "Held", "Pinned", "Online". */
export const badge = (tone: "" | "ok" | "warn" = "") =>
  `inline-flex min-h-6 items-center border border-solid px-2 font-pixel text-[10px] uppercase ${tone === "ok" ? "border-ok-line text-ok" : tone === "warn" ? "border-warn-line text-warn" : "border-border text-muted"}`;
/** A status pill (`status status-…`) at the size of a badge. */
export const STATUS_SMALL = "min-h-6! px-2! text-[10px]! before:size-1.5!";

/** A table in a framed panel. */
export const TABLE_PANEL = "border border-border border-solid bg-panel";

/** "Running", "Live": a dot and a word; green while it's on. */
export const runState = (running: boolean) =>
  `inline-flex items-center gap-2 font-pixel text-[12px] uppercase before:size-2 before:bg-current before:content-[''] ${running ? "text-ok" : "text-muted"}`;
