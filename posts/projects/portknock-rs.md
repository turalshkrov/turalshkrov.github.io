---
title: "portknock-rs"
date: "2025-02-20"
tags: ["Rust", "Networking", "Red Team", "Tool"]
category: "project"
language: "Rust"
status: "active"
github: "https://github.com/yourusername/portknock-rs"
excerpt: "A fast, async port-knocking client written in Rust. Supports TCP, UDP, and ICMP knock sequences with configurable delays."
---

## What it does

Port knocking is a technique where you send packets to a sequence of closed ports in a specific order to trigger the firewall to open a port — usually SSH. `portknock-rs` is a CLI tool that sends those knock sequences.

I wrote it because the existing tools (`knock`, `knockd`) are old, don't support async, and the Python alternatives are slow on sequences with tight timing windows.

## Why Rust

- Zero-copy packet construction via `pnet`
- Async I/O via `tokio` — parallel knocks when the sequence allows it
- Single compiled binary, no runtime dependencies
- Actually fast — important when the target has a sub-100ms knock window

## How it works

```
Client                     Firewall / Target
  |                               |
  |--- TCP SYN → port 7000 ------>|  (knock 1 — dropped, but logged)
  |--- TCP SYN → port 8000 ------>|  (knock 2 — dropped, but logged)
  |--- TCP SYN → port 9000 ------>|  (knock 3 — opens SSH)
  |                               |
  |--- TCP SYN → port 22 -------->|  (now accepted)
```

On the target, `knockd` or `fwknop` listens for the sequence and modifies `iptables` rules when it matches.

## Usage

```bash
# Basic TCP knock sequence
portknock-rs -h 10.10.10.5 -s 7000,8000,9000

# UDP sequence
portknock-rs -h 10.10.10.5 -s 7000,8000,9000 --proto udp

# Mixed protocols
portknock-rs -h 10.10.10.5 -s tcp:7000,udp:8000,tcp:9000

# Custom delay between knocks (ms)
portknock-rs -h 10.10.10.5 -s 7000,8000,9000 -d 500
```

## Installation

```bash
# From source
git clone https://github.com/yourusername/portknock-rs
cd portknock-rs
cargo build --release

# Binary is at ./target/release/portknock-rs
```

## Architecture

```
src/
├── main.rs          # CLI parsing (clap)
├── knocker.rs       # Core knock logic
├── proto/
│   ├── tcp.rs       # TCP SYN packets
│   ├── udp.rs       # UDP packets
│   └── icmp.rs      # ICMP echo packets
└── config.rs        # Sequence parsing
```

## Crates used

| Crate | Purpose |
|-------|---------|
| `tokio` | Async runtime |
| `pnet` | Raw packet construction |
| `clap` | CLI argument parsing |
| `anyhow` | Error handling |

## Roadmap

- [ ] ICMP sequence support
- [ ] Read sequences from config file
- [ ] Verbose mode with timing output
- [ ] Windows support (currently Linux/macOS only)
