import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { checkPort, parseArgs, parseTarget } from "../src/index.js";

function listenOnEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve(server);
    });
  });
}

test("checkPort resolves true for an open port", async () => {
  const server = await listenOnEphemeralPort();
  const { port } = server.address();

  try {
    const reachable = await checkPort("127.0.0.1", port, 500);
    assert.equal(reachable, true);
  } finally {
    server.close();
  }
});

test("checkPort resolves false for a closed port", async () => {
  const server = await listenOnEphemeralPort();
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));

  const reachable = await checkPort("127.0.0.1", port, 500);
  assert.equal(reachable, false);
});

test("checkPort resolves false when the connection times out", async () => {
  // 10.255.255.1 is a non-routable address reserved for documentation/testing
  // (RFC 5737-style black hole) - connections should hang, not refuse.
  const reachable = await checkPort("10.255.255.1", 81, 200);
  assert.equal(reachable, false);
});

test("parseTarget splits host:port and validates the port range", () => {
  assert.deepEqual(parseTarget("db.internal:5432"), { host: "db.internal", port: 5432 });
  assert.throws(() => parseTarget("no-port"));
  assert.throws(() => parseTarget("host:0"));
  assert.throws(() => parseTarget("host:70000"));
});

test("parseArgs reads a custom --timeout and leaves targets in order", () => {
  const { targets, timeoutMs } = parseArgs(["a:1", "--timeout", "500", "b:2"]);
  assert.deepEqual(targets, ["a:1", "b:2"]);
  assert.equal(timeoutMs, 500);
});

test("parseArgs rejects a non-numeric --timeout", () => {
  assert.throws(() => parseArgs(["--timeout", "soon"]));
});
