// The fake device's page: the preset that's on, the last ones started, and an offline switch.
// Self-contained (nothing from the internet, docs/adr/0005); it asks `/sim/state` twice a second.

const html = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );

export function renderPage(name: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(name)}</title>
<style>
  body { margin: 0; font: 16px system-ui, sans-serif; background: #111; color: #eee; }
  main { max-width: 520px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  #light { height: 120px; display: flex; align-items: center; justify-content: center;
    font-size: 32px; font-weight: 700; border: 2px solid #444; background: #222; }
  #light.on { background: #3b2a6e; border-color: #a78bfa; }
  #light.offline { background: #2a1111; border-color: #a33; color: #f88; }
  ol { margin: 0; padding-left: 20px; color: #aaa; }
  button { font: inherit; padding: 10px 16px; }
</style>
</head>
<body>
<main>
  <h1>${html(name)}</h1>
  <div id="light">No preset yet</div>
  <button id="toggle" type="button">Go offline</button>
  <h2>Last presets</h2>
  <ol id="started"></ol>
</main>
<script>
  const light = document.getElementById("light");
  const toggle = document.getElementById("toggle");
  const list = document.getElementById("started");
  let online = true;
  async function refresh() {
    const view = await (await fetch("/sim/state")).json();
    online = view.online;
    light.className = !online ? "offline" : view.preset === null ? "" : "on";
    light.textContent = !online
      ? "Offline"
      : view.preset === null
        ? "No preset yet"
        : view.preset + " · " + (view.presetName ?? "?");
    toggle.textContent = online ? "Go offline" : "Come back online";
    list.replaceChildren(...view.started.map((id) => {
      const li = document.createElement("li");
      li.textContent = "Preset " + id;
      return li;
    }));
  }
  toggle.addEventListener("click", async () => {
    await fetch(online ? "/sim/offline" : "/sim/online", { method: "POST" });
    refresh();
  });
  refresh();
  setInterval(refresh, 500);
</script>
</body>
</html>`;
}
