import type { MatchView } from "@n4/server/api";
import { bermudaOf, checkoutOf } from "../lib/modes.ts";
import { BermudaPanel } from "./BermudaPanel.tsx";
import { CheckoutPanel } from "./CheckoutPanel.tsx";
import type { CardsSize } from "./PlayerCards.tsx";

/** What a mode shows beside the board besides the players: Random Checkout's number, Bermuda's targets. */
export function ModePanel({ match, size = "station" }: { match: MatchView; size?: CardsSize }) {
  const checkout = checkoutOf(match);
  if (checkout) return <CheckoutPanel state={checkout.state} route={checkout.route} size={size} />;
  const bermuda = bermudaOf(match);
  if (bermuda) return <BermudaPanel state={bermuda} size={size} />;
  return null;
}

export const hasModePanel = (match: MatchView) => !!(checkoutOf(match) || bermudaOf(match));
