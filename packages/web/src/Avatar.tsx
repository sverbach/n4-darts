import type { MatchPlayer } from "@n4/server/api";

/** "Sven Erbach" → "SE", "Ann" → "A". */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** A steady colour per player, from their id. */
const hue = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export const photoUrl = (player: Pick<MatchPlayer, "id" | "photo">) =>
  `/api/players/${encodeURIComponent(player.id)}/photo?v=${encodeURIComponent(player.photo ?? "")}`;

/**
 * The player's photo, or their initials in a coloured circle. Sized in `em`, so it follows the
 * text around it; `large` is for scoreboards and headers.
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
    <span
      className={className}
      style={{ background: `hsl(${hue(player.id)} 45% 45%)` }}
      aria-hidden
    >
      {initials(player.name)}
    </span>
  );
}
