# Made by the ClemtoutLauncher Team.
# You are allowed to use, modify, and redistribute this software for non-commercial purposes only.
# Sources:
# - Unpacker/Steamless: https://github.com/atom0s/Steamless
# - Steam File Generation (depot_keys.json and tokens.json): https://gitlab.com/steamautocracks/manifesthub

import sys
import os
import threading
import time
import webview

current_file_path = os.path.abspath(__file__)
project_root = os.path.dirname(current_file_path)
sys.path.append(project_root)

try:
    from backend.app import app
except ImportError:
    from app import app

def start_backend():
    from werkzeug.serving import run_simple
    # Disable reloader to avoid issues with webview
    run_simple('127.0.0.1', 8000, app, use_reloader=False, threaded=True)

def ensure_steam_running():
    import psutil, subprocess, winreg, os
    try:
        # Check if Steam is already running
        steam_running = any("steam.exe" in p.info['name'].lower() for p in psutil.process_iter(['name']))
        if not steam_running:
            # Try to start it from the registry path
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
                path, _ = winreg.QueryValueEx(key, "SteamPath")
                steam_exe = os.path.join(path, "steam.exe")
                if os.path.exists(steam_exe):
                    subprocess.Popen([steam_exe])
    except Exception:
        pass

def main():
    ensure_steam_running()

    # Start Flask backend in a separate thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()

    # Give the backend some time to start
    time.sleep(2)

    # Create the webview window
    webview.create_window(
        'Clemtout Launcher', 
        'http://127.0.0.1:8000', 
        width=1230, 
        height=800, 
        background_color='#171a21',
        text_select=True
    )
    webview.start()

if __name__ == '__main__':
    main()
