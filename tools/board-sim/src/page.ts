// The simulator's control page: click a dartboard to throw. Self-contained (no build step,
// nothing from the internet, docs/adr/0005); the board is drawn from the same geometry that
// turns a click back into a segment (`throwAt`).

import { ORDER, RINGS } from "./throws.ts";

const f = (n: number) => n.toFixed(4);

/** An annular wedge between two radii, centred on `degrees` (0 = towards 20, clockwise). */
function wedge(degrees: number, inner: number, outer: number) {
  const point = (r: number, deg: number) => {
    const rad = ((90 - deg) * Math.PI) / 180;
    return `${f(r * Math.cos(rad))} ${f(r * Math.sin(rad))}`;
  };
  const [a, b] = [degrees - 9, degrees + 9];
  return `M${point(outer, a)} A${outer} ${outer} 0 0 0 ${point(outer, b)} L${point(inner, b)} A${inner} ${inner} 0 0 1 ${point(inner, a)} Z`;
}

function boardSvg() {
  const parts: string[] = [];
  // The surround: clicks here are misses next to the nearest number.
  parts.push(`<circle class="surround" r="1.28" data-name="Miss"/>`);
  for (const [i, n] of ORDER.entries()) {
    const deg = i * 18;
    const dark = i % 2 === 0;
    const single = dark ? "dark" : "light";
    const ring = dark ? "red" : "green";
    parts.push(
      `<path class="seg ${single}" data-name="S${n}" d="${wedge(deg, RINGS.outerBull, RINGS.trebleInner)}"/>`,
      `<path class="seg ${ring}" data-name="T${n}" d="${wedge(deg, RINGS.trebleInner, RINGS.trebleOuter)}"/>`,
      `<path class="seg ${single}" data-name="S${n}" d="${wedge(deg, RINGS.trebleOuter, RINGS.doubleInner)}"/>`,
      `<path class="seg ${ring}" data-name="D${n}" d="${wedge(deg, RINGS.doubleInner, RINGS.doubleOuter)}"/>`,
    );
  }
  parts.push(
    `<circle class="seg green" data-name="25" r="${RINGS.outerBull}"/>`,
    `<circle class="seg red" data-name="Bull" r="${RINGS.bull}"/>`,
    `<g id="markers"></g>`,
  );
  // Numbers sit outside the flipped group so the text isn't mirrored.
  const labels = ORDER.map((n, i) => {
    const rad = ((90 - i * 18) * Math.PI) / 180;
    return `<text x="${f(1.14 * Math.cos(rad))}" y="${f(-1.14 * Math.sin(rad))}">${n}</text>`;
  }).join("");
  return `<svg id="board" viewBox="-1.3 -1.3 2.6 2.6" role="img" aria-label="Dartboard: click to throw">
  <g id="flip" transform="scale(1,-1)">${parts.join("")}</g>
  <g class="labels">${labels}</g>
</svg>`;
}

export function renderPage(port: number) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Board sim :${port}</title>
<style>
  :root {
    --bg: #f4f2ee; --panel: #ffffff; --text: #1c1b19; --muted: #6b6760; --line: #dcd8d0;
    --accent: #1f6feb; --ok: #1a7f37; --bad: #cf222e;
    --dark: #1d1d1d; --light: #efe6cf; --red: #d0312d; --green: #1f8a4c; --surround: #2b2b2b;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #151514; --panel: #1f1f1d; --text: #ecebe8; --muted: #9a968e; --line: #34332f;
      --accent: #4c8dff; --ok: #3fb950; --bad: #f85149; color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #151514; --panel: #1f1f1d; --text: #ecebe8; --muted: #9a968e; --line: #34332f;
    --accent: #4c8dff; --ok: #3fb950; --bad: #f85149; color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.4 system-ui, sans-serif; }
  main { max-width: 980px; margin: 0 auto; padding: 16px; display: grid; gap: 16px;
         grid-template-columns: minmax(0, 1fr) 300px; align-items: start; }
  @media (max-width: 760px) { main { grid-template-columns: minmax(0, 1fr); } }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px; }
  .board-wrap { position: relative; }
  #board { width: 100%; max-width: 640px; display: block; margin: 0 auto; cursor: crosshair; user-select: none; }
  .surround { fill: var(--surround); }
  .seg { stroke: #9a9a9a; stroke-width: 0.004; }
  .seg.dark { fill: var(--dark); } .seg.light { fill: var(--light); }
  .seg.red { fill: var(--red); } .seg.green { fill: var(--green); }
  .seg:hover { filter: brightness(1.35); }
  .labels text { fill: #fff; font-size: 0.11px; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
  .marker { fill: #ffd400; stroke: #000; stroke-width: 0.008; pointer-events: none; }
  .marker.revising { fill: var(--accent); }
  #hover { position: absolute; top: 8px; left: 8px; background: var(--panel); border: 1px solid var(--line);
           border-radius: 6px; padding: 2px 8px; font-weight: 600; min-width: 48px; text-align: center; }
  .status { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; margin: 8px 0 0; }
  .status dt { color: var(--muted); } .status dd { margin: 0; font-weight: 600; }
  .ok { color: var(--ok); } .bad { color: var(--bad); }
  h2 { font-size: 14px; margin: 16px 0 6px; color: var(--muted); font-weight: 600; }
  ol#darts { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
  ol#darts button { width: 100%; text-align: left; }
  ol#darts button[aria-pressed="true"] { border-color: var(--accent); outline: 2px solid var(--accent); }
  .empty { color: var(--muted); }
  .buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  button { font: inherit; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line);
           background: var(--bg); color: var(--text); cursor: pointer; }
  button:hover { border-color: var(--muted); }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  form { display: flex; gap: 6px; }
  input { font: inherit; flex: 1; min-width: 0; padding: 8px 10px; border-radius: 8px;
          border: 1px solid var(--line); background: var(--bg); color: var(--text); }
  .hint { color: var(--muted); font-size: 13px; margin: 6px 0 0; }
  #error { color: var(--bad); min-height: 1.4em; margin: 8px 0 0; font-size: 13px; }
</style>
</head>
<body>
<main>
  <section class="panel board-wrap">
    <div id="hover">–</div>
    ${boardSvg()}
  </section>
  <aside class="panel">
    <h1>Board sim :${port}</h1>
    <dl class="status">
      <dt>Board</dt><dd id="online">…</dd>
      <dt>Status</dt><dd id="status">…</dd>
      <dt>Event</dt><dd id="event">…</dd>
      <dt>Server</dt><dd id="clients">…</dd>
    </dl>

    <h2>Darts on the board</h2>
    <ol id="darts"></ol>
    <p class="hint" id="revise-hint">Tap a dart, then the board, to revise it.</p>

    <h2>Board</h2>
    <div class="buttons">
      <button type="button" class="primary" data-post="/sim/takeout">Takeout</button>
      <button type="button" id="bounce">Bounce-out</button>
      <button type="button" data-post="/sim/reset">Reset</button>
      <button type="button" id="run">Stop</button>
      <button type="button" id="power">Go offline</button>
    </div>

    <h2>Throw by name</h2>
    <form id="by-name">
      <input id="name" placeholder="T20, D16, SO5, 25, BULL, M3" autocomplete="off" aria-label="Dart">
      <button type="submit">Throw</button>
    </form>
    <p id="error" role="status"></p>
  </aside>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  const board = $("board");
  const flip = $("flip");
  let view = null;
  let revising = null;

  async function post(path, body) {
    $("error").textContent = "";
    const res = await fetch(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) $("error").textContent = (await res.text()) || res.status + " " + res.statusText;
  }

  function render() {
    if (!view) return;
    const { online, state, boardClients } = view;
    $("online").textContent = online ? "online" : "offline";
    $("online").className = online ? "ok" : "bad";
    $("status").textContent = state.status;
    $("event").textContent = state.event;
    $("clients").textContent = boardClients ? boardClients + " connected" : "not connected";
    $("clients").className = boardClients ? "ok" : "bad";
    $("run").textContent = state.running ? "Stop" : "Start";
    $("power").textContent = online ? "Go offline" : "Go online";

    const throws = state.throws || [];
    if (revising !== null && revising >= throws.length) revising = null;
    const list = $("darts");
    list.replaceChildren();
    if (!throws.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "None";
      list.append(li);
    }
    throws.forEach((t, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = (i + 1) + ". " + t.segment.name + (t.bouncer ? " (bounce-out)" : "");
      b.setAttribute("aria-pressed", String(revising === i));
      b.onclick = () => { revising = revising === i ? null : i; render(); };
      li.append(b);
      list.append(li);
    });
    $("revise-hint").textContent = revising === null
      ? "Tap a dart, then the board, to revise it."
      : "Now tap the board where dart " + (revising + 1) + " should be.";

    const markers = $("markers");
    markers.replaceChildren();
    throws.forEach((t, i) => {
      if (t.bouncer) return;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", t.coords.x);
      c.setAttribute("cy", t.coords.y);
      c.setAttribute("r", "0.03");
      c.setAttribute("class", "marker" + (revising === i ? " revising" : ""));
      markers.append(c);
    });
  }

  /** Click position in board coordinates (bull at 0,0, y towards 20). */
  function boardPoint(event) {
    const p = board.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const { x, y } = p.matrixTransform(flip.getScreenCTM().inverse());
    return { x, y };
  }

  board.addEventListener("click", (event) => {
    const coords = boardPoint(event);
    if (revising !== null) {
      const index = revising;
      revising = null;
      post("/sim/revise", { index, coords });
    } else {
      post("/sim/dart", { coords });
    }
  });
  board.addEventListener("mousemove", (event) => {
    const name = event.target.dataset && event.target.dataset.name;
    $("hover").textContent = name || "–";
  });
  board.addEventListener("mouseleave", () => { $("hover").textContent = "–"; });

  for (const b of document.querySelectorAll("[data-post]")) {
    b.onclick = () => post(b.dataset.post);
  }
  $("bounce").onclick = () => post("/sim/dart", { name: "BOUNCE" });
  $("run").onclick = () => post(view && view.state.running ? "/sim/stop" : "/sim/start");
  $("power").onclick = () => post(view && view.online ? "/sim/offline" : "/sim/online");
  $("by-name").onsubmit = (event) => {
    event.preventDefault();
    const name = $("name").value.trim();
    if (!name) return;
    post("/sim/dart", { name }).then(() => { $("name").value = ""; });
  };

  function connect() {
    const ws = new WebSocket(location.origin.replace(/^http/, "ws") + "/sim/events");
    ws.onmessage = (e) => { view = JSON.parse(e.data); render(); };
    ws.onclose = () => {
      $("online").textContent = "sim not running";
      $("online").className = "bad";
      setTimeout(connect, 1000);
    };
  }
  connect();
</script>
</body>
</html>
`;
}
