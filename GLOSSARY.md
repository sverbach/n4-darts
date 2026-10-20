# n4-darts

Running private, offline dart tournaments in a room with automatically scored boards.

## Room

**Station**:
A place where a match is played: one board plus the screen(s) players use to follow and control the match. Identified by number.
_Avoid_: Lane, table, device

**Board**:
The physical dartboard with its camera rig, which reports where each dart landed. A board belongs to exactly one station.
_Avoid_: Station (when you mean the detector), camera, Autodarts

**Organiser**:
The person who sets up and runs a tournament.
_Avoid_: Admin, host, referee

**Player**:
A person who plays matches. Players persist across tournaments and build up a history.
_Avoid_: User, account, participant

## Play

**Dart**:
A single throw and the segment it scored (including a miss or bounce-out, which score zero).
_Avoid_: Throw, hit

**Visit**:
One player's turn at the board: up to three darts, ending when that player takes the darts out.
_Avoid_: Turn, round, throw

**Takeout**:
Removing the darts from the board, which ends a visit.
_Avoid_: Pull, clear

**Bust**:
A visit that would leave the player below zero or on a score they cannot finish from; it scores nothing.

**Checkout**:
The dart that brings a player's score to exactly zero under the out rule, winning the leg.
_Avoid_: Finish (as a noun for the winning dart)

**Leg**:
One game of X01 from the starting score down to zero; the first checkout wins it. Who throws first moves one place along the match's player order from leg to leg.
_Avoid_: Game

**Match**:
Two to eight players, in a fixed throwing order, playing legs until one reaches the number needed to win (first to N legs; with two players often said as best of N). Tournament matches are always two players.
_Avoid_: Game, fixture, pairing

**Correction**:
A player or the organiser changing a dart's recorded segment after a misdetection. The original detection is kept.
_Avoid_: Edit, override

## Tournament

**Tournament**:
A competition on one evening: a group phase followed by a knockout phase.
_Avoid_: Event, cup

**Group**:
A set of players in which everyone plays everyone once. Usually a tournament has a single group.
_Avoid_: Pool, league

**Knockout**:
The elimination phase after the groups, either single or double elimination.
_Avoid_: KO phase, playoffs, bracket (the bracket is the drawing of it)

**Seed**:
A player's position going into a tournament, derived from their rating.
_Avoid_: Rank, rating (when you mean the position)

**Rating**:
A player's recent 3-dart average (last 10 completed matches), used to work out seeds.
_Avoid_: Seed (the position), ranking

**Queue**:
The tournament matches that are ready to be played, in the order the scheduler will put them on stations.
_Avoid_: Backlog, schedule (the whole plan)

**Bracket reset**:
In double elimination, the extra deciding match played when the losers-bracket player wins the grand final.

**Walkover**:
A match counted as won without being played, because the opponent withdrew.
_Avoid_: Forfeit, bye

**Bye**:
A knockout slot without an opponent; the player advances without a match.
_Avoid_: Walkover

## Stats

**3-dart average**:
Points scored per dart, times three. Busts count their darts for zero; darts thrown after a visit was already over don't count.
_Avoid_: PPD (unless you mean per dart), average (alone, when it's ambiguous)

**First-9 average**:
The 3-dart average over the first three visits of each leg: how well a player scores before the checkout matters.

**Checkout %**:
The share of darts thrown at a one-dart finish (a double of 40 or less, or the bull) that finished the leg. Only double-out matches count.
_Avoid_: Doubles %, finishing rate

**Leaderboard**:
Every player with at least one counted match, ranked by rating.
_Avoid_: Ranking, table (that's a group's)

**Profile**:
One player's long-term stats page: averages, checkouts, scoring, results, the average per evening, tournaments and recent matches.

**Awards**:
The best of one tournament: best match average, highest checkout, most 180s, best leg.
_Avoid_: Prizes, records
