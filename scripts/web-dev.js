/**
 * Dev wrapper for `expo start --web`.
 *
 * expo-sqlite on web requires cross-origin isolation headers (COOP/COEP) on the
 * root document. The Expo CLI serves the root HTML shell outside the Metro
 * middleware stack, so Metro's `enhanceMiddleware` cannot cover it. This proxy
 * injects the headers on every response and forwards everything else (including
 * WebSocket upgrades) to the internal Expo server.
 *
 * Public port: 8081 (what the user opens / Expo Go scans).
 * Internal port: 8092 (real Expo server).
 */
const { spawn } = require('child_process');
const http = require('http');

const PUBLIC_PORT = Number(process.env.WEB_PUBLIC_PORT ?? 8081);
const INTERNAL_PORT = Number(process.env.WEB_INTERNAL_PORT ?? 8092);

const ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
};

function startExpo() {
  const child = spawn('npx', ['expo', 'start', '--web', '--port', String(INTERNAL_PORT)], {
    stdio: 'inherit',
    env: { ...process.env, EXPO_NO_TELEMETRY: '1' },
    shell: process.platform === 'win32',
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

function proxyRequest(req, res) {
  const upstream = http.request(
    {
      hostname: 'localhost',
      port: INTERNAL_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (upstreamRes) => {
      const headers = { ...upstreamRes.headers, ...ISOLATION_HEADERS };
      res.writeHead(upstreamRes.statusCode ?? 502, headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, ISOLATION_HEADERS);
    res.end('Expo dev server is not reachable yet, try again in a moment.');
  });
  req.pipe(upstream);
}

function startProxy() {
  const server = http.createServer((req, res) => proxyRequest(req, res));
  // WebSocket upgrades (Metro HMR, Expo devtools) pass through untouched.
  server.on('upgrade', (req, socket, head) => {
    const upstream = http.request({
      hostname: 'localhost',
      port: INTERNAL_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    });
    upstream.on('upgrade', (upRes, upSocket, upHead) => {
      const lines = [`HTTP/1.1 101 Switching Protocols`];
      for (const [key, value] of Object.entries(upRes.headers)) {
        lines.push(`${key}: ${value}`);
      }
      socket.write(lines.join('\r\n') + '\r\n\r\n');
      upSocket.pipe(socket);
      socket.pipe(upSocket);
      if (upHead?.length) socket.write(upHead);
    });
    upstream.on('error', () => socket.destroy());
    upstream.end();
    if (head?.length) socket.write(head);
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\nPort ${PUBLIC_PORT} is busy. Close the other process (often a leftover 'npm start') and run 'npm run web' again.\n`);
      process.exit(1);
    }
    throw error;
  });
  server.listen(PUBLIC_PORT, () => {
    console.log(`\nRSS Lingo web dev proxy: http://localhost:${PUBLIC_PORT} (headers injected) -> expo on :${INTERNAL_PORT}\n`);
  });
}

startExpo();
startProxy();
