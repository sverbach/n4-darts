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
  const className = `avatar ${large ? "large" : ""}`;
  if (player.photo) {
    return <img className={className} src={photoUrl(player)} alt="" loading="lazy" />;
  }
  return (
    <span className={className} style={{ background: colour(player.id) }} aria-hidden>
      <span className="avatar-initials">{initials(player.name)}</span>
    </span>
  );
}
