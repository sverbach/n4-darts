// Away from the dev ports (3000, 3180/3181, 5173), so the tests can run next to `pnpm dev:sim`.
export const SERVER_PORT = 4300;
export const BOARD_PORTS = [4381, 4382];
export const BASE_URL = `http://localhost:${SERVER_PORT}`;
/** The admin PIN the test server runs with. */
export const PIN = "4242";
