# portcheck

A tiny, dependency-free CLI that checks whether one or more TCP ports are
reachable. Useful as a pre-deploy smoke check: confirm a database, cache, or
upstream service is actually accepting connections before rolling out
something that depends on it.

## Usage

```sh
node src/index.js <host:port> [host:port ...]
```

Example:

```sh
node src/index.js localhost:5432 redis.internal:6379
```

Each target is checked with a short connection timeout. The command prints
one line per target and exits non-zero if any target is unreachable, so it
plugs straight into a shell `&&` chain or a CI step.

```sh
node src/index.js db:5432 && ./deploy.sh
```

## Options

- `--timeout <ms>` — per-target connection timeout in milliseconds (default `2000`).

## Development

```sh
npm test
```

Tests spin up local TCP listeners on ephemeral ports and assert both the
reachable and unreachable paths, so they don't depend on network access.

## Validation

```sh
./validate.sh
```

Runs the same steps as CI locally: install, syntax check, tests, an
`npm audit` gate, and `actionlint` against the workflow file. It downloads
`actionlint` on first run if it isn't already on `PATH`.
