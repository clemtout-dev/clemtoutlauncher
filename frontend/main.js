// Made by the ClemtoutLauncher Team.
// You are allowed to use, modify, and redistribute this software for non-commercial purposes only.
// Sources:
// - Unpacker/Steamless: https://github.com/atom0s/Steamless
// - Steam File Generation (depot_keys.json and tokens.json): https://gitlab.com/steamautocracks/manifesthub

const API_BASE = '';

window.showCustomModal = function (title, message, isConfirm = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-alert');
        if (!modal) {
            if (isConfirm) resolve(confirm(message));
            else { alert(message); resolve(true); }
            return;
        }

        const titleEl = document.getElementById('modal-alert-title');
        const msgEl = document.getElementById('modal-alert-message');
        const okBtn = document.getElementById('modal-alert-ok');
        const cancelBtn = document.getElementById('modal-alert-cancel');

        titleEl.innerHTML = title.replace('⚠️', '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:bottom; margin-right:8px; color:#f39c12;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>')
            .replace('🎉', '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:bottom; margin-right:8px; color:#2ecc71;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>')
            .replace('🔍', '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:bottom; margin-right:8px; color:var(--text-primary);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>');
        if (msgEl) msgEl.innerHTML = message;

        if (isConfirm) {
            if (cancelBtn) cancelBtn.style.display = 'block';
            if (okBtn) okBtn.textContent = 'Confirmer';
            if (cancelBtn) cancelBtn.textContent = 'Annuler';
        } else {
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (okBtn) okBtn.textContent = 'OK';
        }

        modal.style.display = 'flex';
        modal.offsetHeight;
        modal.classList.add('show-anim');

        const closeMod = (val) => {
            modal.classList.remove('show-anim');
            setTimeout(() => {
                modal.style.display = 'none';
                resolve(val);
            }, 250);
        };

        if (okBtn) {
            okBtn.onclick = () => closeMod(true);
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => closeMod(false);
        }
    });
};

let games = [];
let selectedGames = new Set();
let currentGame = null;
let editingGame = null;
let currentLanguage = 'fr';
let selectedSteamID = null;

const i18n = {
    fr: {
        'nav.home': 'Accueil',
        'nav.library': 'Bibliothèque',
        'nav.generate': 'Générer Steam',
        'title.details': 'Détails du jeu',
        'nav.settings': 'Paramètres',
        'title.home': 'Bienvenue',
        'title.library': 'Bibliothèque',
        'title.generate': 'Générer un jeu Steam',
        'title.settings': 'Paramètres',
        'home.title': 'Bienvenue sur Clemtout Launcher',
        'home.stats': '📊 Statistiques',
        'home.games': 'Jeux',
        'home.playtime': 'Temps de jeu',
        'library.search': 'Rechercher un jeu...',
        'library.import': 'Importer Steam',
        'library.add': 'Ajouter',
        'library.delete': 'Supprimer',
        'library.deselect': 'Désélectionner',
        'library.empty': 'Aucun jeu trouvé',
        'library.empty_hint': 'Importe ta bibliothèque Steam ou ajoute des jeux manuellement',
        'generate.title': 'Générer un jeu Steam',
        'generate.appid': 'ID Steam (AppID)',
        'generate.search': 'Rechercher sur SteamDB',
        'generate.button': 'Générer',
        'generate.result': 'Résultat',
        'settings.title': 'Paramètres',
        'settings.language': '🌍 Langue',
        'settings.steam_account': '🎮 Compte Steam',
        'settings.paths': '📁 Chemins',
        'details.back': 'Retour',
        'details.launch_steam_fixed': 'Lancer avec Steam',
        'details.launch_steam_direct': 'Lancer sans Steam',
        'details.playtime': 'Temps total joué',
        'details.description': 'Description du jeu',
        'modal.add_game': 'Ajouter un jeu',
        'modal.edit_game': 'Modifier le jeu',
        'modal.name': 'Nom du jeu *',
        'modal.path': 'Chemin de l\'exécutable',
        'modal.args': 'Arguments (optionnel)',
        'modal.appid': 'Steam AppID',
        'modal.cancel': 'Annuler',
        'modal.save': 'Sauvegarder',
        'nav.legal_mentions': 'Mentions Légales',
        'modal.legal_title': 'Mentions Légales & Conditions d\'Utilisation',
        'modal.legal_body': 'Ce launcher est un utilitaire de configuration destiné aux détenteurs légitimes des jeux. Il permet l\'accès à des serveurs communautaires alternatifs. Ce logiciel ne cautionne pas le piratage. L\'utilisateur certifie posséder une licence valide pour chaque jeu lancé.',
        'nav.photon': 'Photon Patch',
        'photon.title': 'Configuration Photon Patch',
        'photon.subtitle': 'Accès aux Serveurs Multijoueurs',
        'photon.instructions1': 'Certains jeux requièrent une redirection DNS pour fonctionner avec les serveurs de la communauté.',
        'photon.status_configured': '✅ Configuré',
        'photon.status_not_configured': '❌ Configuration requise',
        'photon.status_unknown': 'Vérification...',
        'photon.btn_copy': 'Copier la configuration',
        'photon.btn_edit_admin': 'Modifier avec le Bloc-notes (Admin)',
        'details.launch_steam_spacewar': 'Jouer (Steam ID 480)',
        'details.launch_direct': 'Jouer (Sans Steam)',
        'modal.add': 'Ajouter Jeu',
        'modal.edit': 'Modifier Jeu',
        'title.photon': 'Photon Patch',
        'photon.explain_title': 'Gestion des Relais Réseau',
        'photon.explain_desc': 'Ce système redirige les serveurs Photon (Exit Games) vers des relais communautaires indépendants.',
        'photon.hint_patched': 'Patched: Serveurs Communautaires',
        'photon.hint_original': 'Originel: Serveurs Officiels',
        'photon.footer_text': 'Note: Redirection des services Exit Games (Photon) vers des relais communautaires.',
        'photon.btn_edit_admin': 'Modifier Hosts',
        'photon.btn_copy': 'Copier Valeurs',
        'photon.btn_delete_official': 'Rejouer en Officiel',
        'legal.responsibility': "Toute utilisation détournée de cet outil reste sous l'entière responsabilité de l'utilisateur final. Clemtout Launcher n'est pas affilié à Valve Corporation, Steam, ou Exit Games.",
        'photon.btn_delete': 'Supprimer la configuration (Rejouer en officiel)'
    },
    en: {
        'nav.home': 'Home',
        'nav.library': 'Library',
        'nav.generate': 'Generate Steam',
        'title.details': 'Game details',
        'nav.settings': 'Settings',
        'title.home': 'Welcome',
        'title.library': 'Library',
        'title.generate': 'Generate Steam Game',
        'title.settings': 'Settings',
        'home.title': 'Welcome to Clemtout Launcher',
        'home.stats': '📊 Statistics',
        'home.games': 'Games',
        'home.playtime': 'Playtime',
        'library.search': 'Search for a game...',
        'library.import': 'Import Steam',
        'library.add': 'Add',
        'library.delete': 'Delete',
        'library.deselect': 'Deselect',
        'library.empty': 'No games found',
        'library.empty_hint': 'Import your Steam library or add games manually',
        'generate.title': 'Generate Steam Game',
        'generate.appid': 'Steam ID (AppID)',
        'generate.search': 'Search on SteamDB',
        'generate.button': 'Generate',
        'generate.result': 'Result',
        'settings.title': 'Settings',
        'settings.language': '🌍 Language',
        'settings.steam_account': '🎮 Steam Account',
        'settings.paths': '📁 Paths',
        'details.back': 'Back',
        'details.playtime': 'Total playtime',
        'details.launch_steam_generic': 'Launch via Steam',
        'details.launch_spacewar': 'Launch via Steam (Spacewar)',
        'details.launch_direct': 'Launch without Steam',
        'details.description': 'Game Description',
        'modal.add_game': 'Add Game',
        'modal.edit_game': 'Edit Game',
        'modal.name': 'Game name *',
        'modal.path': 'Executable path',
        'modal.args': 'Arguments (optional)',
        'modal.appid': 'Steam AppID',
        'modal.cancel': 'Cancel',
        'modal.save': 'Save',
        'nav.legal_mentions': 'Legal Mentions',
        'modal.legal_title': 'Legal Mentions & Terms of Use',
        'modal.legal_body': 'This launcher is a configuration utility intended for legitimate game owners. It enables access to alternative community servers. This software does not endorse piracy. The user certifies possessing a valid license for each game launched.',
        'nav.photon': 'Photon Patch',
        'photon.title': 'Photon Patch Setup',
        'photon.subtitle': 'Multiplayer Server Access',
        'photon.instructions1': 'Some games require a DNS redirection to work with community servers.',
        'photon.status_configured': '✅ Configured',
        'photon.status_not_configured': '❌ Configuration Required',
        'photon.status_unknown': 'Checking...',
        'details.launch_steam_spacewar': 'Play (Steam ID 480)',
        'details.launch_direct': 'Play (No Steam)',
        'modal.add': 'Add Game',
        'modal.edit': 'Edit Game',
        'title.photon': 'Photon Patch',
        'photon.explain_title': 'Network Relay Management',
        'photon.explain_desc': 'This system redirects Photon (Exit Games) servers to independent community relays.',
        'photon.hint_patched': 'Patched: Community Servers',
        'photon.hint_original': 'Original: Official Servers',
        'photon.footer_text': 'Note: Redirection of Exit Games (Photon) services to community relays.',
        'photon.btn_edit_admin': 'Edit Hosts',
        'photon.btn_copy': 'Copy Values',
        'photon.btn_delete_official': 'Play on Official',
        'legal.responsibility': 'Any misuse of this tool remains the sole responsibility of the end user. Clemtout Launcher is not affiliated with Valve Corporation, Steam, or Exit Games.',
        'photon.btn_delete': 'Delete configuration (Play on official)'
    }
};

function translate(key) {
    return i18n[currentLanguage][key] || key;
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = translate(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = translate(el.getAttribute('data-i18n-placeholder'));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        initNavigation();
        initToolbar();
        initModal();
        loadSettings();
        loadUserInfo();
        loadGames();
        initSettings();
        initPhotonPage();
        initLegalLink();
    } catch (e) {
        console.error("Critical error during initialization:", e);
    }
});



function extractAppID(val) {
    if (!val) return '';
    const match = val.match(/\/app\/(\d+)/) || val.match(/steam:\/\/run\/(\d+)/);
    if (match) return match[1];
    return /^\d+$/.test(val) ? val : '';
}

function initSettings() {
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', async (e) => {
            currentLanguage = e.target.value;
            updateTranslations();

            try {
                await fetch(`${API_BASE}/api/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: currentLanguage })
                });
            } catch (err) {
                console.error('Erreur sauvegarde langue:', err);
            }
        });
    }
}




async function loadSettings() {
    try {
        const res = await fetch(`${API_BASE}/api/settings`);
        const settings = await res.json();
        selectedSteamID = settings.selected_steam_account || null;
        console.log("Settings chargés:", settings);

        if (document.getElementById('language-select')) {
            document.getElementById('language-select').value = settings.language || 'fr';
            currentLanguage = settings.language || 'fr';
        }

        const pathInput = document.getElementById('setting-steam-path');
        if (pathInput) {
            pathInput.value = settings.steam_path || 'C:\\Program Files (x86)\\Steam';
        }

        if (settings.license_key) {
            console.log("Restauration de la licence...");
            verifyLicense(settings.license_key);
        }
        if (settings.workink_token) {
            const tokInput = document.getElementById('gen-token');
            if (tokInput) tokInput.value = settings.workink_token;
        }

        const saveBtn = document.getElementById('save-steam-path-btn');
        if (saveBtn) {
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);

            newBtn.addEventListener('click', async () => {
                const newPath = document.getElementById('setting-steam-path').value.trim();

                try {
                    const r = await fetch(`${API_BASE}/api/settings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ steam_path: newPath })
                    });

                    if (r.ok) {
                        const d = await r.json();
                        alert(`Chemin sauvegardé : ${d.steam_path}`);
                        loadSteamAccounts();
                    } else {
                        alert("Erreur serveur lors de la sauvegarde");
                    }
                } catch (e) {
                    console.error(e);
                    alert('Erreur réseau');
                }
            });
        }

        const resetBtn = document.getElementById('reset-steam-path-btn');
        if (resetBtn) {
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);

            newResetBtn.addEventListener('click', async () => {
                try {
                    const r = await fetch(`${API_BASE}/api/settings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ steam_path: "" })
                    });
                    if (r.ok) {
                        const d = await r.json();
                        document.getElementById('setting-steam-path').value = d.steam_path;
                        alert(`Chemin Steam réinitialisé à la détection automatique :\n${d.steam_path}`);
                        loadSteamAccounts();
                    }
                } catch(e) {
                    console.error(e);
                }
            });
        }

        updateTranslations();
    } catch (err) {
        console.error('Erreur chargement settings:', err);
    }
}



function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const page = btn.dataset.page;
            showPage(page);
        });
    });
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageTarget = document.getElementById(`${page}-page`);
    if (pageTarget) pageTarget.classList.add('active');

    const titleKey = `title.${page}`;
    document.querySelector('.title').textContent = translate(titleKey);

    if (page === 'photon') {
        checkPhotonStatus();
    } else if (page === 'settings') {
        loadSteamAccounts();
    } else if (page === 'home') {
        updateHomeStats();
    } else if (page === 'legal') {
        document.querySelector('.title').textContent = translate('nav.legal_mentions');
    } else if (page === 'admin') {
        document.querySelector('.title').textContent = 'Admin';
    }
}


function updateHomeStats() {
    const totalGames = games.length;
    const totalPlaytime = games.reduce((sum, g) => sum + (g.playtime || 0), 0);
    const hours = Math.floor(totalPlaytime / 3600);
    let totalSeconds = 0;
    document.getElementById('stat-games').textContent = totalGames;
    document.getElementById('stat-playtime').textContent = `${hours}h`;
    for (const g of games) {
        if (!g.playtime) continue;

        if (typeof g.playtime === "object") {
            totalSeconds += g.playtime[selectedSteamID] || 0;
        } else {
            totalSeconds += g.playtime || 0;
        }
    }

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    document.getElementById('stat-games').textContent = totalGames;
    document.getElementById('stat-playtime').textContent = `${h}h${m.toString().padStart(2, '0')}`;
}
async function loadSteamAccounts() {
    try {
        const res = await fetch(`${API_BASE}/api/steam/accounts`);
        const data = await res.json();
        const container = document.getElementById('steam-accounts-list');

        if (data.accounts && data.accounts.length > 0) {
            container.innerHTML = data.accounts.map(acc => `
                <div class="account-item ${acc.selected ? 'selected' : ''}" data-steamid="${acc.steamid}">
                    <img src="${API_BASE}/api/steam/avatar/${acc.steamid}"
                         onerror="this.style.display='none'"
                         class="account-avatar">
                    <div class="account-info">
                        <div class="account-name">${acc.personaname}</div>
                        <div class="account-id">${acc.steamid}</div>
                    </div>
                    ${acc.selected ? '<span class="account-badge">Actif</span>' : ''}
                </div>
            `).join('');

            container.querySelectorAll('.account-item').forEach(item => {
                item.addEventListener('click', () => selectSteamAccount(item.dataset.steamid));
            });
        } else {
            container.innerHTML = '<p>Aucun compte Steam trouvé</p>';
        }
    } catch (err) {
        console.error('Erreur comptes Steam:', err);
    }
}

async function selectSteamAccount(steamid) {
    try {
        await fetch(`${API_BASE}/api/steam/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ steamid })
        });

        selectedSteamID = steamid;

        await loadSteamAccounts();
        await loadUserInfo();

        console.log("Mise à jour des temps de jeu pour le nouveau compte...");
        await fetch(`${API_BASE}/api/steam/update-playtime`, {
            method: "POST"
        });

        await loadGames();

    } catch (err) {
        console.error('Erreur sélection compte ou mise à jour playtime:', err);
    }
}

function initToolbar() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            renderGames(games.filter(g => g.name.toLowerCase().includes(query)));
        });
    }


    const genAppIdInput = document.getElementById('gen-appid');
    const autocompleteDiv = document.getElementById('steam-autocomplete-results');
    let searchDebounce = null;

    if (genAppIdInput && autocompleteDiv) {
        genAppIdInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            clearTimeout(searchDebounce);

            if (/^\d+$/.test(val) || val.length < 2) {
                autocompleteDiv.style.display = 'none';
                return;
            }

            searchDebounce = setTimeout(() => searchSteamGames(val), 350);
        });

        document.addEventListener('click', (e) => {
            if (!genAppIdInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
                autocompleteDiv.style.display = 'none';
            }
        });
    }

    const genTokenInput = document.getElementById('gen-token');
    if (genTokenInput) {
        genTokenInput.addEventListener('change', async (e) => {
            const token = e.target.value.trim();
            try {
                await fetch(`${API_BASE}/api/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workink_token: token })
                });
            } catch (e) { console.error(e); }
        });
    }


    const importBtn = document.getElementById('import-steam-btn');
    if (importBtn) {
        importBtn.addEventListener('click', importSteam);
    }

    const addBtn = document.getElementById('add-game-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            editingGame = null;
            openModal();
        });
    }

    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelected);
    }

    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateGame);
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showPage('library');
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            const libBtn = document.querySelector('.nav-item[data-page="library"]');
            if(libBtn) libBtn.classList.add('active');
        });
    }
}

function initModal() {
    const modal = document.getElementById('modal-game');

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', saveGame);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.stopPropagation();
            closeModal();
        }
    });

    const modalAppIdInput = document.getElementById('modal-appid');
    if (modalAppIdInput) {
        modalAppIdInput.addEventListener('input', (e) => {
            const extracted = extractAppID(e.target.value.trim());
            if (extracted && extracted !== e.target.value) {
                e.target.value = extracted;
            }
        });
    }
}

function openModal(game = null) {
    const modal = document.getElementById('modal-game');
    editingGame = game;

    document.getElementById('modal-title').textContent = game ? translate('modal.edit_game') : translate('modal.add_game');
    document.getElementById('modal-name').value = game?.name || '';
    document.getElementById('modal-path').value = game?.path || '';
    document.getElementById('modal-args').value = game?.arguments || '';
    document.getElementById('modal-appid').value = game?.steam_appid || '';

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-game').style.display = 'none';
}

async function saveGame() {
    const name = document.getElementById('modal-name').value.trim();
    if (!name) {
        await window.showCustomModal('Attention', 'Le nom du jeu est requis.');
        return;
    }

    const gameData = {
        name,
        path: document.getElementById('modal-path').value.trim(),
        arguments: document.getElementById('modal-args').value.trim(),
        steam_appid: document.getElementById('modal-appid').value.trim(),
    };

    try {
        let response;
        if (editingGame) {
            response = await fetch(`${API_BASE}/api/games/${editingGame.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });
        } else {
            response = await fetch(`${API_BASE}/api/games`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });
        }

        if (response.ok) {
            closeModal();
            await loadGames();
        } else {
            await window.showCustomModal('Erreur', 'Erreur lors de la sauvegarde.');
        }
    } catch (err) {
        console.error(err);
        await window.showCustomModal('Erreur', 'Erreur réseau lors de la sauvegarde.');
    }
}

async function loadUserInfo() {
    try {
        const res = await fetch(`${API_BASE}/api/steam/accounts`);
        const data = await res.json();

        if (data.accounts && data.accounts.length > 0) {
            const selected = data.accounts.find(a => a.selected) || data.accounts[0];
            document.getElementById('user-name').textContent = selected.personaname;

            try {
                const avatarRes = await fetch(`${API_BASE}/api/steam/avatar/${selected.steamid}`);
                if (avatarRes.ok) {
                    const blob = await avatarRes.blob();
                    const url = URL.createObjectURL(blob);
                    const img = document.getElementById('user-avatar');
                    img.src = url;
                    img.style.display = 'block';
                }
            } catch (e) {
                console.log('Avatar non trouvé');
            }
        }
    } catch (err) {
        console.error('Erreur chargement user:', err);
    }
}

async function loadGames() {
    try {
        const res = await fetch(`${API_BASE}/api/games?t=${Date.now()}`);
        const data = await res.json();
        games = data.games || [];
        renderGames(games);
        updateHomeStats();
    } catch (err) {
        console.error('Erreur chargement games:', err);
        document.getElementById('games-grid').innerHTML =
            '<div class="loading">Erreur de chargement</div>';
    }
}

function renderGames(gamesToRender) {
    const grid = document.getElementById('games-grid');
    const emptyState = document.getElementById('empty-state');

    if (gamesToRender.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = gamesToRender.map(game => createGameCard(game)).join('');

    document.querySelectorAll('.game-card').forEach(card => {
        const gameId = card.dataset.id;
        const game = games.find(g => g.id === gameId);

        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit') || e.target.closest('.btn-delete')) return;
            if (e.ctrlKey || e.metaKey) {
                toggleSelection(gameId);
            } else if (selectedGames.size > 0) {
                toggleSelection(gameId);
            } else {
                showGameDetails(game);
            }
        });

        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleSelection(gameId);
        });

        card.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(game);
        });

        card.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteGame(gameId);
        });
    });

    updateSelectionBar();
}

function createGameCard(game) {
    const playtime = game.playtime ? formatPlaytime(game.playtime) : null;
    const bannerUrl = game.banner ? `${API_BASE}/api/banners/${game.banner}` : '';
    const selected = selectedGames.has(game.id) ? 'selected' : '';

    return `
        <div class="game-card ${selected}" data-id="${game.id}">
            <div class="game-banner">
                ${bannerUrl ?
            `<img src="${bannerUrl}" alt="${game.name}">` :
            '<div class="no-banner">Pas de bannière</div>'
        }
            </div>
            <div class="game-info">
                <h3>${escapeHtml(game.name)}</h3>
                ${playtime ? `
                    <div class="playtime">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${playtime}</span>
                    </div>
                ` : ''}
            </div>
            <div class="game-actions">
                <button class="btn-icon btn-edit" title="Modifier">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function toggleSelection(gameId) {
    if (selectedGames.has(gameId)) {
        selectedGames.delete(gameId);
    } else {
        selectedGames.add(gameId);
    }

    const card = document.querySelector(`.game-card[data-id="${gameId}"]`);
    if (card) {
        card.classList.toggle('selected');
    }

    updateSelectionBar();
}

function updateSelectionBar() {
    const bar = document.getElementById('selection-bar');
    const count = document.getElementById('selection-count');

    if (selectedGames.size > 0) {
        bar.style.display = 'flex';
        count.textContent = `${selectedGames.size} jeu(x) sélectionné(s)`;
    } else {
        bar.style.display = 'none';
    }
}

async function deleteGame(gameId) {
    const confirmed = await window.showCustomModal('⚠️ Suppression', 'Êtes-vous sûr de vouloir supprimer ce jeu de votre bibliothèque ?', true);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/games/${gameId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            await loadGames();
        }
    } catch (err) {
        console.error(err);
        await window.showCustomModal('Erreur', 'Erreur lors de la suppression.');
    }
}

async function deleteSelected() {
    if (selectedGames.size === 0) return;
    const confirmed = await window.showCustomModal('⚠️ Suppression Multiple', `Êtes-vous sûr de vouloir supprimer <b>${selectedGames.size}</b> jeu(x) ?`, true);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/games/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedGames) })
        });

        if (res.ok) {
            selectedGames.clear();
            updateSelectionBar();
            await loadGames();
        }
    } catch (err) {
        console.error(err);
        await window.showCustomModal('Erreur', 'Erreur lors de la suppression multiple.');
    }
}

async function showGameDetails(game) {
    currentGame = game;

    document.getElementById('details-title').textContent = game.name;
    document.getElementById('details-playtime').textContent = formatPlaytime(game.playtime || 0);

    const bannerImg = document.getElementById('details-banner-img');

    if (game.steam_appid) {
        const hqUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_appid}/capsule_616x353.jpg`;
        const fallbackUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_appid}/header.jpg`;
        bannerImg.src = hqUrl;
        bannerImg.onerror = () => {
            if (game.banner) { bannerImg.src = `${API_BASE}/api/banners/${game.banner}`; }
            else { bannerImg.src = fallbackUrl; }
            bannerImg.onerror = null;
        };
        bannerImg.style.display = 'block';
    } else if (game.banner) {
        bannerImg.src = `${API_BASE}/api/banners/${game.banner}`;
        bannerImg.style.display = 'block';
    } else {
        bannerImg.style.display = 'none';
    }

    if (document.getElementById('launch-steam-btn')) {
        document.getElementById('launch-steam-btn').style.display = game.path ? 'block' : 'none';
        document.getElementById('launch-steam-btn').onclick = () => launchGame(game.id, 'crack_fix');
    }
    if (document.getElementById('launch-direct-btn')) {
        document.getElementById('launch-direct-btn').style.display = game.path ? 'block' : 'none';
        document.getElementById('launch-direct-btn').onclick = () => launchGame(game.id, 'direct');
    }

    if (game.steam_appid) {
        loadGameDescription(game.id);
    } else {
        document.getElementById('details-description').innerHTML = '<p>Aucune description disponible</p>';
    }

    showPage('details');
}



async function loadGameDescription(gameId) {
    const descDiv = document.getElementById('details-description');
    descDiv.innerHTML = '<p>Chargement...</p>';

    const langMap = {
        'fr': 'french',
        'en': 'english'
    };
    const steamLang = langMap[currentLanguage] || 'english';

    try {
        const res = await fetch(`${API_BASE}/api/games/${gameId}/details?lang=${steamLang}`);
        const data = await res.json();

        let html = '';
        if (data.description) {
            html += `<div>${data.description}</div>`;
        }
        if (data.requirements) {
            html += `<div class="requirements" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
                        <h3>⚙️ Configuration</h3>
                        ${data.requirements}
                     </div>`;
        }

        descDiv.innerHTML = html || '<p>Description non disponible</p>';
    } catch (err) {
        console.error(err);
        descDiv.innerHTML = '<p>Erreur de chargement</p>';
    }
}


async function launchGame(gameId, mode) {
    const steamBtn = document.getElementById('launch-steam-btn');
    const directBtn = document.getElementById('launch-direct-btn');

    [steamBtn, directBtn].forEach(btn => {
        if(btn) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'wait';
            btn.innerHTML = `<span class="spinner" style="display:inline-block; margin-right:8px; width:12px; height:12px; border:2px solid; border-radius:50%; border-top-color:transparent; animation: spin 1s linear infinite;"></span> Lancement en cours...`;
        }
    });

    try {
        const payload = { mode: mode };

        const response = await fetch(`/api/games/${gameId}/launch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            console.log("Jeu lancé avec succès en mode : " + mode);
        } else {
            await window.showCustomModal("Erreur de lancement", result.error);
        }
    } catch (err) {
        console.error("Erreur de lancement:", err);
    } finally {
        [steamBtn, directBtn].forEach(btn => {
            if(btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = '';
                if(btn.dataset.originalHtml) {
                    btn.innerHTML = btn.dataset.originalHtml;
                }
            }
        });
    }
}

async function importSteam() {
    const confirmed = await window.showCustomModal('🔍 Importation Steam', 'Voulez-vous lancer le scan complet de vos disques pour trouver les jeux Steam installés ?', true);
    if (!confirmed) return;

    const btn = document.getElementById('import-steam-btn');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span>🔍 Scan des disques en cours...</span>';

    try {
        console.log("Lancement de la requête d'import...");
        const res = await fetch(`${API_BASE}/api/import/steam`, {
            method: 'POST'
        });

        console.log("Réponse reçue, analyse...");
        const data = await res.json();

        if (data.success) {
            await window.showCustomModal('🎉 Import Terminé', `L'analyse est terminée !<br><br><span style="color:var(--accent); font-size:24px; font-weight:bold;">${data.imported}</span> nouveaux jeux Steam ont été trouvés et ajoutés à votre bibliothèque.`);
            await loadGames();
        } else {
            await window.showCustomModal('Erreur', 'Erreur signalée par le serveur: ' + data.error);
        }
    } catch (err) {
        console.error("Erreur JS Import:", err);
        await window.showCustomModal('Erreur Réseau', 'Erreur de connexion au backend. Vérifiez que l\'application tourne correctement.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function searchSteamGames(query) {
    const autocompleteDiv = document.getElementById('steam-autocomplete-results');
    if (!autocompleteDiv) return;

    autocompleteDiv.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 13px; display:flex; align-items:center; gap:8px;"><svg class="spinner-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg> Recherche en cours...</div>';
    autocompleteDiv.style.display = 'block';

    try {
        const res = await fetch(`${API_BASE}/api/steam/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        if (!data || data.length === 0) {
            autocompleteDiv.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 13px;">Aucun résultat trouvé</div>';
            return;
        }

        autocompleteDiv.innerHTML = data.slice(0, 10).map(app => `
            <div class="steam-suggest-item" data-appid="${app.appid}" data-name="${app.name.replace(/"/g, '&quot;')}" style="display:flex; align-items:center; gap:12px; padding:10px 14px; cursor:pointer; transition: background 0.15s; border-bottom: 1px solid var(--border);">
                <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${app.appid}/capsule_231x87.jpg"
                     onerror="this.src='https://cdn.cloudflare.steamstatic.com/steam/apps/${app.appid}/header.jpg'; this.onerror=null;"
                     style="width:77px; height:29px; object-fit:cover; border-radius:4px; flex-shrink:0;">
                <div style="flex:1; min-width:0;">
                    <div style="font-size:13.5px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500;">${app.name}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">AppID: ${app.appid}</div>
                </div>
            </div>
        `).join('');

        autocompleteDiv.querySelectorAll('.steam-suggest-item').forEach(item => {
            item.addEventListener('mouseenter', () => { item.style.background = 'var(--bg-input)'; });
            item.addEventListener('mouseleave', () => { item.style.background = ''; });
            item.addEventListener('click', () => {
                const appid = item.dataset.appid;
                const genInput = document.getElementById('gen-appid');
                if (genInput) genInput.value = appid;
                autocompleteDiv.style.display = 'none';
            });
        });
    } catch (err) {
        console.error('Erreur recherche Steam:', err);
        autocompleteDiv.innerHTML = '<div style="padding: 12px; color: #e74c3c; font-size: 13px;">Erreur lors de la recherche. Vérifiez votre connexion.</div>';
    }
}

async function generateGame() {
    const rawInput = document.getElementById('gen-appid').value.trim();

    const appid = extractAppID(rawInput);

    if (!appid) {
        await window.showCustomModal('Attention', 'AppID requis (ou lien Steam valide)');
        return;
    }

    const btn = document.getElementById('generate-btn');
    const output = document.getElementById('generate-output');

    btn.disabled = true;
    btn.innerHTML = '<svg class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; margin-bottom: 0;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg> Génération...';
    output.className = 'result-box';
    output.innerHTML = '<svg class="spinner-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg><div>Initialisation en cours...</div>';

    try {
        const res = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appid: appid
            })
        });

        const data = await res.json();

        if (data.success) {
            output.className = 'result-box success';
            output.innerHTML = `<svg class="check-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
<div><b style="font-size: 16px;">Génération Réussie !</b><br><span style="color:var(--text-secondary); font-size: 13.5px; margin-top: 5px; display:inline-block;">Jeu : ${data.game.name}<br>Désormais disponible dans votre bibliothèque.</span></div>`;
            await loadGames();
        } else {
            output.className = 'result-box error';
            output.innerHTML = `<svg class="err-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
<div><b>Erreur</b><br><span style="color:var(--text-secondary); font-size: 13.5px;">${data.error}</span></div>`;
        }
    } catch (err) {
        console.error(err);
        output.className = 'result-box error';
        output.innerHTML = `<svg class="err-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
<div><b>Erreur Réseau</b><br><span style="color:var(--text-secondary); font-size: 13.5px;">Impossible de contacter le serveur.</span></div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> ${translate('generate.button')}`;
    }
}
function formatPlaytime(playtime) {
    if (!playtime) return "0h00";

    if (typeof playtime === "object") {
        if (!selectedSteamID) return "0h00";

        const seconds = playtime[selectedSteamID] || 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h${m.toString().padStart(2, "0")}`;
    }

    const seconds = playtime || 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h${m.toString().padStart(2, "0")}`;
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a' &&
        document.getElementById('library-page').classList.contains('active')) {
        e.preventDefault();
        games.forEach(g => selectedGames.add(g.id));
        renderGames(games);
    }

    if (e.key === 'Delete' && selectedGames.size > 0) {
        deleteSelected();
    }

    if (e.key === 'Escape' && selectedGames.size > 0) {
        deselectAll();
    }
});

window.deselectAll = function () {
    selectedGames.clear();
    renderGames(games);
};



async function loadServers() {
    const tbody = document.getElementById('servers-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-muted);">Chargement...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/servers`);
        const servers = await res.json();

        if (!servers || servers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-muted);">Aucun serveur disponible</td></tr>';
            return;
        }

        tbody.innerHTML = servers.map(s => `
            <tr style="border-bottom: 1px solid var(--bg-card);">
                <td style="padding: 10px;">${escapeHtml(s.ServerName)}</td>
                <td style="padding: 10px;">${s.ServerCapacity} / ${s.MaxCapacity}</td>
                <td style="padding: 10px;"><span class="account-badge" style="background: var(--bg-input);">${escapeHtml(s.GameName)}</span></td>
                    <button class="btn-toolbar" onclick="reserveServer('${s.ServerId}', '${escapeHtml(s.ServerName).replace(/'/g, "\\'")}', '${escapeHtml(s.GameName).replace(/'/g, "\\'")}')">Rejoindre</button>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Erreur chargement serveurs:', err);
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #ff4444;">Erreur de chargement</td></tr>';
    }
}

window.reserveServer = async function (serverId, serverName, gameName) {
    const confirmed = await window.showCustomModal('Rejoindre', `Voulez-vous rejoindre le serveur "<b style="color:var(--accent);">${serverName}</b>" ?`, true);
    if (!confirmed) return;

    let gameToLaunch = null;
    if (gameName) {
        const lowerGameName = gameName.toLowerCase();
        gameToLaunch = games.find(g =>
            g.name.toLowerCase().includes(lowerGameName) ||
            lowerGameName.includes(g.name.toLowerCase())
        );
    }

    if (gameToLaunch) {
        await window.showCustomModal('Connexion', `Lancement automatique de <b style="color:var(--accent);">${gameToLaunch.name}</b> et connexion au serveur en cours...`);
        try {
            const res = await fetch(`${API_BASE}/api/games/${gameToLaunch.id}/launch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'crack_fix', server_id: serverId })
            });

            const result = await res.json();
            if (result.success) {
                showServerSession(serverName);
            } else {
                await window.showCustomModal("Erreur de lancement", result.error);
            }
        } catch (err) {
            console.error(err);
            await window.showCustomModal("Erreur", "Erreur réseau impossible de joindre le launcher backend.");
        }
    } else {
        await window.showCustomModal("Attention", `Le jeu "<b style="color:var(--accent);">${gameName}</b>" n'a pas été trouvé dans votre bibliothèque pour le lancement automatique.`);
    }
};

function showServerSession(serverName) {
    const banner = document.getElementById('server-session-banner');
    const nameSpan = document.getElementById('active-server-name');
    if (banner && nameSpan) {
        banner.style.display = 'block';
        nameSpan.textContent = serverName;
    }
}


function initPhotonPage() {
    const copyBtn = document.getElementById('photon-copy-btn');
    const editBtn = document.getElementById('photon-edit-admin-btn');
    const deleteBtn = document.getElementById('photon-delete-btn');

    if (copyBtn) copyBtn.addEventListener('click', copyPhotonEntries);
    if (editBtn) editBtn.addEventListener('click', editPhotonWithNotepad);
    if (deleteBtn) deleteBtn.addEventListener('click', deletePhotonEntries);
}

async function checkPhotonStatus() {
    const statusEl = document.getElementById('photon-status-indicator');
    if (!statusEl) return;

    try {
        const res = await fetch(`${API_BASE}/api/photon/status`);
        const data = await res.json();
        
        statusEl.className = 'status-indicator ' + data.status;
        const statusText = statusEl.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = data.status === 'configured' ? 'Patched' : 'Not Patched';
        }
    } catch (e) {
        console.error("Erreur status photon:", e);
        const statusText = statusEl.querySelector('.status-text');
        if (statusText) statusText.textContent = "Error";
    }
}

async function editPhotonWithNotepad() {
    try {
        const res = await fetch(`${API_BASE}/api/photon/edit`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            console.log("Notepad lancé avec privilèges Admin.");
        } else {
            await window.showCustomModal('Erreur', 'Impossible de lancer Bloc-notes: ' + (data.error || 'Erreur inconnue'));
        }
    } catch (e) {
        console.error("Erreur edit photon:", e);
        await window.showCustomModal('Erreur', 'Erreur de connexion au backend.');
    }
}

async function deletePhotonEntries() {
    const confirmed = await window.showCustomModal('⚠️ Suppression', 'Voulez-vous vraiment supprimer la configuration DNS pour Photon ? Une élévation Admin sera demandée.', true);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/photon/delete`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            await window.showCustomModal('🎉 Terminé', 'La requête de suppression a été envoyée. Veuillez rafraîchir pour vérifier le statut.');
            setTimeout(checkPhotonStatus, 1500);
        } else {
            await window.showCustomModal('Erreur', 'Impossible de supprimer: ' + (data.error || 'Erreur inconnue'));
        }
    } catch (e) {
        console.error("Erreur delete photon:", e);
        await window.showCustomModal('Erreur', 'Erreur de connexion au backend.');
    }
}

function copyPhotonEntries() {
    const entries = "51.195.118.216 ns.exitgames.io\n51.195.118.216 ns.exitgames.com\n51.195.118.216 ns.photonengine.io\n51.195.118.216 ns.photonengine.com";
    navigator.clipboard.writeText(entries).then(() => {
        window.showCustomModal('🎉 Copié', 'La configuration DNS a été copiée dans votre presse-papiers.');
    }).catch(err => {
        console.error('Erreur copie:', err);
    });
}

async function updateGameAppId(gameId, newAppId) {
    try {
        const res = await fetch(`${API_BASE}/api/games/${gameId}`);
        const game = await res.json();
        
        game.steam_appid = newAppId;
        
        await fetch(`${API_BASE}/api/games/${gameId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        });
        
        await window.showCustomModal('AppID Assistant', 'AppID mis à jour avec succès !');
        loadGames();
        loadGameDetails(gameId);
    } catch (err) {
        console.error('Erreur mise à jour AppID:', err);
    }
}

function initLegalLink() {
    console.log("Legal link initialized via standard navigation.");
}



