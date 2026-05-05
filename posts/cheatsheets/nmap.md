---
title: "Nmap Cheat Sheet"
date: "2025-01-10"
tags: ["Nmap", "Recon", "Network", "Reference"]
category: "cheatsheet"
excerpt: "Common Nmap flags, scan types, and output options I use on every engagement."
---

## Scan Types

```bash
# SYN scan (default, requires root)
nmap -sS <target>

# TCP connect scan (no root needed)
nmap -sT <target>

# UDP scan
nmap -sU <target>

# Combined TCP + UDP
nmap -sS -sU <target>
```

## Port Selection

```bash
# Top 1000 ports (default)
nmap <target>

# All 65535 ports
nmap -p- <target>

# Specific ports
nmap -p 22,80,443,8080 <target>

# Port range
nmap -p 1-1000 <target>
```

## Speed & Timing

| Template | Flag | Use Case |
|----------|------|----------|
| Paranoid  | `-T0` | IDS evasion |
| Sneaky    | `-T1` | IDS evasion |
| Polite    | `-T2` | Low bandwidth |
| Normal    | `-T3` | Default |
| Aggressive| `-T4` | Fast networks |
| Insane    | `-T5` | LAN only |

## Service & Version Detection

```bash
# Version detection
nmap -sV <target>

# OS detection
nmap -O <target>

# Aggressive (version + OS + scripts + traceroute)
nmap -A <target>
```

## Scripts (NSE)

```bash
# Default scripts
nmap -sC <target>

# Specific script
nmap --script=http-title <target>

# Script category
nmap --script=vuln <target>
nmap --script=auth <target>
nmap --script=discovery <target>

# SMB enumeration
nmap --script=smb-enum-shares,smb-enum-users -p 445 <target>

# HTTP enumeration
nmap --script=http-enum -p 80,443 <target>
```

## Output

```bash
# Normal output
nmap -oN output.txt <target>

# XML output
nmap -oX output.xml <target>

# Grepable output
nmap -oG output.gnmap <target>

# All formats
nmap -oA output <target>
```

## My Standard First Scan

```bash
# Fast initial — top ports, version detection, default scripts
nmap -sC -sV -oN nmap/initial <target>

# Full port scan after initial
nmap -p- --min-rate 5000 -oN nmap/full <target>

# Targeted scan on discovered ports
nmap -sC -sV -p <open_ports> -oN nmap/targeted <target>
```

## Useful Combinations

```bash
# Firewall/IDS evasion fragments
nmap -f <target>

# Decoy scan
nmap -D RND:10 <target>

# Spoof source IP (doesn't work for getting results back)
nmap -S <spoofed_ip> <target>

# Scan from a list of targets
nmap -iL targets.txt
```
