# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multiplayer tic-tac-toe server in Swift using the Hummingbird 2 web framework. Players join via HTTP and take turns placing marks on a 100x100 grid. The game state is managed by a Swift actor (`GameSession`) for concurrency safety.

## Build & Run Commands

```bash
swift build                    # Build the project
swift run App                  # Run the server (default: 127.0.0.1:8080)
swift run App --hostname 0.0.0.0 --port 9090 --players-limit 500  # Custom options
swift test                     # Run all tests
swift test --filter AppTests.health  # Run a single test
```

The server accepts `--hostname`, `--port`, `--log-level`, and `--players-limit` CLI arguments (via ArgumentParser).

## Architecture

- **`App.swift`** — Entry point. `@main` struct using `AsyncParsableCommand` for CLI arg parsing.
- **`Application+build.swift`** — Builds the Hummingbird application, configures routes and middleware. Defines `AppArguments` protocol shared between app and tests.
- **`API.swift`** — HTTP route handlers. Two endpoints under `/api`:
  - `POST /api/join` — Adds a player, returns `{ uid, team }`
  - `POST /api/turn` — Makes a move, expects JSON `{ pid, row, col }`
  - `GET /health` — Health check (defined in Application+build)
- **`Game/GameSession.swift`** — Swift `actor` holding all game state (players, turn order, 100x100 board). Enforces move validation rules.
- **`Game/Player.swift`** — Value types: `Player`, `Move`, `Team` (noughts/crosses with toggle).

## Testing

Tests use Swift Testing (`@Test`, `@Suite`, `#expect`) with `HummingbirdTesting`. The test helper `makeApp()` builds the app via the shared `AppArguments` protocol with `port: 0` (OS-assigned) and `.router` test mode (in-process, no real network).

## Swift & Dependencies

- Swift tools version: 5.9, minimum platform: macOS 14
- Hummingbird 2 (RC), swift-argument-parser
