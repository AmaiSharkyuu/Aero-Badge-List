(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/settings.jsx
  var require_settings = __commonJS({
    "src/settings.jsx"() {
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
          children.flat().forEach((c) => {
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
          return new Promise((resolve) => {
            chrome.storage.local.get(key, (res) => {
              resolve(res[key]);
            });
          });
        }
        function setSetting(key, value) {
          return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
          });
        }
        function makeOption(id, text, href) {
          const li = document.createElement("li");
          li.id = id;
          li.className = "menu-option";
          li.setAttribute("role", "tab");
          li.append(
            /* @__PURE__ */ createElement("a", { className: "menu-option-content", href }, /* @__PURE__ */ createElement("span", { className: "font-caption-header" }, text), /* @__PURE__ */ createElement("span", { className: "rbx-tab-subtitle" }))
          );
          return li;
        }
        function saveCloudKeys() {
          const keys = [...document.querySelectorAll(".abl-cloud-key-input")].map((i) => i.value);
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
        function addCloudKeyRow(container, value = "") {
          const row = document.createElement("div");
          row.className = "abl-row";
          row.style.display = "flex";
          row.style.marginBottom = "8px";
          row.style.alignItems = "center";
          row.append(
            /* @__PURE__ */ createElement("input", { className: "form-control input-field abl-cloud-key-input", placeholder: "Cloud Key", value, style: { flex: "1" } }),
            /* @__PURE__ */ createElement("div", { style: { width: "90px", display: "flex", justifyContent: "flex-end", gap: "6px" } }, /* @__PURE__ */ createElement("button", { className: "btn-control-xs abl-remove-key", type: "button", style: { fontSize: "20px", width: "40px", height: "40px" } }, "\u2212"), /* @__PURE__ */ createElement("button", { className: "btn-control-xs abl-add-key", type: "button", style: { fontSize: "20px", width: "40px", height: "40px" } }, "+"))
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
        async function addSettingButton(tabContent2, key, text) {
          const enabled = await getBool(key, true);
          const row = document.createElement("div");
          row.style.display = "flex";
          row.style.alignItems = "center";
          row.style.justifyContent = "space-between";
          row.style.marginBottom = "12px";
          row.append(
            /* @__PURE__ */ createElement("span", { className: "font-caption-header", style: { fontSize: "16px" } }, text),
            /* @__PURE__ */ createElement("div", { className: `abl-toggle ${enabled ? "on" : ""}` }, /* @__PURE__ */ createElement("div", { className: "abl-toggle-knob" }))
          );
          const toggle = row.querySelector(".abl-toggle");
          toggle.addEventListener("click", async () => {
            const isOn = toggle.classList.toggle("on");
            await setSetting(key, isOn);
          });
          tabContent2.appendChild(row);
        }
        function bindCloudKeysAction(list) {
          const exportBtn = document.getElementById("abl-export-keys");
          const importBtn = document.getElementById("abl-import-keys");
          const fileInput = document.getElementById("abl-import-file");
          exportBtn.addEventListener("click", () => {
            const keys = [...document.querySelectorAll(".abl-cloud-key-input")].map((i) => i.value.trim()).filter(Boolean);
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
              const cleanedKeys = keys.map((key) => String(key).trim()).filter(Boolean);
              await setSetting("ablCloudKeys", cleanedKeys.length ? cleanedKeys : [""]);
              list.innerHTML = "";
              (cleanedKeys.length ? cleanedKeys : [""]).forEach((key) => {
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
              /* @__PURE__ */ createElement("div", { className: "section" }, /* @__PURE__ */ createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ createElement("h3", { style: { margin: "0" } }, "Cloud Keys"), /* @__PURE__ */ createElement("div", { id: "abl-cloud-key-actions", style: { display: "flex", gap: "8px" } }, /* @__PURE__ */ createElement("button", { className: "btn-control-sm", type: "button", id: "abl-export-keys" }, "Export"), /* @__PURE__ */ createElement("button", { className: "btn-control-sm", type: "button", id: "abl-import-keys" }, "Import"))), /* @__PURE__ */ createElement("input", { type: "file", id: "abl-import-file", accept: "application/json", hidden: true }), /* @__PURE__ */ createElement("div", { id: "abl-cloud-key-list" }))
            );
            const list = document.getElementById("abl-cloud-key-list");
            const keys = await getSetting("ablCloudKeys") ?? [""];
            keys.forEach((k) => addCloudKeyRow(list, k));
            bindCloudKeysAction(list);
            const cloudkeySettingsTab = /* @__PURE__ */ createElement("div", null);
            addSettingButton(cloudkeySettingsTab, "ablShutUpKeyWarning", "Remove Cloud Key Warning");
            const cloudKeyInstructions = /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("h2", null, "How to get a cloud key?"), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("p", null, "1. Head to ", /* @__PURE__ */ createElement("a", { href: "https://create.roblox.com/dashboard/credentials", style: { color: "revert", textDecoration: "revert" } }, "Roblox API Keys")), /* @__PURE__ */ createElement("p", null, '2. Click on "Create API Key"'), /* @__PURE__ */ createElement("p", null, "3. Give it any name and description."), /* @__PURE__ */ createElement("p", null, '4. Select "inventory" under the "Select API System" textbox.'), /* @__PURE__ */ createElement("p", null, '5. Select "read" under the "Select Operations to Add" textbox.'), /* @__PURE__ */ createElement("p", null, "6. Generate the key, make sure to save it somewhere safe."), /* @__PURE__ */ createElement("p", null, "7. Paste the key into one of the text boxes here.")), /* @__PURE__ */ createElement("br", null));
            tabContent.appendChild(cloudKeyInstructions);
            tabContent.appendChild(cloudkeySettingsTab);
          }
          if (id === "abl-general-settings") {
            tabContent.replaceChildren(
              /* @__PURE__ */ createElement("div", { className: "section" }, /* @__PURE__ */ createElement("h3", null, "General Settings"), /* @__PURE__ */ createElement("div", { id: "abl-general-settings-list" }))
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
          const returnBtn = makeOption("abl-back", "Return", ABL_TABS["abl-back"].href);
          menu.append(generalSettings, cloudKeys, returnBtn);
          const key = new URLSearchParams(location.search).get("abl") || "general-settings";
          const tab = menu.querySelector(`#abl-${key}`) || generalSettings;
          setActive(tab);
          renderAblTab(tab.id);
        }
        function setActive(tab, activeClass = "active") {
          document.querySelectorAll(".menu-option-content").forEach((a) => {
            a.classList.remove("active");
          });
          tab.querySelector("a").classList.add(activeClass);
        }
        function inject() {
          const params2 = new URLSearchParams(window.location.search);
          if (params2.get("abl") || !menu || document.getElementById("abl-settings")) return false;
          const settings = makeOption(
            "abl-settings",
            "ABL Settings",
            "?abl=general-settings"
          );
          settings.querySelector("a").addEventListener("click", (e) => {
            e.preventDefault();
            title.textContent = "Advanced Badge List Settings";
            history.pushState(null, "", "?abl=general-settings");
            showAblMenu();
          });
          menu.appendChild(settings);
          return true;
        }
        inject();
        const params = new URLSearchParams(window.location.search);
        if (params.get("abl")) {
          title.textContent = "Advanced Badge List Settings";
          showAblMenu();
        }
      })();
    }
  });
  require_settings();
})();
