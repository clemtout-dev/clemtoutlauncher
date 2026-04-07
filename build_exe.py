import os
import subprocess
import shutil
import sys

def build():
    for folder in ['dist', 'build']:
        if os.path.exists(folder):
            shutil.rmtree(folder)
    sep = ';' if sys.platform == 'win32' else ':'

    data_to_add = [
        f"frontend{sep}frontend",
        f"backend/app.py{sep}backend",
        f"backend/game_loader.exe{sep}.",
        f"backend/steam_api64.dll{sep}.",
        f"backend/steamcmd{sep}steamcmd",
        f"backend/appaccesstokens.json{sep}.",
        f"backend/depotkeys.json{sep}.",
        f"backend/Unpacker{sep}Unpacker"
    ]

    cmd = [
        'pyinstaller',
        '--onefile',
        '--noconsole',
        '--name=Clemtoutlauncher',
        '--collect-all=flask',
        '--collect-all=webview',
        '--icon=frontend/favicon.ico'
    ]

    for item in data_to_add:
        cmd.append(f'--add-data="{item}"')

    cmd.append('launcher.py')

    result = subprocess.run(" ".join(cmd), shell=True)

    if result.returncode == 0:
        print("\nGG")
    else:
        print("\nError")

if __name__ == "__main__":
    build()