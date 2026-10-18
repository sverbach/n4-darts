import { useEffect, useState } from "react";

export function App() {
  const [health, setHealth] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => setHealth(res.ok ? "ok" : "down"))
      .catch(() => setHealth("down"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <h1>n4-darts</h1>
      <p>Server: {health}</p>
    </main>
  );
}
