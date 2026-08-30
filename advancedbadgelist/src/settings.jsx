(async function() {
    function createElement(tag, props, ...children) {
        const el = document.createElement(tag);

        for (const [k, v] of Object.entries(props || {})) {
            if (k === "className") el.className = v;
            else if (k === "style") Object.assign(el.style, v);
            else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
            else if (k === "hidden") el.hidden = v;
            else el.setAttribute(k, v);
        }

        children.flat().forEach(c => {
            if (c == null) return;
            el.append(c instanceof Node ? c : document.createTextNode(c));
        });

        return el;
    }
    
    const style = document.createElement("style");
    style.innerHTML = `
    .abl-toggle {
        width: 44px;
        height: 24px;
        border-radius: 0;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 45%), #b0362f;
        border: 1px solid rgba(0, 0, 0, 0.4);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
        position: relative;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .abl-toggle.on {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 45%), #2e9e46;
    }

    .abl-toggle-knob {
        width: 20px;
        height: 20px;
        background: linear-gradient(to bottom, #ffffff 0%, #cfe9f5 45%, #9fd0e8 55%, #ffffff 100%);
        border: 1px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        border-radius: 0;
        position: absolute;
        top: 1px;
        left: 2px;
        transition: left 0.2s ease;
    }

    .abl-toggle.on .abl-toggle-knob {
        left: 22px;
    }

    .abl-cloud-key-input {
        border-radius: 0 !important;
    }

    #abl-export-keys,
    #abl-import-keys,
    .abl-add-key,
    .abl-remove-key {
        border-radius: 0 !important;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 14%, rgba(255, 255, 255, 0) 50%), linear-gradient(to bottom, #3fc6ff 0%, #0d6fa8 55%, #073757 100%) !important;
        border: 1px solid rgba(210, 245, 255, 0.7) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 1px 3px rgba(0, 0, 0, 0.5);
        color: #f2fdff !important;
        text-shadow: 0 1px 1px rgba(0, 20, 30, 0.6);
    }

    #abl-export-keys:hover,
    #abl-import-keys:hover,
    .abl-add-key:hover,
    .abl-remove-key:hover {
        filter: brightness(1.12);
    }

    .abl-theme-btn {
        padding: 8px 14px;
        border-radius: 0 !important;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 14%, rgba(255, 255, 255, 0) 50%), linear-gradient(to bottom, #3fc6ff 0%, #0d6fa8 55%, #073757 100%);
        border: 1px solid rgba(210, 245, 255, 0.4);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 3px rgba(0, 0, 0, 0.4);
        color: #cfe9f5;
        text-shadow: 0 1px 1px rgba(0, 20, 30, 0.5);
        cursor: pointer;
        opacity: 0.6;
        font-size: 13px;
        font-weight: 600;
    }

    .abl-theme-btn.active {
        opacity: 1;
        border: 1px solid rgba(235, 235, 235, 0.9);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 0 8px rgba(120, 200, 255, 0.5);
    }

    .abl-theme-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        margin-top: 16px;
        background: #0b0b0e;
        border: 1px solid rgba(150, 215, 255, 0.3);
    }

    .abl-theme-preview-btn {
        padding: 6px 14px;
        border-radius: 0;
        background: linear-gradient(to bottom, hsl(var(--p-hue) var(--p-sat) 62%) 0%, hsl(var(--p-hue) calc(var(--p-sat) * 0.9) 36%) 55%, hsl(calc(var(--p-hue) + 4) calc(var(--p-sat) * 0.9) 18%) 100%);
        border: 1px solid hsl(var(--p-hue) var(--p-sat) 89% / 0.85);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        text-shadow: 0 1px 1px rgba(0, 20, 30, 0.6);
        cursor: default;
    }

    .abl-theme-preview-chip {
        width: 26px;
        height: 26px;
        border: 3px solid var(--p-rarity, #ffd700);
    }
    `;
    document.head.appendChild(style);
    const menu = document.querySelector("ul.menu-vertical[role='tablist']");
    const tabContent = document.querySelector(".tab-content.rbx-tab-content");
    const title = document.getElementById("react-user-account-base")?.querySelector("h1");

    const ABL_TABS = {
        "abl-general-settings": {
            href: "?abl=general-settings",
            render: () => renderAblTab("abl-general-settings")
        },
        "abl-cloud-keys": {
            href: "?abl=cloud-keys",
            render: () => renderAblTab("abl-cloud-keys")
        },
        "abl-theme": {
            href: "?abl=theme",
            render: () => renderAblTab("abl-theme")
        },
        "abl-back": {
            href: "https://www.roblox.com/my/account#!/info",
            back: true
        }
    };

    menu.addEventListener("click", async (e) => {
        const a = e.target.closest("a");
        if (!a) return;

        const li = a.closest("li");
        const tab = ABL_TABS[li?.id];

        if (!tab) return;

        e.preventDefault();
        
        if (tab.back) {
            location.href = tab.href;
            return;
        }

        if (location.search === tab.href) return;

        history.pushState(null, "", tab.href);
        setActive(li);
        tab.render();
    });

    function getSetting(key) {
        return new Promise(resolve => {
            chrome.storage.local.get(key, (res) => {
                resolve(res[key]);
            });
        });
    }

    function setSetting(key, value) {
        return new Promise(resolve => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    }

    function hexToHueSat(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        let h = 0;
        let s = 0;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h *= 60;
        }

        return { hue: Math.round(h), sat: Math.round(s * 100) };
    }

    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;

        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        const toHex = x => Math.round(255 * x).toString(16).padStart(2, "0");

        return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
    }

    function makeOption(id, text, href) {
        const li = document.createElement("li");
        li.id = id;
        li.className = "menu-option";
        li.setAttribute("role", "tab");
        li.append(
            <a className="menu-option-content" href={href}>
                <span className="font-caption-header">{text}</span>
                <span className="rbx-tab-subtitle"></span>
            </a>
        );

        return li;

    }

    function saveCloudKeys() {
        const keys = [...document.querySelectorAll(".abl-cloud-key-input")].map(i => i.value);
        chrome.storage.local.set({ ablCloudKeys: keys });
    }

    async function getBool(key, fallback = false) {
        const val = await getSetting(key);
        return val ?? fallback;
    }

    function syncCloudKeyButtons(container) {
        const rows = container.querySelectorAll(".abl-row");

        rows.forEach((r, i) => {
            const add = r.querySelector(".abl-add-key");
            const remove = r.querySelector(".abl-remove-key");

            if (add) {
                add.hidden = i !== rows.length - 1;
                add.disabled = i !== rows.length - 1;
            }

            if (remove) {
                remove.hidden = i === 0;
                remove.disabled = i === 0;
            }
        });
    }

    function addCloudKeyRow(container, value="") {
        const row = document.createElement("div");
        row.className = "abl-row";
        row.style.display = "flex";
        row.style.marginBottom = "8px";
        row.style.alignItems = "center";

        row.append(
            <input className="form-control input-field abl-cloud-key-input" placeholder="Cloud Key" value={value} style={{ flex: "1" }}/>,
            <div style={{ width: "90px", display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                <button className="btn-control-xs abl-remove-key" type="button" style={{ fontSize: "20px", width: "40px", height: "40px" }}>−</button>
                <button className="btn-control-xs abl-add-key" type="button" style={{ fontSize: "20px", width: "40px", height: "40px" }}>+</button>
            </div>
        );
        const addBtn = row.querySelector(".abl-add-key");
        const removeBtn = row.querySelector(".abl-remove-key");

        removeBtn.addEventListener("click", () => {
            const firstRow = container.querySelector(".abl-row");
            if (row === firstRow) return;
            row.remove();
            saveCloudKeys();
            syncCloudKeyButtons(container);
        });
        addBtn.addEventListener("click", () => {
            addCloudKeyRow(container, "");
            saveCloudKeys();
            syncCloudKeyButtons(container);
        });
        
        let timeout;

        row.querySelector("input").addEventListener("input", () => {
            clearTimeout(timeout);
            timeout = setTimeout(saveCloudKeys, 200);
        });
        container.appendChild(row);
        syncCloudKeyButtons(container);
    }

    async function addSettingButton(tabContent, key, text) {
        const enabled = await getBool(key, true);

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.marginBottom = "12px";

        row.append(
            <span className="font-caption-header" style={{ fontSize: "16px" }}>{text}</span>,
            <div className={`abl-toggle ${enabled ? "on" : ""}`}>
                <div className="abl-toggle-knob"></div>
            </div>
        );

        const toggle = row.querySelector(".abl-toggle");
        
        toggle.addEventListener("click", async () => {
            const isOn = toggle.classList.toggle("on");
            await setSetting(key, isOn);
        });

        tabContent.appendChild(row);
    }

    function bindCloudKeysAction(list) {
        const exportBtn = document.getElementById("abl-export-keys");
        const importBtn = document.getElementById("abl-import-keys");
        const fileInput = document.getElementById("abl-import-file");

        exportBtn.addEventListener("click", () => {
            const keys = [...document.querySelectorAll(".abl-cloud-key-input")].map(i => i.value.trim()).filter(Boolean);

            const blob = new Blob(
                [JSON.stringify({ ablCloudKeys: keys }, null, 2)],
                { type: "application/json" }
            );

            const url = URL.createObjectURL(blob);

            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "abl-cloud-keys.json";
            anchor.click();

            URL.revokeObjectURL(url);
        });

        importBtn.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", async () => {
            const file = fileInput.files[0];
            if (!file) return;

            try {
                const data = JSON.parse(await file.text());
                const keys = Array.isArray(data) ? data : data.ablCloudKeys;

                if (!Array.isArray(keys)) {
                    alert("Invalid import file.");
                    return;
                }

                const cleanedKeys = keys.map(key => String(key).trim()).filter(Boolean);

                await setSetting("ablCloudKeys", cleanedKeys.length ? cleanedKeys : [""]);

                list.innerHTML = "";

                (cleanedKeys.length ? cleanedKeys : [""]).forEach(key => {
                    addCloudKeyRow(list, key);
                });

                syncCloudKeyButtons(list);
            } catch {
                alert("Invalid import file.");
            } finally {
                fileInput.value = "";
            }
        });
    }

    async function renderAblTab(id) {
        if (id === "abl-cloud-keys") {
            tabContent.replaceChildren(
                <div className="section">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h3 style={{ margin: "0" }}>Cloud Keys</h3>
                        <div id="abl-cloud-key-actions" style={{ display: "flex", gap: "8px" }}>
                            <button className="btn-control-sm" type="button" id="abl-export-keys">Export</button>
                            <button className="btn-control-sm" type="button" id="abl-import-keys">Import</button>
                        </div>
                    </div>
                    <input type="file" id="abl-import-file" accept="application/json" hidden={true} />
                    <div id="abl-cloud-key-list"></div>
                </div>
            );

            const list = document.getElementById("abl-cloud-key-list");
            const keys = (await getSetting("ablCloudKeys")) ?? [""];

            keys.forEach(k => addCloudKeyRow(list, k));
            bindCloudKeysAction(list);

            const cloudkeySettingsTab = <div></div>

            addSettingButton(cloudkeySettingsTab, "ablShutUpKeyWarning", "Remove Cloud Key Warning");

            const cloudKeyInstructions = <div>
                <h2>How to get a cloud key?</h2>
                <div>
                    <p>1. Head to <a href="https://create.roblox.com/dashboard/credentials" style={{ color: "revert", textDecoration: "revert" }}>Roblox API Keys</a></p>
                    <p>2. Click on "Create API Key"</p>
                    <p>3. Give it any name and description.</p>
                    <p>4. Select "inventory" under the "Select API System" textbox.</p>
                    <p>5. Select "read" under the "Select Operations to Add" textbox.</p>
                    <p>6. Generate the key, make sure to save it somewhere safe.</p>
                    <p>7. Paste the key into one of the text boxes here.</p>
                </div>
                <br></br>
            </div>

            tabContent.appendChild(cloudKeyInstructions);
            tabContent.appendChild(cloudkeySettingsTab);
        }

        if (id === "abl-theme") {
            tabContent.replaceChildren(
                <div className="section">
                    <h3>Theme</h3>
                    <p className="font-caption-body" style={{ opacity: "0.7", marginBottom: "12px" }}>Changes apply next time you load a game page.</p>
                    <div id="abl-theme-presets" style={{ display: "flex", gap: "8px" }}>
                        <button className="abl-theme-btn" type="button" data-preset="aero">Aero</button>
                        <button className="abl-theme-btn" type="button" data-preset="mono">Monochrome</button>
                        <button className="abl-theme-btn" type="button" data-preset="custom">Custom</button>
                    </div>
                    <div id="abl-theme-custom-row" style={{ display: "none", alignItems: "center", gap: "10px", marginTop: "12px" }}>
                        <span className="font-caption-header" style={{ fontSize: "14px" }}>Accent color</span>
                        <input type="color" id="abl-theme-color" value="#3fc6ff" style={{ width: "44px", height: "32px", padding: "0", border: "none", background: "none", cursor: "pointer" }} />
                    </div>
                    <div className="abl-theme-preview" id="abl-theme-preview">
                        <button className="abl-theme-preview-btn" type="button">Load</button>
                        <div className="abl-theme-preview-chip" id="abl-theme-preview-chip"></div>
                        <span style={{ fontSize: "12px", opacity: "0.6" }}>Preview</span>
                    </div>
                </div>
            );

            const presetButtons = [...document.querySelectorAll(".abl-theme-btn")];
            const customRow = document.getElementById("abl-theme-custom-row");
            const colorInput = document.getElementById("abl-theme-color");
            const preview = document.getElementById("abl-theme-preview");
            const previewChip = document.getElementById("abl-theme-preview-chip");

            const PRESETS = {
                aero: { hue: 200, sat: 95 },
                mono: { hue: 0, sat: 0 }
            };

            function updatePreview(theme) {
                preview.style.setProperty("--p-hue", theme.hue);
                preview.style.setProperty("--p-sat", theme.sat + "%");
                previewChip.style.setProperty("--p-rarity", theme.preset === "mono" ? "#ffffff" : "#ffd700");
            }

            function setActivePresetButton(preset) {
                presetButtons.forEach(b => b.classList.toggle("active", b.dataset.preset === preset));
                customRow.style.display = preset === "custom" ? "flex" : "none";
            }

            const savedTheme = (await getSetting("ablTheme")) || { preset: "aero", hue: 200, sat: 95 };

            setActivePresetButton(savedTheme.preset);
            updatePreview(savedTheme);

            if (savedTheme.preset === "custom") {
                colorInput.value = hslToHex(savedTheme.hue, savedTheme.sat, 55);
            }

            presetButtons.forEach(btn => {
                btn.addEventListener("click", async () => {
                    const preset = btn.dataset.preset;
                    setActivePresetButton(preset);

                    const theme = preset === "custom"
                        ? { preset: "custom", ...hexToHueSat(colorInput.value) }
                        : { preset, ...PRESETS[preset] };

                    updatePreview(theme);
                    await setSetting("ablTheme", theme);
                });
            });

            colorInput.addEventListener("input", async () => {
                const theme = { preset: "custom", ...hexToHueSat(colorInput.value) };

                updatePreview(theme);
                await setSetting("ablTheme", theme);
            });
        }

        if (id === "abl-general-settings") {
            tabContent.replaceChildren(
                <div className="section">
                    <h3>General Settings</h3>
                    <div id="abl-general-settings-list"></div>
                </div>
            );

            const list = document.getElementById("abl-general-settings-list");

            addSettingButton(list, "ablEnabled", "Badge List Enabled");
            addSettingButton(list, "americanDates", "Switch to MM/DD/YYYY format");
        }
    }

    function showAblMenu() {
        if (!menu || !tabContent) return;

        menu.innerHTML = "";
        tabContent.innerHTML = "";

        const generalSettings = makeOption("abl-general-settings", "General Settings", ABL_TABS["abl-general-settings"].href);
        const cloudKeys = makeOption("abl-cloud-keys", "Cloud Keys", ABL_TABS["abl-cloud-keys"].href);
        const theme = makeOption("abl-theme", "Theme", ABL_TABS["abl-theme"].href);
        const returnBtn = makeOption("abl-back", "Return", ABL_TABS["abl-back"].href);

        menu.append(generalSettings, cloudKeys, theme, returnBtn);

        const key = new URLSearchParams(location.search).get("abl") || "general-settings";
        const tab = menu.querySelector(`#abl-${key}`) || generalSettings;

        setActive(tab);
        renderAblTab(tab.id);
    }

    function setActive(tab, activeClass = "active") {
        document.querySelectorAll(".menu-option-content")
            .forEach(a => {
                a.classList.remove("active");
            });

        tab.querySelector("a").classList.add(activeClass);
    }

    function inject() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("abl") || !menu || document.getElementById("abl-settings")) return false;

        const settings = makeOption(
            "abl-settings",
            "ABL Settings",
            "?abl=general-settings"
        );

        settings.querySelector("a").addEventListener("click", (e) => {
            e.preventDefault();
            title.textContent = "Aero Badge List Settings";
            history.pushState(null, "", "?abl=general-settings");
            showAblMenu();
        });

        menu.appendChild(settings);
        return true;
    }
    
    inject();

    const params = new URLSearchParams(window.location.search);
    if (params.get("abl")) {
        title.textContent = "Aero Badge List Settings";
        showAblMenu();
    }
})();