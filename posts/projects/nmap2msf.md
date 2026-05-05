---
title: "nmap2msf"
date: "2025-11-25"
tags: ["nmap", "metasploit"]
category: "project"
language: "Python"
status: "active"
"github": "https://github.com/turalshkrov/nmap2msf"
"excerpt": "Automate the creation of Metasploit resource scripts (.rc) for network enumeration, driven by Nmap XML scan results."
---

**Goal:** Automate the creation of Metasploit resource scripts (.rc) for network enumeration, driven by Nmap XML scan results. This tool focuses strictly on **safe auxiliary modules** for information gathering.

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    # Assuming the project files are in a directory
    ```
2.  **Install dependencies:**
    The script requires the `PyYAML` library for parsing the configuration file.
    ```bash
    pip install -r requirements.txt
    ```
3.  **Configuration:** Ensure `config.yaml` is in the same directory as `nmap2msfrc.py`. This file controls the service-to-module mappings and safety levels.

## Features

* **Flexible Configuration:** Uses a YAML file (`config.yaml`) for easy extension of services and modules.
* **Safe Enumeration:** Only uses non-destructive auxiliary modules (no exploits).
* **HTTP Enumeration:** Includes checks for common web files like `/robots.txt` and sitemaps.
* **Markdown Reporting:** Outputs a clear, readable Markdown report (`.md`) of the entire test plan.
* **Dry-Run Mode:** Allows reviewing the planned actions before execution.

## Usage

### 1. Nmap Scan

First, run an Nmap scan with service version detection (`-sV`) and XML output (`-oX`):

```bash
nmap -sV -O -oX nmap_scan.xml <target_ip_range>