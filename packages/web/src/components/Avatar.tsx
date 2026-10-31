import type { MatchPlayer } from "@n4/server/api";

/** "Sven Erbach" → "SE", "Ann" → "AN". */
const initials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

/** One of the nine avatar colours (tokens.css), steady per player. */
const colour = (id: string) =>
  `var(--avatar-${([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7) % 9) + 1})`;

export const photoUrl = (player: Pick<MatchPlayer, "id" | "photo">) =>
  `/api/players/${encodeURIComponent(player.id)}/photo?v=${encodeURIComponent(player.photo ?? "")}`;

/**
 * The player's photo, or their initials on a colour, as an octagon. Sized in `em` (or by the
 * `--avatar` property), so it follows the text around it; `large` is for scoreboards and headers.
 */
export function Avatar(props: {
  player: Pick<MatchPlayer, "id" | "name" | "photo">;
  large?: boolean;
}) {
  const { player, large } = props;
  // The size comes from `--avatar` on any parent (default 2em, 4em when large); the initials scale with it.
  const className = `avatar ${large ? "large [--size:var(--avatar,4em)]" : "[--size:var(--avatar,2em)]"} inline-flex size-[var(--size)] flex-none items-center justify-center object-cover align-middle text-text [clip-path:polygon(12.5%_0,87.5%_0,100%_12.5%,100%_87.5%,87.5%_100%,12.5%_100%,0_87.5%,0_12.5%)]`;
  if (player.photo) {
    return <img className={className} src={photoUrl(player)} alt="" loading="lazy" />;
  }
  return (
    <span className={className} style={{ background: colour(player.id) }} aria-hidden>
      <span className="font-pixel text-[length:calc(var(--size)*0.32)] uppercase leading-none">
        {initials(player.name)}
      </span>
    </span>
  );
}
