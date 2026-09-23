#!/usr/bin/env node
import { createConnection } from "node:net";

const DEFAULT_TIMEOUT_MS = 2000;

/**
 * @param {string[]} argv
 * @returns {{ targets: string[], timeoutMs: number }}
 */
export function parseArgs(argv) {
  const targets = [];
  let timeoutMs = DEFAULT_TIMEOUT_MS;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--timeout") {
      i += 1;
      const value = Number(argv[i]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`--timeout expects a positive number of milliseconds, got "${argv[i]}"`);
      }
      timeoutMs = value;
    } else {
      targets.push(arg);
    }
  }

  return { targets, timeoutMs };
}

/**
 * @param {string} target host:port
 * @returns {{ host: string, port: number }}
 */
export function parseTarget(target) {
  const separatorIndex = target.lastIndexOf(":");
  if (separatorIndex === -1) {
    throw new Error(`target "${target}" is not in host:port form`);
  }
  const host = target.slice(0, separatorIndex);
  const port = Number(target.slice(separatorIndex + 1));
  if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`target "${target}" is not a valid host:port pair`);
  }
  return { host, port };
}

/**
 * @param {string} host
 * @param {number} port
 * @param {number} timeoutMs
 * @returns {Promise<boolean>} true if the port accepted a connection
 */
export function checkPort(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function main(argv) {
  const { targets, timeoutMs } = parseArgs(argv);

  if (targets.length === 0) {
    console.error("usage: portcheck <host:port> [host:port ...] [--timeout <ms>]");
    process.exitCode = 2;
    return;
  }

  let allReachable = true;

  for (const target of targets) {
    const { host, port } = parseTarget(target);
    const reachable = await checkPort(host, port, timeoutMs);
    allReachable = allReachable && reachable;
    console.log(`${target} ${reachable ? "OK" : "UNREACHABLE"}`);
  }

  process.exitCode = allReachable ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 2;
  });
}
