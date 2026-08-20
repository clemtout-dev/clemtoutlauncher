# Clemtout Launcher

**Clemtout Launcher** is a modern, custom-built **all-in-one launcher and suite** that unifies multiple third-party utilities, game patching engines, Epic Online Services (EOS) bypass tools, and network management tools into a single, seamless interface. 

It acts as an orchestration layer designed to help game owners manage, launch, patch, and configure alternative multiplayer connections efficiently from one central dashboard.

---

## Features

- **All-In-One Unified Suite**: Aggregates essential game management, patching, bypass, and networking tools into a single application.
- **Modern UI/UX**: Built with HTML, CSS, and Vanilla JS inside `pywebview`, featuring a dark, high-tech glassmorphism aesthetic.
- **Steam Integration**: Extracts AppIDs automatically, fetches high-quality capsules from Steam CDN, and tracks local playtime across different Steam accounts.
- **Automated Game Patching & Unpacking**: Integrates smart unpacking mechanisms (Steamless) to detect SteamStub protection while bypassing non-protected files (like Unity executables) to prevent corruption.
- **EOS / Epic Games SDK Bypass**: Incorporates Epic Online Services (EOS) handling via OnlineFix scripts for enhanced compatibility with modified game clients and multiplayer overlays.
- **Multi-Launch Modes**: Launch games directly or through a Steam overlay wrapper (Spacewar - AppID 480) for community multiplayer functionality.

---

## 🛠️ Integrated Sources & Underlying Tools

Clemtout Launcher is an interface built upon the work of several open-source projects and external web services. We strongly encourage users to check out the original sources:

| Tool / API | Role in Clemtout Launcher | Official Source |
| :--- | :--- | :--- |
| **OpenSteamTool** | Steam integration & tool execution | [GitHub Repository](https://github.com/OpenSteam001/OpenSteamTool) |
| **Steamless** | Intelligent unpacking engine (SteamStub removal) | [GitHub Repository](https://github.com/atom0s/Steamless) |
| **OnlineFix (EOS Bypass)** | Epic Games SDK / EOS overlay and bypass modules | [GitHub Repository](https://github.com/Ran-Mewo/OnlineFix) |
| **Walftech Lua API** | External configurations & `.lua` API integration | [Walftech Website](https://walftech.com) |

---

## Architecture

### 1. Frontend (`/frontend`)
The presentation layer uses standard web technologies rendered via a Python `pywebview` frame.

### 2. Backend (`/backend`)
Powered by a **Python Flask server** (`app.py`), orchestrating local scripts, `.lua` configurations, EOS integration scripts, and system-level host modifications.

## Community & Support

[![Discord](https://img.shields.io/discord/123456789012345678?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/FmydUT2QGK)

Join our Discord community for updates, troubleshooting, and server announcements!

---

## ⚖️ Disclaimer & Intellectual Property Notice

### Interface Notice
Clemtout Launcher is purely a **frontend interface and configuration wrapper** designed to combine existing standalone tools into a single user experience. **Clemtout Launcher does not claim ownership over any integrated third-party engines, APIs, bypasses, or scripts.**

### Copyright & Rights Holders
If you are a copyright holder or developer with questions, DMCA concerns, or licensing inquiries regarding specific modules (such as Steamless, OpenSteamTool, OnlineFix, or Walftech scripts), **you must refer directly to the respective upstream source repositories and original creators listed in the [Integrated Sources](#-integrated-sources--underlying-tools) section.**

### Terms of Use
This tool is intended solely for legitimate game owners accessing alternative community infrastructure. This software does not endorse or encourage piracy. Any misuse of this tool remains the sole responsibility of the end user. Clemtout Launcher is not affiliated with, authorized by, or endorsed by Valve Corporation, Steam, Epic Games, or Exit Games.
