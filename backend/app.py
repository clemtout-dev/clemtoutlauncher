# Made by the ClemtoutLauncher Team.
# You are allowed to use, modify, and redistribute this software for non-commercial purposes only.
# Sources:
# - Unpacker/Steamless: https://github.com/atom0s/Steamless
# - Steam File Generation (depotkeys.json and appaccesstokens.json): https://gitlab.com/steamautocracks/manifesthub

import sys
import os
import re
import json
import uuid
import subprocess
import time
from pathlib import Path
from datetime import datetime
from flask import Flask, jsonify, send_file, request, abort, send_from_directory, Response
from flask_cors import CORS
import requests
import vdf
import urllib3
import traceback
import win32file

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_frontend_dir():
    path_exe = BASE_DIR / 'frontend'
    if path_exe.exists():
        return path_exe

    path_dev = BASE_DIR.parent / 'frontend'
    if path_dev.exists():
        return path_dev

    return None

app = Flask(__name__)
CORS(app)

DEV_MODE = False


if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent
USER_DIR = Path(os.getenv('APPDATA') or os.path.expanduser("~")) / 'clemtoutlauncher'
BANNERS_DIR = USER_DIR / 'banners'
GAMES_FILE = USER_DIR / 'games.json'
SETTINGS_FILE = USER_DIR / 'settings.json'
STEAMCMD_PATH = BASE_DIR / "steamcmd" / "steamcmd.exe"
DEPOT_KEYS_FILE_PATH = BASE_DIR / "depotkeys.json"
TOKENS_FILE_PATH = BASE_DIR / "appaccesstokens.json"
GAME_LOADER_EXE = BASE_DIR / "game_loader.exe"
UNPACKER_EXE = BASE_DIR / "Unpacker" / "ClemtoutLauncher.CLI.exe"

import winreg

def get_steam_install_path():
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
            path, _ = winreg.QueryValueEx(key, "SteamPath")
            return os.path.normpath(path)
    except Exception:
        pass
    return r"C:\Program Files (x86)\Steam"

STEAM_PATH = os.environ.get("STEAM_PATH") or get_steam_install_path()
LOGINUSERS_PATH = Path(STEAM_PATH) / "config" / "loginusers.vdf"
AVATAR_DIR = Path(STEAM_PATH) / "config" / "avatarcache"

STEAM_BASE_ID = 76561197960265728

def convert_steam32_to_64(steam32: str) -> str:
    """Converts a SteamID32 (AccountID) to SteamID64."""
    try:
        return str(int(steam32) + STEAM_BASE_ID)
    except (ValueError, TypeError):
        return ""

def convert_steamid64_to_32(steamid64: str) -> str:
    """Converts a SteamID64 back to SteamID32 (AccountID)."""
    try:
        return str(int(steamid64) - STEAM_BASE_ID)
    except (ValueError, TypeError):
        return ""

def parse_steam_friends(steamid64: str) -> list[dict]:
    """
    Reads the Steam friends list from localconfig.vdf or sharedconfig.vdf.
    Returns a list of dicts {steamid64, name, avatar}.
    The IDs in these files are SteamID32 (AccountID).
    """
    if not steamid64:
        return []

    # Convert the selected SteamID64 to SteamID32 to find the correct userdata folder
    try:
        steam32 = str(int(steamid64) - STEAM_BASE_ID)
    except (ValueError, TypeError):
        return []

    friends = []
    seen = set()

    # Paths to test (localconfig first, fallback sharedconfig)
    vdf_paths = [
        Path(STEAM_PATH) / "userdata" / steam32 / "config" / "localconfig.vdf",
        Path(STEAM_PATH) / "userdata" / steam32 / "7" / "remote" / "sharedconfig.vdf",
    ]

    for vdf_path in vdf_paths:
        if not vdf_path.exists():
            continue
        try:
            with open(vdf_path, "r", encoding="utf-8", errors="ignore") as f:
                data = vdf.load(f)

            # Search for the "friends" section (case-insensitive)
            def find_section(d, key):
                if not isinstance(d, dict):
                    return None
                for k, v in d.items():
                    if k.lower() == key.lower():
                        return v
                return None

            # localconfig.vdf : UserLocalConfigStore > friends
            root = find_section(data, "UserLocalConfigStore") or data
            friends_section = find_section(root, "friends")

            if not friends_section or not isinstance(friends_section, dict):
                continue

            for key, val in friends_section.items():
                if not key.isdigit():
                    continue
                if key in seen:
                    continue
                seen.add(key)

                sid64 = convert_steam32_to_64(key)
                if not sid64:
                    continue

                name = ""
                avatar = ""
                if isinstance(val, dict):
                    name   = val.get("name") or val.get("PersonaName") or ""
                    avatar = val.get("avatar") or ""

                friends.append({
                    "steamid64": sid64,
                    "name": name,
                    "avatar": avatar,
                })

            if friends:
                break  # Found in this file, no need to continue

        except Exception as e:
            print(f"[FRIENDS] Error reading {vdf_path}: {e}")

    print(f"[FRIENDS] {len(friends)} friends found for SteamID64={steamid64}")
    return friends

USER_DIR.mkdir(parents=True, exist_ok=True)
BANNERS_DIR.mkdir(parents=True, exist_ok=True)

if not GAMES_FILE.exists():
    with open(GAMES_FILE, 'w', encoding='utf-8') as f:
        json.dump({"games": []}, f)

if not SETTINGS_FILE.exists():
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            "language": "fr",
            "selected_steam_account": None,
            "theme": "dark"
        }, f)


def get_insensitive(data, *keys):
    current = data
    for k in keys:
        if not isinstance(current, dict):
            return {}

        found = False
        k_lower = str(k).lower()
        for real_key in current.keys():
            if str(real_key).lower() == k_lower:
                current = current[real_key]
                found = True
                break

        if not found:
            return {}

    return current


def load_games():
    try:
        with open(GAMES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for game in data.get("games", []):
            if "last_played" not in game:
                game["last_played"] = 0
        data["games"].sort(key=lambda g: g.get("last_played", 0), reverse=True)
        return data
    except Exception as e:
        print("[ERROR] load_games:", e)
        return {"games": []}

def save_games(data):
    try:
        with open(GAMES_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur sauvegarde: {e}")
        return False

def load_settings():
    defaults = {
        "language": "fr",
        "selected_steam_account": None,
        "theme": "dark",
        "steam_path": str(STEAM_PATH),
        "cached_playtime_accounts": []
    }

    if not SETTINGS_FILE.exists():
        save_settings(defaults)
        return defaults

    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        save_settings(defaults)
        return defaults

    for key, value in defaults.items():
        if key not in data:
            data[key] = value

    return data

def save_settings(data):
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    except:
        return False

def parse_loginusers(path):
    accounts = []
    if not Path(path).exists():
        return accounts

    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            txt = f.read()

        for m in re.finditer(r'"(\d{17,20})"\s*\{([^}]*)\}', txt, re.DOTALL):
            sid = m.group(1)
            block = m.group(2)

            persona_match = re.search(r'"PersonaName"\s*"([^"]*)"', block)
            acc_match = re.search(r'"AccountName"\s*"([^"]*)"', block)
            recent_match = re.search(r'"MostRecent"\s*"([^"]*)"', block)

            persona = persona_match.group(1) if persona_match else None
            acc = acc_match.group(1) if acc_match else None
            recent = recent_match.group(1) if recent_match else "0"

            accounts.append({
                "steamid": sid,
                "personaname": persona or acc or sid,
                "accountname": acc,
                "most_recent": recent == "1"
            })
    except Exception as e:
        print(f"Error reading loginusers: {e}")

    return accounts

def find_avatar_path(steamid):
    if not AVATAR_DIR.is_dir():
        return None

    for fname in os.listdir(AVATAR_DIR):
        if steamid in fname and fname.lower().endswith(".png"):
            return AVATAR_DIR / fname
    return None

def download_steam_banner(appid):
    filename = f"{appid}_banner.jpg"
    filepath = BANNERS_DIR / filename

    if filepath.exists():
        return filename

    urls = [
        f"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header.jpg",
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg",
    ]

    for url in urls:
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            with open(filepath, 'wb') as f:
                f.write(r.content)
            return filename
        except:
            continue

    return None


def get_steam_game_details(appid, lang="french"):
    url = f"https://store.steampowered.com/api/appdetails?appids={appid}&l={lang}"

    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        details = data.get(str(appid), {}).get("data", {})

        return {
            "description": details.get("about_the_game") or details.get("short_description"),
            "requirements": details.get("pc_requirements", {}).get("minimum"),
            "name": details.get("name"),
            "header_image": details.get("header_image")
        }
    except Exception as e:
        print(f"Steam API Error: {e}")
        return None


def process_appid(appid: str, base_dir: str):
    output_dir = os.path.join(base_dir, str(appid))
    os.makedirs(output_dir, exist_ok=True)

    json_file_path = os.path.join(output_dir, f"{appid}.json")
    if os.path.exists(json_file_path):
        return output_dir, f"AppID {appid} already processed"

    if not os.path.exists(STEAMCMD_PATH):
        raise FileNotFoundError(f"SteamCMD not found: {STEAMCMD_PATH}")
    try:
        process = subprocess.Popen(
            [STEAMCMD_PATH, "+login", "anonymous", f"+app_info_print {appid}", "+quit"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.path.dirname(STEAMCMD_PATH),
            creationflags=0x08000000
        )
        out, err = process.communicate(timeout=30)

        try:
            raw_info = out.decode("utf-8", errors="replace")
        except UnicodeDecodeError:
            raw_info = out.decode("cp1252", errors="replace")

    except FileNotFoundError:
        return None, f"Error: SteamCMD.exe not found at {STEAMCMD_PATH}"
    except subprocess.TimeoutExpired:
        return None, f"Error: SteamCMD request for AppID {appid} expired."
    debug_file = os.path.join(output_dir, f"{appid}_steamcmd_raw.txt")
    try:
        with open(debug_file, "w", encoding="utf-8", errors="ignore") as f:
            f.write(raw_info)
    except Exception:
        pass

    if process.returncode != 0:
        if "app info not found" in raw_info.lower():
            return None, f"AppID {appid} not found or not public. Ignored."
        else:
            return None, f"SteamCMD error for {appid}: {err.decode(errors='ignore')}"

    if not raw_info.strip():
        return None, f"SteamCMD returned an empty output for AppID {appid}."

    match = re.search(rf'("{appid}"\s*\{{.*?\n\}})', raw_info, re.DOTALL)
    if not match:
        return None, f"Could not find VDF block for AppID {appid}. See {debug_file}."

    vdf_text = match.group(1)

    try:
        data = vdf.loads(vdf_text)
    except Exception as e:
        return None, f"VDF error for AppID {appid}: {e}. See {debug_file}"

    appdata = data.get(appid, {})

    depots = appdata.get("depots", {})
    try:
        game_name = appdata["common"]["name"]
    except (KeyError, TypeError):
        game_name = f"AppID {appid}"

    try:
        with open(DEPOT_KEYS_FILE_PATH, 'r', encoding='utf-8') as f:
            depot_keys = {str(k): v for k, v in json.load(f).items()}
        with open(TOKENS_FILE_PATH, 'r', encoding='utf-8') as f:
            tokens = {str(k): v for k, v in json.load(f).items()}
    except FileNotFoundError as e:
        raise FileNotFoundError(f"Required file not found: {e}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Error reading JSON file: {e}")

    lua_lines = [f"addappid({appid})"]
    if "access_token" in appdata:
        lua_lines.append(f'addtoken({appid},"{appdata["access_token"]}")')

    json_data = {
        "appid": int(appid),
        "name": game_name,
        "type": appdata.get("common", {}).get("type"),
        "update_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "depot": {}
    }
    depot_vdf_data = {}

    if "isfreeapp" in appdata: json_data["isfreeapp"] = appdata.get("isfreeapp")
    if "change_number" in appdata: json_data["change_number"] = appdata.get("change_number")
    if "schinese_name" in appdata.get("common", {}):
        json_data["schinese_name"] = appdata.get("common", {}).get("schinese_name")

    for depot_id, depot_info in depots.items():
        if not depot_id.isdigit():
            continue

        json_data["depot"][depot_id] = depot_info

        key = depot_keys.get(depot_id)
        manifest_gid = depot_info.get("manifests", {}).get("public", {}).get("gid")

        if key and manifest_gid:
            lua_lines.append(f'addappid({depot_id},0,"{key}")')
            lua_lines.append(f'setManifestid({depot_id},"{manifest_gid}")')
        elif key:
            lua_lines.append(f'addappid({depot_id},0,"{key}")')
        elif manifest_gid:
            lua_lines.append(f'addappid({depot_id})')
            lua_lines.append(f'setManifestid({depot_id},"{manifest_gid}")')
        else:
            lua_lines.append(f'addappid({depot_id})')

        if key:
            json_data["depot"][depot_id]["decryptionkey"] = key
            depot_vdf_data[depot_id] = {"DecryptionKey": key}

        depot_token = tokens.get(depot_id)
        if depot_token:
            lua_lines.append(f'addtoken({depot_id},"{depot_token}")')

    if depot_vdf_data:
        vdf_content = ["\"depots\"", "{"]
        for depot_id, depot_info in depot_vdf_data.items():
            key = depot_info.get("DecryptionKey")
            vdf_content.append(f"    \"{depot_id}\"")
            vdf_content.append("    {")
            vdf_content.append(f"        \"DecryptionKey\" \"{key}\"")
            vdf_content.append("    }")
        vdf_content.append("}")
        vdf_final = "\n".join(vdf_content)

        with open(os.path.join(output_dir, f"{appid}.vdf"), "w", encoding="utf-8", newline="\n") as f:
            f.write(vdf_final)
    else:
        return None, f"AppID {appid} has no depots with keys. Ignored."

    with open(os.path.join(output_dir, f"{appid}.lua"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lua_lines))

    with open(os.path.join(output_dir, f"{appid}.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(json_data, f, indent=4, ensure_ascii=False)

    return output_dir, game_name

def get_playtime_for_account(steam_path: str, steamid64: str, appid: str) -> int:
    steamid32 = convert_steamid64_to_32(steamid64)

    localconfig = (
            Path(steam_path)
            / "userdata"
            / steamid32
            / "config"
            / "localconfig.vdf"
    )

    if not localconfig.exists():
        return 0

    try:
        with open(localconfig, "r", encoding="utf-8", errors="ignore") as f:
            data = vdf.load(f)

        apps = get_insensitive(
            data,
            "UserLocalConfigStore",
            "Software",
            "Valve",
            "Steam",
            "apps",
        )

        node = apps.get(str(appid))
        if not node:
            return 0

        playtime_minutes = get_insensitive(node, "Playtime")
        if not playtime_minutes or not isinstance(playtime_minutes, (str, int, float)) or str(playtime_minutes).strip() == "":
            playtime_minutes = get_insensitive(node, "PlaytimeTotal")
            
        if isinstance(playtime_minutes, (str, int, float)) and str(playtime_minutes).isdigit():
            return int(playtime_minutes) * 60  # convert minutes → seconds
            
        return 0

    except ValueError:
        return steamid64

active_sessions = {}

def get_local_steam_playtime(appid):
    settings = load_settings()
    steam_path = settings.get("steam_path", str(STEAM_PATH))
    steamid64 = settings.get("selected_steam_account")

    if not steamid64:
        return 0

    return get_playtime_for_account(steam_path, steamid64, appid)


@app.route('/')
def index():
    frontend_dir = get_frontend_dir()
    if frontend_dir:
        index_path = frontend_dir / 'index.html'
        if index_path.exists():
            return send_file(index_path)

    return f"Error : No index.html found. Checked in {BASE_DIR} and {BASE_DIR.parent}", 404

@app.route('/<path:path>')
def static_files(path):
    frontend_dir = get_frontend_dir()
    if frontend_dir:
        return send_from_directory(frontend_dir, path)
    return "Not Found", 404


@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings_fixed():
    if request.method == 'POST':
        settings = load_settings()
        new_settings = request.get_json()

        if 'steam_path' in new_settings:
            global STEAM_PATH, LOGINUSERS_PATH, AVATAR_DIR
            val = new_settings['steam_path'].strip()
            if not val:
                val = get_steam_install_path()
                new_settings['steam_path'] = val
            
            STEAM_PATH = Path(val)
            LOGINUSERS_PATH = STEAM_PATH / "config" / "loginusers.vdf"
            AVATAR_DIR = STEAM_PATH / "config" / "avatarcache"

        settings.update(new_settings)
        if save_settings(settings):
            return jsonify(settings)
        return jsonify({"error": "Failed to save"}), 500

    current = load_settings()
    if 'steam_path' not in current:
        current['steam_path'] = str(STEAM_PATH)
    return jsonify(current)

@app.route('/api/steam/accounts')
def api_accounts():
    accounts = parse_loginusers(LOGINUSERS_PATH)
    settings = load_settings()
    selected = settings.get('selected_steam_account')

    if not selected and accounts:
        selected = accounts[0]['steamid']
        settings['selected_steam_account'] = selected
        save_settings(settings)

    for acc in accounts:
        acc['selected'] = (acc['steamid'] == selected)

    return jsonify({"accounts": accounts})

@app.route('/api/steam/avatar/<steamid>')
def api_avatar(steamid):
    path = find_avatar_path(steamid)
    if not path:
        abort(404)
    return send_file(path, mimetype="image/png")



@app.post("/api/steam/update-playtime-for-selected")
def api_update_playtime_selected():
    settings = load_settings()
    selected_id = settings.get("selected_steam_account")

    if not selected_id:
        return jsonify({"error": "No Steam account selected"}), 400

    if selected_id in settings.get("cached_playtime_accounts", []):
        return jsonify({"success": True, "cached": True})

    steam_path = settings.get("steam_path", str(STEAM_PATH))
    data = load_games()

    updated = 0

    for game in data["games"]:
        appid = game.get("steam_appid")
        if not appid:
            continue

        try:
            seconds = get_playtime_for_account(steam_path, selected_id, str(appid))
        except:
            seconds = 0

        if "playtime" not in game or not isinstance(game["playtime"], dict):
            game["playtime"] = {}

        game["playtime"][selected_id] = seconds
        updated += 1

    save_games(data)

    settings["cached_playtime_accounts"].append(selected_id)
    save_settings(settings)

    return jsonify({"success": True, "updated": updated, "cached": False})

@app.route('/api/steam/select', methods=['POST'])
def api_select_steam_account():
    steamid = request.get_json().get('steamid')
    settings = load_settings()
    settings['selected_steam_account'] = steamid
    save_settings(settings)
    import threading

    threading.Thread(
        target=lambda: requests.post(
            "http://127.0.0.1:8000/api/steam/update-playtime-for-selected",
            timeout=5
        ),
        daemon=True
    ).start()

    return jsonify({"success": True})


@app.route('/api/steam/search')
def api_steam_search():
    """Proxy for Steam search (bypasses CORS)"""
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return jsonify([])
    try:
        r = requests.get(
            f"https://steamcommunity.com/actions/SearchApps/{requests.utils.quote(q)}",
            timeout=8,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        r.raise_for_status()
        return jsonify(r.json())
    except Exception as e:
        print(f"[Steam Search Proxy] Error: {e}")
        return jsonify([]), 200

@app.route('/api/games')
def api_games():
    return jsonify(load_games())

@app.route('/api/games', methods=['POST'])
def api_add_game():
    game_data = request.get_json()

    if not game_data.get('name'):
        return jsonify({"error": "Name required"}), 400

    game_data['id'] = str(uuid.uuid4())
    game_data.setdefault('playtime', 0)
    game_data.setdefault('path', '')
    game_data.setdefault('arguments', '')

    data = load_games()
    data['games'].append(game_data)

    if save_games(data):
        return jsonify(game_data), 201
    return jsonify({"error": "Failed to save"}), 500

@app.route('/api/games/<game_id>', methods=['PUT'])
def api_update_game(game_id):
    game_data = request.get_json()
    data = load_games()

    for i, g in enumerate(data['games']):
        if g['id'] == game_id:
            game_data['id'] = game_id
            game_data['playtime'] = g.get('playtime', 0)
            data['games'][i] = game_data
            if save_games(data):
                return jsonify(game_data)
            return jsonify({"error": "Failed to save"}), 500

    return jsonify({"error": "Game not found"}), 404

@app.route('/api/games/<game_id>', methods=['DELETE'])
def api_delete_game(game_id):
    data = load_games()
    settings = load_settings()
    settings["cached_playtime_accounts"] = []
    save_settings(settings)
    data['games'] = [g for g in data['games'] if g['id'] != game_id]

    if save_games(data):
        return jsonify({"success": True})
    return jsonify({"error": "Failed to save"}), 500

@app.route('/api/games/bulk-delete', methods=['POST'])
def api_bulk_delete():
    ids = request.get_json().get('ids', [])
    data = load_games()
    data['games'] = [g for g in data['games'] if g['id'] not in ids]

    if save_games(data):
        return jsonify({"success": True, "deleted": len(ids)})
    return jsonify({"error": "Failed to save"}), 500

@app.route('/api/games/<game_id>/details')
def api_game_details(game_id):
    data = load_games()
    game = next((g for g in data['games'] if g['id'] == game_id), None)

    if not game:
        return jsonify({"error": "Game not found"}), 404

    appid = game.get('steam_appid')
    if not appid:
        return jsonify({"error": "No Steam AppID"}), 400

    lang = request.args.get("lang", "french")

    details = get_steam_game_details(appid, lang=lang)

    if details:
        return jsonify(details)

    return jsonify({"error": "Failed to fetch details"}), 500


def detect_game_path(game_path):
    path_obj = Path(game_path)
    if not path_obj.exists():
        return game_path
        
    root_dir = path_obj.parent
    exe_stem = path_obj.stem.lower()
    unity_indicators = ["UnityPlayer.dll", "UnityCrashHandler64.exe"]
    for indicator in unity_indicators:
        if (root_dir / indicator).exists():
            print(f"[DEBUG] Unity detected via {indicator}. Keeping original path.")
            return game_path
    try:
        
        potential_dirs = [d for d in root_dir.iterdir() if d.is_dir()]
        
        def get_score(name, target):
            n, t = name.lower(), target.lower()
            if n == t: return 100
            if n in t or t in n: return 50
            score = 0
            for i in range(min(len(n), len(t))):
                if n[i] == t[i]: score += 1
                else: break
            return score

        potential_dirs.sort(key=lambda d: get_score(d.name, exe_stem), reverse=True)
        
        search_roots = [root_dir] + potential_dirs
        
        for base in search_roots:
            shipping_dir = base / "Binaries" / "Win64"
            if shipping_dir.exists():
                shipping_exes = list(shipping_dir.glob("*Shipping.exe"))
                if not shipping_exes:
                    shipping_exes = [f for f in shipping_dir.glob("*.exe") if "crash" not in f.name.lower()]
                
                if shipping_exes:
                    shipping_exes.sort(key=lambda x: x.stat().st_size, reverse=True)
                    new_path = str(shipping_exes[0])
                    print(f"[DEBUG] Unreal Shipping EXE detected in {base.name}: {new_path}")
                    return new_path

        print(f"[DEBUG] Unreal Shipping not found in standard paths, wide search in {root_dir}")
        for root, dirs, files in os.walk(root_dir):
            depth = Path(root).relative_to(root_dir).parts
            if len(depth) > 3:
                del dirs[:]
                continue
                
            if "Binaries" in dirs and "Win64" in os.listdir(Path(root) / "Binaries"):
                win64_path = Path(root) / "Binaries" / "Win64"
                exes = [f for f in win64_path.glob("*.exe") if "shipping" in f.name.lower()]
                if exes:
                    exes.sort(key=lambda x: x.stat().st_size, reverse=True)
                    return str(exes[0])

    except Exception as e:
        print(f"[ERROR] Engine detection failed: {e}")

    return game_path


@app.route('/api/games/<game_id>/launch', methods=['POST'])
def api_launch_game(game_id):
    data = request.get_json()
    mode = data.get('mode', 'crack_fix')

    games_data = load_games()
    game = next((g for g in games_data['games'] if g['id'] == game_id), None)

    if not game:
        return jsonify({"error": "Game not found"}), 404

    game_path = game.get('path')
    if not game_path or not Path(game_path).exists():
        return jsonify({"error": "Executable not found on disk"}), 400

    try:
        if mode == 'direct':
            subprocess.Popen([game_path], cwd=str(Path(game_path).parent), creationflags=0x08000000)
            game["last_played"] = int(time.time())
            save_games(games_data)
            return jsonify({"success": True, "message": "Lancé en mode direct"})

        if not GAME_LOADER_EXE.exists():
            return jsonify({"error": "game_loader.exe introuvable dans le dossier resources"}), 400

        env = os.environ.copy()
        target_appid = str(game.get("steam_appid", "480"))
        env.update({
            "SteamAppId": target_appid,
            "SteamEnv": "1"
        })

        original_path = Path(game_path)
        backup_path = original_path.with_suffix(".pack")

        if UNPACKER_EXE.exists() and not backup_path.exists():
            try:
                print(f"[*] Tentative de Unpack (Steamless) pour {game_path}")
                cmd = [str(UNPACKER_EXE), "--quiet", str(original_path)]
                subprocess.run(cmd, capture_output=True, text=True, creationflags=0x08000000)

                unpacked_found = original_path.with_name(original_path.stem + ".unpacked.exe")
                if unpacked_found.exists():
                    os.rename(str(original_path), str(backup_path))
                    os.replace(str(unpacked_found), str(original_path))
                    print("[*] Unpack réussi.")
            except Exception as unpack_e:
                print(f"[!] Erreur Unpack: {unpack_e}")

        subprocess.Popen(
            [str(GAME_LOADER_EXE), str(original_path)],
            cwd=str(original_path.parent),
            env=env,
            creationflags=0x08000000
        )

        game["last_played"] = int(time.time())
        save_games(games_data)

        return jsonify({"success": True, "message": "Jeu lancé avec le Crack Fix (Spacewar)"})

    except Exception as e:
        print(f"[LAUNCH ERROR] {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/games/<game_id>/playtime', methods=['POST'])
def api_update_playtime(game_id):
    seconds = request.get_json().get('seconds', 0)
    data = load_games()
    for g in data['games']:
        if g['id'] == game_id:
            g['playtime'] = g.get('playtime', 0) + seconds
            break
    save_games(data)
    return jsonify({"success": True})


def scan_all_drives():
    steam_paths = []
    drives = []

    import string
    available_drives = ['%s:' % d for d in string.ascii_uppercase if os.path.exists('%s:' % d)]

    common_folders = [
        r"Program Files (x86)\Steam",
        r"Program Files\Steam",
        r"Steam",
        r"SteamLibrary",
        r"Games\Steam",
        r"Jeux\Steam"
    ]

    print(f"[DEBUG] Disks detected : {available_drives}")

    for drive in available_drives:
        for folder in common_folders:
            full_path = Path(drive) / folder
            if (full_path / "steamapps").exists():
                steam_paths.append(full_path)
                print(f"[INFO] Library found (Scan) : {full_path}")

    return steam_paths


@app.post("/api/steam/update-playtime")
def api_update_steam_playtime():
    data = load_games()
    settings = load_settings()
    steam_path = settings.get('steam_path', str(STEAM_PATH))

    for game in data.get("games", []):
        appid = game.get("steam_appid")
        if appid:
            try:
                game["playtime"] = get_steam_playtime_from_config(steam_path, str(appid))
            except Exception as e:
                print(f"[WARN] Unable to recover playtime for {appid}: {e}")

    save_games(data)
    return jsonify({"success": True, "updated": len([g for g in data.get("games", []) if g.get("steam_appid")])})

@app.route('/api/import/steam', methods=['POST'])
def api_import_steam_fixed():
    settings = load_settings()
    settings["cached_playtime_accounts"] = []
    save_settings(settings)
    data = load_games()
    existing_appids = {g.get('steam_appid') for g in data['games'] if g.get('steam_appid')}
    imported_count = 0

    settings = load_settings()
    main_path = Path(settings.get('steam_path', str(STEAM_PATH)))

    libraries = []

    if main_path.exists():
        libraries.append(main_path)

    found_paths = scan_all_drives()
    for p in found_paths:
        if p not in libraries:
            libraries.append(p)

    for lib_path in libraries:
        steamapps_path = lib_path / "steamapps"
        if not steamapps_path.exists(): continue
        try:
            files = os.listdir(steamapps_path)
        except Exception as e:
            continue

        for fname in files:
            if fname.startswith("appmanifest_") and fname.endswith(".acf"):

                playtime = 0

                try:
                    with open(steamapps_path / fname, 'r', encoding='utf-8', errors='ignore') as f:
                        txt = f.read()

                    name_m = re.search(r'"name"\s+"([^"]+)"', txt, re.IGNORECASE)
                    id_m = re.search(r'"appid"\s+"(\d+)"', txt, re.IGNORECASE)
                    install_m = re.search(r'"installdir"\s+"([^"]+)"', txt, re.IGNORECASE)

                    if not name_m or not id_m: continue

                    name = name_m.group(1)
                    appid = id_m.group(1)

                    if appid in existing_appids: continue

                    install_dir_name = install_m.group(1) if install_m else ""
                    full_install_path = steamapps_path / "common" / install_dir_name
                    exe_path = find_game_executable(full_install_path, name)

                    playtime = get_local_steam_playtime(appid)

                    data['games'].append({
                        "id": str(uuid.uuid4()),
                        "name": name,
                        "path": exe_path,
                        "arguments": "",
                        "steam_appid": appid,
                        "banner": download_steam_banner(appid),
                        "playtime": playtime
                    })

                    existing_appids.add(appid)
                    imported_count += 1
                    print(f"[SUCCES] Jeu ajouté : {name} (Playtime: {playtime} min)")

                except Exception as e:
                    print(f"[ERREUR] {fname}: {e}")

    if imported_count > 0:
        save_games(data)

    return jsonify({"success": True, "imported": imported_count})


@app.route('/api/generate', methods=['POST'])
def api_generate():
    req_data = request.get_json()
    if not req_data:
        return jsonify({"error": "Aucune donnée reçue"}), 400

    appid = req_data.get('appid')

    if not appid:
        return jsonify({"error": "AppID required"}), 400

    try:
        output_dir, game_name = process_appid(appid, USER_DIR)
        if not output_dir:
            return jsonify({"error": game_name}), 500

        import webbrowser, pathlib
        try:
            webbrowser.open(pathlib.Path(output_dir).resolve().as_uri())
        except Exception as e:
            print(f"Impossible to open folder: {e}")

        return jsonify({
            "success": True,
            "game": {"name": game_name},
            "output_dir": output_dir,
            "message": f"Files generated for {game_name}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def find_game_executable(install_dir, game_name):
    install_dir = Path(install_dir)
    if not install_dir.exists():
        return ""

    root_exes = list(install_dir.glob("*.exe"))

    blacklist = [
        "unitycrashhandler", "crashreport", "setup", "install",
        "uninstall", "vcredist", "python", "steamcmd", "clemtoutlauncher",
        "game_loader", "helper", "overlay", "config", "touch"
    ]

    candidates = [exe for exe in root_exes if not any(bad in exe.name.lower() for bad in blacklist)]

    def clean_return(path_obj):
        return str(os.path.abspath(path_obj)).replace('\\', '/')

    if candidates:
        sanitized_name = re.sub(r'[^\w]', '', game_name).lower()

        for c in candidates:
            if sanitized_name in c.name.lower():
                return clean_return(c)

        chosen = max(candidates, key=lambda x: x.stat().st_size)
        return clean_return(chosen)

    all_exes = list(install_dir.rglob("*.exe"))
    deep_candidates = [e for e in all_exes if not any(bad in e.name.lower() for bad in blacklist)]

    if deep_candidates:
        shipping = [d for d in deep_candidates if "shipping" in d.name.lower()]
        if shipping:
            return clean_return(max(shipping, key=lambda x: x.stat().st_size))
        return clean_return(max(deep_candidates, key=lambda x: x.stat().st_size))

    return ""

@app.route('/api/banners/<filename>')
def api_banner(filename):
    return send_from_directory(BANNERS_DIR, filename)

@app.route('/api/status')
def api_status():
    return jsonify({"dev_mode": DEV_MODE})

@app.route('/api/photon/status')
def api_photon_status():
    hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
    required_entries = [
        "ns.exitgames.io",
        "ns.exitgames.com",
        "ns.photonengine.io",
        "ns.photonengine.com"
    ]
    
    try:
        if not os.path.exists(hosts_path):
            return jsonify({"status": "not_configured"})
        
        with open(hosts_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read().lower()
            
        all_present = True
        for entry in required_entries:
            if entry.lower() not in content:
                all_present = False
                break
        
        return jsonify({"status": "configured" if all_present else "not_configured"})
    except Exception as e:
        print(f"[PHOTON STATUS ERROR] {e}")
        return jsonify({"status": "unknown", "error": str(e)})

@app.route('/api/photon/edit', methods=['POST'])
def api_photon_edit():
    try:
        hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
        ps_command = f'Start-Process notepad.exe -ArgumentList "{hosts_path}" -Verb RunAs'
        
        subprocess.Popen(['powershell', '-Command', ps_command], shell=True, creationflags=0x08000000)
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"[PHOTON EDIT ERROR] {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/photon/delete', methods=['POST'])
def api_photon_delete():
    try:
        hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
        required_entries = [
            "ns.exitgames.io",
            "ns.exitgames.com",
            "ns.photonengine.io",
            "ns.photonengine.com"
        ]
        
        ps_script = f"""
$hosts_path = "{hosts_path}"
$content = Get-Content $hosts_path
$new_content = $content | Where-Object {{ $_ -notmatch "ns\\.exitgames\\.(io|com)" -and $_ -notmatch "ns\\.photonengine\\.(io|com)" }}
Set-Content $hosts_path $new_content -Force
"""
        import tempfile
        script_path = os.path.join(tempfile.gettempdir(), "photon_delete.ps1")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(ps_script)
            
        elevated_ps = f"Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"{script_path}\"' -Verb RunAs"
        subprocess.Popen(['powershell', '-Command', elevated_ps], shell=True, creationflags=0x08000000)
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"[PHOTON DELETE ERROR] {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8000)
