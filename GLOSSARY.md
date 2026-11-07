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
One game of X01 from the starting score down to zero; the first checkout wins it. Who throws first moves one place along the match's player order from leg to leg. Party modes have no legs.
_Avoid_: Game

**Match**:
Two to eight players, in a fixed throwing order, playing legs until one reaches the number needed to win (first to N legs; with two players often said as best of N). Tournament matches are always two players. A party match is a single game, without legs.
_Avoid_: Game, fixture, pairing

**Mode**:
What a match is played as: X01 or one of the party modes. Chosen when the match is set up ("Game" on the station).
_Avoid_: Game type, variant (Cricket's standard or cut-throat is its variant)

**Correction**:
A player or the organiser changing a dart's recorded segment after a misdetection. The original detection is kept.
_Avoid_: Edit, override

**Added dart**:
A dart the board didn't detect, entered by hand on the station as the visit's next dart. It counts like any other.
_Avoid_: Manual dart, missed dart (the miss segment is a dart that hit no number)

**Call**:
What the caller's voice says after a change at the board: the visit's score on its third dart (again if a dart is corrected, or at takeout for a visit ended early), "No score" on a bust, "Game shot" on a checkout ("Game shot, and the match" when it wins the match). In party modes only the match shot is called, plus the visit scores in High Score. Played by any station screen or /watch with sound on.
_Avoid_: Announcement, callout (in UI copy)

**Voice pack**:
The recordings of every call, one file per call key (`0`–`180`, `gameshot`, `matchshot`, `busted`) in darts-caller's format. The default voice is built in; the organiser can upload others.
_Avoid_: Sound pack, caller (for the files)

**Light event**:
A moment of a match that can start a light preset at its station: match start, leg won, game shot, 180, 100+ visit (any visit of 100 or more), bust, high out (a checkout of 100+). Each has its own preset and seconds per station. Party modes fire match start and game shot (the win), and High Score also 180 and 100+ visit.
_Avoid_: Trigger, effect

**Base preset**:
The preset a station's lights go back to after a light event: "playing" while a match is on, "idle" otherwise.
_Avoid_: Default preset, background

## Party modes

**Party mode**:
A mode played for fun: Around the Clock, Golf, High Score, Killer or Cricket. Never in a tournament and never in the stats; a finished party match isn't listed anywhere.
_Avoid_: Fun game, mini-game

**Round**:
One visit by each player still in the game, in the throwing order. Only in party modes; X01 has legs and visits.
_Avoid_: Turn (that's a visit), leg

**Target**:
What the thrower has to hit next in a party mode: the next number in Around the Clock, the hole's number in Golf, their own number or opponents' doubles in Killer, the open numbers in Cricket.

**Target board**:
The drawn dartboard on the station and /watch that lights up the thrower's targets. The main element of the screen in modes that have targets.
_Avoid_: Virtual board, segment indicator

**Skip-ahead**:
Around the Clock's option where a double moves the player two targets on and a treble three.

**Hole**:
One round of Golf, aimed at its own number (hole 1 at 1, …; past 20 the bull, then 1 again). The visit's best dart is the hole's score: treble 1, double 2, single 3, anything else 5.

**Mark**:
A hit on a Cricket number or Killer's own number: single 1, double 2, treble 3 (outer bull 1, bull 2).

**Closed**:
A Cricket number a player has three marks on. Marks past three score while an opponent still has it open.

**Charge**:
The marks a Killer player has on their own number, up to three. At three they're a killer.

**Killer**:
A Killer player who's fully charged: doubles of other players' numbers now take their lives, and a double of their own takes one of theirs.

**Lives**:
What a Killer player loses to doubles of their number. At none they're out.

**Sudden death**:
Extra rounds between tied leaders only, after the last round of High Score, Golf or Cricket, until one is ahead after a round.
_Avoid_: Tie-break, play-off

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
