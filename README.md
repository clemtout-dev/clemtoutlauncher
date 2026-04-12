# Clemtout Launcher

Clemtout Launcher is a custom-built, modern game launcher that provides an elegant interface to manage, launch, and patch your games. It features seamless Steam integration, automatic Steam emulator configuration fetching, and Photon network relay management for community server multiplayer.

## 🚀 Features

- **Modern UI/UX**: Built with HTML, CSS, and Vanilla JS, featuring a dark, high-tech glassmorphism aesthetic.
- **Steam Integration**: Extracts AppIDs automatically, fetches high-quality capsules from Steam CDN, and tracks local playtime across different Steam accounts.
- **Automated Game Patching**: Integrates an intelligent unpacking flow (Steamless) that detects SteamStub protection while bypassing non-protected files (like Unity exes) to prevent corruption.
- **Photon Network Relay**: A built-in configuration manager that modifies system hosts to redirect Exit Games (Photon) server traffic to community-hosted relays.
- **Multi-Launch Modes**: Launch games directly or through a Steam overlay wrapper (Spacewar - AppID 480) for advanced multiplayer capabilities.

## 🛠️ Architecture

### 1. Frontend (`/frontend`)
The presentation layer uses standard web technologies inside a `pywebview` window.

### 2. Backend (`/backend`)
The core logic is powered by a **Python Flask server** (`app.py`).

### 3. Photon Server Logic (External)
The multiplayer connectivity for Photon relays utilizes a customized version of **Luxon Server**.
> **Note on Luxon Server:**
> The server-side logic is based on the [Luxon Server](https://gitlab.com/luxon_project/LuxonServer) project.
> *Original code by Luxon Server contributors. Modified by Me for better compatibility and performance specifically for Photon network relays within ClemtoutLauncher.*
> **Note:** This code is not bundled within this repository's source but runs on the community-hosted server backend.

## ⚠️ Important: Initial Setup

Before using or compiling the launcher, please note that the integrated **SteamCMD** utility is not fully functional out of the box.

1. **Manual Initialization**: You must first navigate to the `backend/steamcmd` directory and execute `steamcmd.exe` manually. 
2. **Download Updates**: This allows the utility to download its internal files and update itself to the latest version.
3. **Installation Completion**: Once SteamCMD reaches the `Steam>` prompt, you can close it. 
4. **Compilation**: Only after this manual step should you proceed to compile the launcher or run the Python backend.

## 💬 Join the Community

[![Discord](https://img.shields.io/discord/123456789012345678?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/FmydUT2QGK)
Join our Discord server for support, updates, and community servers!

## ⚖️ Disclaimer & Sources

This launcher is a configuration utility intended for legitimate game owners to access alternative community servers. **This software does not endorse piracy.** Any misuse of this tool remains the sole responsibility of the end user. Clemtout Launcher is not affiliated with Valve Corporation, Steam, or Exit Games.

**Special Thanks & Attributions:**
- **Unpacker Engine:** [Steamless](https://github.com/atom0s/Steamless) by atom0s.
- **Steam Data Source:** [Manifesthub](https://gitlab.com/steamautocracks/manifesthub).
- **Server Backend Logic:** [Luxon Server](https://gitlab.com/luxon_project/LuxonServer) (BSD 3-Clause License).

---
*Created by the ClemtoutLauncher Team. Licensed for non-commercial use only.*
