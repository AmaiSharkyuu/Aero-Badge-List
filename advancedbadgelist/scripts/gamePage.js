(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/gamePage.jsx
  var require_gamePage = __commonJS({
    "src/gamePage.jsx"() {
      (async function() {
        function createElement(tag, props, ...children) {
          const el = document.createElement(tag);
          for (const [k, v] of Object.entries(props || {})) {
            if (k === "className") el.className = v;
            else if (k === "style") el.style = v;
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
        async function wait(ms) {
          return new Promise(function(resolve) {
            setTimeout(resolve, ms);
          });
        }
        ;
        async function waitForSelector(selector, pollMS = 200) {
          let waiting = null;
          while (!waiting) {
            await wait(pollMS);
            const element = document.querySelector(selector);
            if (element) {
              waiting = element;
            }
            ;
          }
          return waiting;
        }
        ;
        async function retry(func, timeoutMS) {
          while (true) {
            try {
              const result = await func();
              if (result === void 0) {
                throw new Error("Return is undefined");
              }
              return result;
            } catch (error) {
              if (error instanceof ImpossibleResultError) {
                return error;
              } else {
                await wait(timeoutMS);
              }
            }
          }
        }
        function setSVGcolor(svg, color) {
          svg.querySelectorAll("path, rect").forEach(function(p) {
            p.setAttribute("fill", color);
          });
        }
        class AwaitableSignal {
          constructor() {
            this._reset();
          }
          _reset() {
            this.promise = new Promise((resolve) => {
              this._resolve = resolve;
            });
          }
          emit() {
            this._resolve();
            this._reset();
          }
        }
        class Signal {
          constructor() {
            this.subscribers = [];
          }
          subscribe(newFunction) {
            this.subscribers.push(newFunction);
          }
          emit(...parameters) {
            for (const subscriber of this.subscribers) {
              subscriber(parameters);
            }
          }
        }
        async function getSVG(URL) {
          const url = chrome.runtime.getURL(URL);
          const SVG2 = await fetch(url).then(function(response) {
            return response.text();
          });
          return SVG2;
        }
        function SVG(svgStr, color, size) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgStr, "image/svg+xml");
          const element = doc.documentElement;
          element.setAttribute("width", size);
          element.setAttribute("height", size);
          setSVGcolor(element, color);
          return element;
        }
        function getSetting(key) {
          return new Promise((resolve) => {
            chrome.storage.local.get(key, (res) => {
              resolve(res[key]);
            });
          });
        }
        if (await getSetting("ablEnabled") != true) {
          return;
        }
        async function applyTheme() {
          const theme = await getSetting("ablTheme") || { preset: "aero", hue: 200, sat: 95 };
          const root = document.documentElement;
          root.style.setProperty("--abl-hue", theme.hue);
          root.style.setProperty("--abl-sat", theme.sat + "%");
          if (theme.preset === "mono") {
            root.style.setProperty("--abl-toggle-off", "#3a3a3a");
            root.style.setProperty("--abl-toggle-on", "#cfcfcf");
            root.style.setProperty("--abl-rarity-valuable", "#ffffff");
            root.style.setProperty("--abl-rarity-legacy", "#9a9a9a");
            root.style.setProperty("--abl-rarity-nvl", "#4a4a4a");
          }
        }
        const NVL_list = await fetch(chrome.runtime.getURL("NVL.json")).then(function(response) {
          return response.json();
        });
        const NVL_set = new Set(NVL_list);
        const placeId = window.location.href.split("/")[4];
        const universeId = await fetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`, { credentials: "include" }).then(async function(response) {
          return (await response.json())[0].universeId;
        });
        const mainUserId = await fetch("https://users.roblox.com/v1/users/authenticated", { credentials: "include" }).then(async function(response) {
          return (await response.json()).id;
        });
        const refreshSVG = await getSVG("pngs/refresh.svg");
        const editSVG = await getSVG("pngs/edit.svg");
        const addSVG = await getSVG("pngs/add.svg");
        const crossSVG = await getSVG("pngs/cross.svg");
        const valueColors = {
          0: "#FFFFFF",
          1: "#00ff00",
          2: "#0080ff",
          3: "#ff1100"
        };
        const pageSize = 100;
        const filterTypes = {
          ownsBadge: {
            name: "User Owns Badge",
            layout: "User Owns Badge",
            allowMultiple: false,
            get: function(badge) {
              const ownershipChecker = getCurrentOwnershipChecker();
              return ownershipChecker.ownsBadge(badge.id);
            }
          },
          isValuable: {
            name: "Is Valuable",
            layout: "Is Valuable",
            allowMultiple: false,
            get: function(badge) {
              return badge.info.value == 1 || badge.info.value == 2;
            }
          },
          isLegacy: {
            name: "Is Legacy",
            layout: "Is Legacy",
            allowMultiple: false,
            get: function(badge) {
              return badge.info.value == 2 || badge.info.value == 3;
            }
          },
          /*isEnabled: {
              name: "Is Enabled",
              layout: "Is Enabled",
              get: function(badge) {
                  return badge.info.enabled == true;
              }
          },*/
          contains: {
            name: "Contains",
            inputs: {
              option: {
                type: "Dropdown",
                dropdownGroup: "Text",
                default: "Name"
              },
              str: {
                type: "Input",
                default: ""
              }
            },
            layout: "<option:Dropdown.Text>Contains<str:Input>",
            allowMultiple: true,
            get: function(badge, inputs) {
              const info = badge.info;
              const type = (inputs.option || "name").toLowerCase();
              const str = (inputs.str || "").toLowerCase();
              const name = info.name.toLowerCase();
              const desc = info.desc.toLowerCase();
              const nameIncludes = name.includes(str);
              const descIncludes = desc.includes(str);
              if (type == "name" && nameIncludes) {
                return true;
              }
              if (type == "description" && descIncludes) {
                return true;
              }
              if (type == "all" && (nameIncludes || descIncludes)) {
                return true;
              }
              return false;
            }
          },
          compareDate: {
            name: "Compare Date",
            inputs: {
              dateType: {
                type: "Dropdown",
                dropdownGroup: "CompareDateTypes",
                default: "Created"
              },
              operator: {
                type: "Dropdown",
                dropdownGroup: "CompareDateOperators",
                default: "After"
              },
              date: {
                type: "Input",
                default: ""
              }
            },
            layout: "<dateType:Dropdown.CompareDateTypes><operator:Dropdown.CompareDateOperators><date:Input>",
            allowMultiple: true,
            get: function(badge, inputs) {
              if (!inputs.date) return true;
              const targetTime = parseInputDate(inputs.date);
              if (targetTime == void 0) return true;
              const type = (inputs.dateType || "Created").toLowerCase();
              let badgeDate;
              if (type == "created") {
                badgeDate = badge.info.created;
              } else if (type == "updated") {
                badgeDate = badge.info.updated;
              } else if (type == "awarded") {
                const ownershipChecker = getCurrentOwnershipChecker();
                badgeDate = ownershipChecker.getAwardedDate(badge.id);
              }
              if (!badgeDate) return false;
              const badgeTime = new Date(badgeDate).getTime();
              if (Number.isNaN(badgeTime)) return false;
              const operator = (inputs.operator || "After").toLowerCase();
              function dateOnlyTime(time) {
                const d = new Date(time);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
              }
              const badgeDay = dateOnlyTime(badgeTime);
              const targetDay = dateOnlyTime(targetTime);
              if (operator == "after") {
                return badgeDay > targetDay;
              } else if (operator == "at") {
                return badgeDay == targetDay;
              } else if (operator == "before") {
                return badgeDay < targetDay;
              }
            }
          },
          compareNumber: {
            name: "Compare Number",
            inputs: {
              numberType: {
                type: "Dropdown",
                dropdownGroup: "CompareNumberTypes",
                default: "Awarded Total"
              },
              operator: {
                type: "Dropdown",
                dropdownGroup: "CompareNumberOperators",
                default: ">"
              },
              number: {
                type: "Input",
                default: ""
              }
            },
            layout: "<numberType:Dropdown.CompareNumberTypes><operator:Dropdown.CompareNumberOperators><number:Input>",
            allowMultiple: true,
            get: function(badge, inputs) {
              if (!inputs.number) return true;
              const target = Number(inputs.number);
              if (Number.isNaN(target)) return true;
              const type = (inputs.numberType || "Awarded Total").toLowerCase();
              let value;
              console.log(badge.info.rate);
              if (type == "awarded total") {
                value = badge.info.count;
              } else if (type == "awarded today") {
                value = badge.info.countToday;
              } else if (type == "rate") {
                value = badge.info.rate * 100;
              }
              if (value == void 0) return false;
              const operator = inputs.operator || ">";
              if (operator == ">") return value > target;
              if (operator == "=") return value == target;
              if (operator == "<") return value < target;
              return true;
            }
          }
        };
        const dropdownGroups = {
          Text: {
            options: [
              "Name",
              "Description",
              "All"
            ]
          },
          SortTypes: {
            options: [
              "Created",
              "Updated",
              "Awarded Total",
              "Awarded Today",
              "Award Date"
            ]
          },
          SortDirection: {
            options: [
              "Ascending",
              "Descending"
            ]
          },
          CompareDateTypes: {
            options: [
              "Created",
              "Updated",
              "Awarded"
            ]
          },
          CompareDateOperators: {
            options: [
              "After",
              "At",
              "Before"
            ]
          },
          CompareNumberTypes: {
            options: [
              "Awarded Total",
              "Awarded Today",
              "Rate"
            ]
          },
          CompareNumberOperators: {
            options: [
              ">",
              "=",
              "<"
            ]
          }
        };
        const shimmerDuration = 1;
        let viewingUserId = 0;
        let viewedUserOrder = [];
        let currentPage = 0;
        let loaded = false;
        let shimmerPosition = 0;
        const ablStyle = document.createElement("style");
        ablStyle.innerHTML = `
    :root {
        --abl-color-surface: rgb(11, 11, 14);
        --abl-hue: 200;
        --abl-sat: 95%;
        --abl-aero-border: hsl(var(--abl-hue) var(--abl-sat) 79% / 0.45);
        --abl-aero-border-bright: hsl(var(--abl-hue) var(--abl-sat) 89% / 0.85);
        --abl-aero-accent-dark: hsl(calc(var(--abl-hue) + 4) calc(var(--abl-sat) * 0.9) 18%);
        --abl-panel-tint: hsl(var(--abl-hue) var(--abl-sat) 56% / 0.14);
        --abl-icon-tint: hsl(var(--abl-hue) var(--abl-sat) 74% / 0.08);
        --abl-icon-border: hsl(var(--abl-hue) var(--abl-sat) 79% / 0.25);
        --abl-ghost-hover: hsl(var(--abl-hue) var(--abl-sat) 74% / 0.12);
        --abl-btn-top: hsl(var(--abl-hue) var(--abl-sat) 62%);
        --abl-btn-mid: hsl(var(--abl-hue) calc(var(--abl-sat) * 0.9) 36%);
        --abl-knob-mid: hsl(var(--abl-hue) calc(var(--abl-sat) * 0.3) 92%);
        --abl-knob-edge: hsl(var(--abl-hue) calc(var(--abl-sat) * 0.5) 84%);
        --abl-toggle-off: #b0362f;
        --abl-toggle-on: #2e9e46;
        --abl-rarity-valuable: #ffd700;
        --abl-rarity-legacy: #0080ff;
        --abl-rarity-nvl: #ff1100;
    }

    .abl-background {
        background:
            linear-gradient(to bottom, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 10%, rgba(255, 255, 255, 0) 32%),
            linear-gradient(to bottom, var(--abl-panel-tint), rgba(6, 10, 16, 0) 60%),
            var(--abl-color-surface);
        border: 1px solid var(--abl-aero-border);
        border-top-color: var(--abl-aero-border-bright);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 0 rgba(0, 0, 0, 0.5),
            0 2px 5px rgba(0, 0, 0, 0.45);
        border-radius: 0;
    }

    .abl-unowned {
        opacity: 0.45;
        border-color: rgba(20, 20, 20, 0.4);
    }

    .abl-button {
        padding: 5px 11px;
        background:
            linear-gradient(to bottom, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.12) 14%, rgba(255, 255, 255, 0) 50%),
            linear-gradient(to bottom, var(--abl-btn-top) 0%, var(--abl-btn-mid) 55%, var(--abl-aero-accent-dark) 100%);
        border: 1px solid var(--abl-aero-border-bright);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 1px 3px rgba(0, 0, 0, 0.5);
        color: #f2fdff;
        text-shadow: 0 1px 1px rgba(0, 20, 30, 0.6);
        border-radius: 0;
        transition: filter 0.12s ease, box-shadow 0.12s ease;
    }

    .abl-pad-sm {
        padding: 2px;
    }

    .abl-dropdown-option {
        background-color: var(--color-surface-0);
    }

    .abl-button:hover {
        filter: brightness(1.12);
    }

    .abl-button:active {
        background:
            linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0%, rgba(255, 255, 255, 0.08) 60%),
            linear-gradient(to bottom, var(--abl-btn-mid) 0%, var(--abl-btn-top) 100%);
        box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.6);
    }

    .abl-ghost-button {
        background: none;
        border: none;
        padding: 0px;
        border-radius: 0;
    }

    .abl-ghost-button:hover {
        background-color: var(--abl-ghost-hover);
    }

    .abl-icon {
        border-radius: 0;
        background-color: var(--abl-icon-tint);
        border: 1px solid var(--abl-icon-border);
        aspect-ratio: 1;
    }

    .abl-badge-icon {
        aspect-ratio: 1;
        padding: 4px;
    }

    .abl-icon--md {
        width: 30px;
        height: 30px;
    }

    .abl-icon--lg {
        width: 48px;
        height: 48px;
    }

    .abl-icon--full {
        height: 100%;
    }

    .abl--filter-option {
        height: 30px;
        width: 100%;
    }

    .abl--player-option {
        height: 32px;
        width: 100%;
    }

    .abl-bold-text {
        font-weight: bold;
    }

    .abl-filterTextInput::placeholder {
        opacity: 0.4;
    }

    .abl-notFilterCheck {
        width: 44px;
        height: 24px;
        margin-right: 10px;
        border-radius: 0;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 45%), var(--abl-toggle-off);
        border: 1px solid rgba(0, 0, 0, 0.4);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
        position: relative;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .abl-notFilterCheck.on {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 45%), var(--abl-toggle-on);
    }

    .abl-notFilterCheck-knob {
        width: 20px;
        height: 20px;
        background: linear-gradient(to bottom, #ffffff 0%, var(--abl-knob-mid) 45%, var(--abl-knob-edge) 55%, #ffffff 100%);
        border: 1px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        border-radius: 0;
        position: absolute;
        top: 1px;
        left: 2px;
        transition: left 0.2s ease;
    }

    .abl-notFilterCheck.on .abl-notFilterCheck-knob {
        left: 22px;
    }

    .abl-shimmering {
        background: linear-gradient(-45deg, rgba(128, 128, 128, 0) 30%, rgba(128, 128, 128, 0.3) 50%, rgba(128, 128, 128, 0) 70%);
        animation: abl-shimmering-anim 1s linear infinite;
        background-size: 300%;
    }

    @keyframes abl-shimmering-anim {
        from {
            background-position-x: 0%;
        }
        to {
            background-position-x: 100%;
        }
    }

    .abl-container {
        display: flex;
        gap: 8px;
    }

    .abl-gap-sm {
        gap: 2px;
    }

    .abl-gap-md {
        gap: 5px;
    }

    .abl-container.abl-row {
        flex-direction: row;
        align-items: center;
    }

    .abl-container.abl-column {
        flex-direction: column;
    }

    .abl-container-list {
        display: flex;
        flex-direction: column;
    }

    .abl-big-dropdown {
        position: absolute;
        width: 200px;
        height: 300px;
        padding: 5px;
        overflow-x: hidden;
        overflow-y: auto;
        z-index: 1;
    }

    .abl-container-badge-stats {
        display: grid;
        grid-template-rows: repeat(3, 1fr);
    }

    .abl-container-badge-item {
        padding: 10px;
        height: 120px;
    }

    .abl-container-badge-content {
        overflow: hidden;
        flex: 1;
    }

    .abl-container-stat {
        justify-content: right;
    }

    .abl-page-display {
        font-size: 25px;
    }

    .abl-centered {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .abl-value-border {
        border: 3px solid #FFFFFF;
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
    }

    .abl-value-border.valuable {
        border-color: var(--abl-rarity-valuable);
        box-shadow: 0 0 6px color-mix(in srgb, var(--abl-rarity-valuable) 50%, transparent);
    }

    .abl-value-border.legacy {
        border-color: var(--abl-rarity-legacy);
        box-shadow: 0 0 6px color-mix(in srgb, var(--abl-rarity-legacy) 50%, transparent);
    }

    .abl-value-border.nvl {
        border-color: var(--abl-rarity-nvl);
        box-shadow: 0 0 6px color-mix(in srgb, var(--abl-rarity-nvl) 50%, transparent);
    }

    #abl-filter-options-list {
        padding: 6px 8px;
        align-self: flex-start;
        height: fit-content;
        flex-shrink: 0;
    }

    .abl-badge-hover {
        position: fixed;
        display: none;
        z-index: 99999999;
        padding: 10px 12px;
        min-width: 210px;
        pointer-events: none;
        font-size: 12px;
        line-height: 1.35;

        background:
            linear-gradient(to bottom, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.03) 18%, rgba(255, 255, 255, 0) 40%),
            rgba(8, 12, 18, 0.94);
        border: 1px solid var(--abl-aero-border);
        border-top-color: var(--abl-aero-border-bright);
        border-radius: 0;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 14px rgba(0, 0, 0, 0.5);
    }

    .abl-badge-hover-row {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 4px;
    }

    .abl-badge-hover-row:last-child {
        margin-bottom: 0;
    }
    
    .abl-badge-hover-label {
        opacity: 0.75;
    }

    .abl-badge-hover-value {
        font-weight: bold;
    };
    `;
        document.head.appendChild(ablStyle);
        await applyTheme();
        function createBasicDropdown(dropdownGroup, id) {
          return /* @__PURE__ */ createElement("select", { class: "abl-background abl-pad-sm", id }, dropdownGroup.options.map((item, index) => /* @__PURE__ */ createElement("option", { key: index, value: item, class: "abl-dropdown-option" }, item)));
        }
        function createBadgeListUI() {
          return /* @__PURE__ */ createElement("div", { class: "abl-container abl-column" }, /* @__PURE__ */ createElement("div", { class: "abl-container abl-row", id: "abl-header-container" }, /* @__PURE__ */ createElement("h2", null, "Badges"), /* @__PURE__ */ createElement("button", { class: "abl-background abl-button", id: "abl-load" }, "Load")), /* @__PURE__ */ createElement("div", { class: "abl-container abl-row", id: "abl-ownership-container" }, /* @__PURE__ */ createElement("img", { src: "", alt: "", class: "abl-icon abl-icon--lg", id: "abl-viewing-img" }), /* @__PURE__ */ createElement("p", { id: "abl-viewing-user" }, "Username"), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("button", { id: "abl-ownerEditBtn", class: "abl-ghost-button abl-centered abl-icon--md" }, SVG(editSVG, "var(--color-content-default)", 24)), /* @__PURE__ */ createElement("div", { class: "abl-background abl-container-list abl-big-dropdown abl-gap-sm", id: "abl-ownerEditDropdown", style: "display: none;" }, /* @__PURE__ */ createElement("input", { type: "text", id: "abl-ownerEditDropdownSearch", class: "abl-background abl-pad-sm", placeholder: "Add username" }), /* @__PURE__ */ createElement("div", { id: "abl-ownerEditDropdownList", class: "abl-container abl-column abl-gap-sm" }))), /* @__PURE__ */ createElement("button", { id: "abl-ownerRefreshBtn", class: "abl-ghost-button abl-centered abl-icon--md" }, SVG(refreshSVG, "var(--color-content-default)", 24)), /* @__PURE__ */ createElement("p", { id: "abl-ownedRemaining" }), /* @__PURE__ */ createElement("p", { class: "", id: "abl-cloudKeyWarning", style: "display: none;" }, "\u26A0 Add a Cloud Key in ABL Settings to fetch more badges at once.")), /* @__PURE__ */ createElement("div", { class: "abl-container abl-column", id: "abl-filters-container" }, /* @__PURE__ */ createElement("h4", { id: "abl-filters-title" }, "Filters"), /* @__PURE__ */ createElement("div", { class: "abl-container" }, /* @__PURE__ */ createElement("div", { id: "abl-filter-options-list", class: "abl-container-list abl-background" }), /* @__PURE__ */ createElement("div", { id: "abl-filter-list", class: "abl-container-list" })), /* @__PURE__ */ createElement("div", { class: "abl-container abl-row" }, /* @__PURE__ */ createElement("p", null, "Sort by"), createBasicDropdown(dropdownGroups.SortTypes, "abl-sortType"), createBasicDropdown(dropdownGroups.SortDirection, "abl-sortDirection"))), /* @__PURE__ */ createElement("div", { id: "abl-status-container" }, /* @__PURE__ */ createElement("p", { id: "abl-status" }, "Status")), /* @__PURE__ */ createElement("div", { class: "abl-container abl-row abl-centered", id: "abl-pages-container" }, /* @__PURE__ */ createElement("button", { class: "abl-background abl-button", id: "abl-previousPage" }, "<"), /* @__PURE__ */ createElement("h2", { class: "abl-page-display", id: "abl-pageDisplay" }, "0"), /* @__PURE__ */ createElement("button", { class: "abl-background abl-button", id: "abl-nextPage" }, ">")), /* @__PURE__ */ createElement("ul", { class: "abl-container abl-column", id: "abl-list" }), /* @__PURE__ */ createElement("div", { class: "abl-centered", id: "abl-bottom-container" }, /* @__PURE__ */ createElement("button", { class: "abl-background abl-button", id: "abl-toTop" }, "Back to Top")));
        }
        async function insertBadgeListUI(mainContainer) {
          const badgeContainer = await waitForSelector(".game-badges-list");
          badgeContainer.after(mainContainer);
          badgeContainer.remove();
        }
        function setShimmering(badgeItem, bool) {
          if (bool) {
            if (!badgeItem.classList.contains("abl-shimmering")) {
              const delay = shimmerDuration * shimmerPosition;
              badgeItem.classList.add("abl-shimmering");
              badgeItem.style.animationDelay = `-${delay}s`;
            }
          } else {
            badgeItem.classList.remove("abl-shimmering");
          }
        }
        function createStatTemplate(title, text) {
          return /* @__PURE__ */ createElement("div", { class: "abl-container abl-row abl-container-stat" }, /* @__PURE__ */ createElement("p", null, title), /* @__PURE__ */ createElement("p", { class: "abl-bold-text" }, text));
        }
        ;
        const americanDates = await getSetting("americanDates");
        function formatBadgeDate(date) {
          if (!date) return "-";
          const d = new Date(date);
          if (Number.isNaN(d.getTime())) return "Unknown";
          const offsetHours = -(/* @__PURE__ */ new Date()).getTimezoneOffset() / 60;
          const pad = (n) => String(n).padStart(2, "0");
          const day = pad(d.getDate());
          const month = pad(d.getMonth() + 1);
          const year = d.getFullYear();
          const datePart = americanDates ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
          const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
          const utcPart = `UTC${offsetHours >= 0 ? "+" + offsetHours : offsetHours}`;
          return `${datePart} ${timePart} ${utcPart}`;
        }
        function parseInputDate(str) {
          if (!str) return void 0;
          const match = str.trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
          if (!match) return void 0;
          const a = Number(match[1]);
          const b = Number(match[2]);
          const year = Number(match[3]);
          if (!a || !b || !year) return void 0;
          const day = americanDates ? b : a;
          const month = americanDates ? a : b;
          const d = new Date(year, month - 1, day);
          if (Number.isNaN(d.getTime())) return void 0;
          return d.getTime();
        }
        const badgeHover = document.createElement("div");
        badgeHover.className = "abl-background abl-badge-hover";
        document.body.appendChild(badgeHover);
        function createHoverRow(label, value) {
          const row = document.createElement("div");
          row.className = "abl-badge-hover-row";
          const labelA = document.createElement("span");
          labelA.className = "abl-badge-hover-label";
          labelA.textContent = label;
          const labelB = document.createElement("span");
          labelB.className = "abl-badge-hover-value";
          labelB.textContent = value;
          row.append(labelA, labelB);
          return row;
        }
        function showBadgeHover(event, badge, awardedDate) {
          badgeHover.replaceChildren(
            createHoverRow("Created", formatBadgeDate(badge.created)),
            createHoverRow("Updated", formatBadgeDate(badge.updated)),
            createHoverRow("Awarded", formatBadgeDate(awardedDate))
          );
          badgeHover.style.display = "block";
          moveBadgeHover(event);
        }
        function moveBadgeHover(event) {
          badgeHover.style.left = `${event.clientX + 14}px`;
          badgeHover.style.top = `${event.clientY + 14}px`;
        }
        function hideBadgeHover() {
          badgeHover.style.display = "none";
        }
        function createBadgeTemplate(id, value, imageSource, nameTxt, descTxt, awardedTotal, awardedToday, rate, active, owned) {
          const badgeURL = `https://www.roblox.com/badges/${id}/BADGE`;
          const valueName = value == 1 ? "valuable" : value == 2 ? "legacy" : value == 3 ? "nvl" : "free";
          const item = /* @__PURE__ */ createElement("li", { className: `abl-background abl-container abl-container-badge-item ${!owned ? "abl-unowned" : ""}` }, /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("a", { href: badgeURL }, /* @__PURE__ */ createElement("img", { src: imageSource, alt: "", className: `abl-badge-icon abl-icon--full ${value > 0 ? `abl-value-border ${valueName}` : ""}` }))), /* @__PURE__ */ createElement("div", { class: "abl-container-badge-content" }, /* @__PURE__ */ createElement("p", { class: "abl-bold-text" }, nameTxt), /* @__PURE__ */ createElement("p", null, descTxt)), /* @__PURE__ */ createElement("ul", { class: "abl-container-badge-stats" }, createStatTemplate("Awarded Total", awardedTotal), createStatTemplate("Awarded Today", awardedToday), createStatTemplate("Rate", Math.round(rate * 1e3) / 10 + "%")));
          if (owned == void 0) {
            setShimmering(item, true);
          }
          return item;
        }
        function createFilterOption(text) {
          return /* @__PURE__ */ createElement("button", { class: "abl-ghost-button abl--filter-option" }, text);
        }
        function createRespectiveFilterInput(type) {
          const splitB = type.split(".");
          const inputType = splitB[0];
          if (inputType == "Dropdown") {
            const groupName = splitB[1];
            const dropdown = createBasicDropdown(dropdownGroups[groupName]);
            return dropdown;
          } else if (inputType == "Input") {
            const input = document.createElement("input");
            input.classList = "abl-background abl-filterTextInput";
            input.placeholder = "Input here";
            input.autocomplete = "off";
            input.style.padding = "2px";
            return input;
          }
        }
        function createFilterBlock(layout) {
          const div = document.createElement("div");
          div.style.display = "flex";
          div.style.alignItems = "center";
          div.style.marginBottom = "5px";
          const notCheck = document.createElement("div");
          notCheck.className = "abl-notFilterCheck";
          notCheck.innerHTML = `<div class="abl-notFilterCheck-knob"></div>`;
          const regex = /(<[^>]+>)/;
          const tokens = layout.split(regex).filter(Boolean);
          const layoutDiv = document.createElement("div");
          layoutDiv.classList = "abl-container abl-row abl-gap-md";
          for (const token of tokens) {
            if (token[0] == "<") {
              const def = token.slice(1, -1);
              const splitA = def.split(":");
              const inputName = splitA[0];
              const inputType = splitA[1];
              const element = createRespectiveFilterInput(inputType);
              element.name = inputName;
              element.classList.add("abl-filterInput");
              layoutDiv.appendChild(element);
            } else {
              const text = document.createElement("p");
              text.textContent = token;
              layoutDiv.appendChild(text);
            }
          }
          const deleteBtn = /* @__PURE__ */ createElement("button", { class: "abl-ghost-button abl-centered abl-icon--md abl-deleteFilterBtn" }, SVG(crossSVG, "var(--color-content-emphasis)", 18));
          div.appendChild(notCheck);
          div.appendChild(layoutDiv);
          div.appendChild(deleteBtn);
          return div;
        }
        function createOwnerEditOption(imageUrl, username) {
          return /* @__PURE__ */ createElement("button", { class: "abl-ghost-button abl-container abl-row abl--player-option" }, /* @__PURE__ */ createElement("img", { src: imageUrl, alt: "", class: "abl-icon abl-icon--full" }), /* @__PURE__ */ createElement("p", null, username));
        }
        class ValueChecker {
          constructor() {
            this.currentDate = null;
            this.dateRepeated = 0;
          }
          nextBadge(id, created) {
            let value = 0;
            const date = new Date(created);
            const legacyDate = /* @__PURE__ */ new Date("2022-02-24");
            const year = date.getUTCFullYear();
            const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
            const day = ("0" + date.getUTCDate()).slice(-2);
            const finalDate = year + "-" + month + "-" + day;
            if (this.currentDate == null || this.currentDate != finalDate) {
              this.currentDate = finalDate;
              this.dateRepeated = 1;
            } else {
              this.dateRepeated++;
            }
            ;
            if (NVL_set.has(id)) {
              value = 3;
            } else if (date < legacyDate) {
              value = 2;
            } else if (this.dateRepeated > 5) {
              value = 1;
            }
            ;
            return value;
          }
        }
        class BadgeIconManager {
          constructor() {
            this.iconImageURLs = /* @__PURE__ */ new Map();
          }
          getIconURL(iconId) {
            return this.iconImageURLs.get(iconId);
          }
          async processBatch(iconIds) {
            const response = await fetchAssetThumbnails(iconIds);
            for (const thumbnail of response) {
              this.iconImageURLs.set(thumbnail.targetId, thumbnail.imageUrl);
            }
            return response;
          }
        }
        class BadgeList {
          constructor(universeId2) {
            this.universeId = universeId2;
            this.currentCursor = "";
            this.badgeInfo = /* @__PURE__ */ new Map();
            this.list = [];
            this.valueChecker = new ValueChecker();
          }
          getBadgeInfo(badgeId) {
            return this.badgeInfo.get(badgeId);
          }
          getSize() {
            return this.list.length;
          }
          isFinished() {
            return this.currentCursor == null;
          }
          async next() {
            if (this.currentCursor == null) {
              return;
            }
            const URL = `https://badges.roblox.com/v1/universes/${this.universeId}/badges?limit=100&sortBy=DateCreated&sortOrder=Asc&cursor=${this.currentCursor}`;
            const response = await retry(async function() {
              return await fetch(URL).then(async function(response2) {
                const json = await response2.json();
                if (json.errors) {
                  throw new Error("Cursor pagination encountered an error");
                }
                return json;
              });
            }, 1e3);
            let result = /* @__PURE__ */ new Map();
            for (const badge of response.data) {
              this.list.push(badge.id);
              const info = {
                enabled: badge.enabled,
                name: badge.name,
                desc: badge.description || "",
                created: badge.created,
                updated: badge.updated,
                value: this.valueChecker.nextBadge(badge.id, badge.created),
                count: badge.statistics.awardedCount,
                countToday: badge.statistics.pastDayAwardedCount,
                rate: badge.statistics.winRatePercentage,
                iconId: badge.iconImageId
              };
              this.badgeInfo.set(badge.id, info);
              result.set(badge.id, info);
            }
            this.currentCursor = response.nextPageCursor;
            return result;
          }
        }
        function sortBadgeListArray(array, badgeList2, keyName, sortDirection2) {
          array.sort(function(a, b) {
            let resultA = badgeList2.getBadgeInfo(a)[keyName];
            let resultB = badgeList2.getBadgeInfo(b)[keyName];
            if (keyName == "created" || keyName == "updated") {
              resultA = Date.parse(resultA);
              resultB = Date.parse(resultB);
            }
            ;
            return sortDirection2 == "ascending" ? resultA - resultB : resultB - resultA;
          });
        }
        class FilteredBadgeList extends BadgeList {
          constructor(universeId2) {
            super(universeId2);
            this.filteredList = [];
            this.nextFilterId = 0;
            this.filters = /* @__PURE__ */ new Map();
            this.sortType = "created";
            this.sortDirection = "ascending";
            this.onFilterListChanged = new Signal();
          }
          filterBadge(badge) {
            for (const filter of this.filters.values()) {
              const info = filterTypes[filter.type];
              const result = info.get(badge, filter.inputs);
              if (result == void 0) {
                return false;
              }
              const finalResult = filter.NOT ? !result : result;
              if (!finalResult) {
                return false;
              }
            }
            return true;
          }
          sortBadgeList(type, sortDirection2) {
            const keys = {
              "awarded total": "count",
              "awarded today": "countToday",
              "created": "created",
              "updated": "updated",
              "award date": "award date"
            };
            const keyName = keys[type];
            if (keyName) {
              this.filteredList.sort((a, b) => {
                let resultA;
                let resultB;
                if (keyName == "award date") {
                  const nullifyDate = sortDirection2 == "ascending" ? "+275760-09-13T00:00:00.000Z" : "1970-01-01T00:00:00.000Z";
                  resultA = Date.parse(getCurrentOwnershipChecker().getAwardedDate(a) || nullifyDate);
                  resultB = Date.parse(getCurrentOwnershipChecker().getAwardedDate(b) || nullifyDate);
                } else {
                  resultA = this.getBadgeInfo(a)[keyName];
                  resultB = this.getBadgeInfo(b)[keyName];
                }
                if (keyName == "created" || keyName == "updated") {
                  resultA = Date.parse(resultA);
                  resultB = Date.parse(resultB);
                }
                ;
                return sortDirection2 == "ascending" ? resultA - resultB : resultB - resultA;
              });
            }
          }
          refilterBadgeList() {
            if (this.filters.size == 0) {
              if (this.sortType == "created" && this.sortDirection == "ascending") {
                this.filteredList = this.list;
              } else {
                this.filteredList = this.list.slice();
                this.sortBadgeList(this.sortType, this.sortDirection);
              }
              this.onFilterListChanged.emit();
              return;
            }
            let newList = [];
            for (const id of this.list) {
              const info = this.getBadgeInfo(id);
              const result = this.filterBadge({ id, info });
              if (result == true) {
                newList.push(id);
              }
            }
            this.filteredList = newList;
            this.sortBadgeList(this.sortType, this.sortDirection);
            this.onFilterListChanged.emit();
          }
          setSort(type, dir) {
            this.sortType = type.toLowerCase();
            this.sortDirection = dir.toLowerCase();
            if (this.filters.size == 0) {
              this.filteredList = this.list.slice();
            }
            this.sortBadgeList(this.sortType, this.sortDirection);
            this.onFilterListChanged.emit();
          }
          addFilter(type) {
            const info = filterTypes[type];
            if (!info) {
              return;
            }
            if (!info.allowMultiple) {
              for (const id of this.filters.keys()) {
                const filter = this.filters.get(id);
                if (filter.type == type) {
                  return id;
                }
              }
            }
            const filterId = this.nextFilterId++;
            let inputs = {};
            for (const inputName in info.inputs) {
              const inputInfo = info.inputs[inputName];
              inputs[inputName] = inputInfo.default;
            }
            this.filters.set(filterId, {
              type,
              NOT: false,
              inputs
            });
            this.refilterBadgeList();
            return filterId;
          }
          deleteFilter(id) {
            this.filters.delete(id);
            this.refilterBadgeList();
          }
          setNOT(id, bool) {
            const filter = this.filters.get(id);
            if (filter) {
              filter.NOT = bool;
              this.filters.set(id, filter);
              this.refilterBadgeList();
            }
          }
          setInput(id, inputName, value) {
            const filter = this.filters.get(id);
            if (filter) {
              filter.inputs[inputName] = value;
              this.filters.set(id, filter);
              this.refilterBadgeList();
            }
            ;
          }
          async next() {
            const response = await super.next();
            this.refilterBadgeList();
            return response;
          }
        }
        class ImpossibleResultError extends Error {
          constructor(message) {
            super(message);
            this.name = "ImpossibleResultError";
          }
        }
        class OwnershipChecker {
          constructor(userId, badgeListArray, cloudKeyRotary2) {
            this.userId = userId;
            this.badgeList = badgeListArray;
            this.cloudKeyRotary = cloudKeyRotary2;
            this.currentIndex = 0;
            this.ownedBadges = /* @__PURE__ */ new Set();
            this.unownedBadges = /* @__PURE__ */ new Set();
            this.awardedDates = /* @__PURE__ */ new Map();
          }
          static onProcessed = new Signal();
          reset() {
            this.unownedBadges.clear();
            this.currentIndex = 0;
          }
          ownsBadge(badgeId) {
            if (this.ownedBadges.has(badgeId)) {
              return true;
            } else if (this.unownedBadges.has(badgeId)) {
              return false;
            } else {
              return void 0;
            }
            ;
          }
          getAwardedDate(badgeId) {
            return this.awardedDates.get(badgeId);
          }
          getRemainingBadges() {
            return this.badgeList.length - this.ownedBadges.size - this.unownedBadges.size;
          }
          isEnd() {
            return this.getRemainingBadges() == 0;
          }
          async next() {
            let batch = [];
            let index = this.currentIndex;
            while (batch.length < 100 && index < this.badgeList.length) {
              const nextId = this.badgeList[index++];
              if (!this.ownedBadges.has(nextId)) {
                batch.push(nextId);
              }
            }
            if (batch.length == 0) return false;
            this.currentIndex = index;
            const key = cloudKeyRotary.get();
            if (key) {
              const response = await fetchOwnershipByCloudKey(this.userId, batch, key);
              if (response instanceof ImpossibleResultError) {
                return response;
              }
              for (const badge of response) {
                const badgeId = Number(badge.badgeDetails.badgeId);
                this.ownedBadges.add(badgeId);
                this.awardedDates.set(badgeId, badge.addTime);
              }
            } else {
              const response = await fetchOwnership(this.userId, batch);
              for (const badge of response) {
                this.ownedBadges.add(badge.badgeId);
                this.awardedDates.set(badge.badgeId, badge.awardedDate);
              }
            }
            for (const badgeId of batch) {
              if (!this.ownedBadges.has(badgeId)) {
                this.unownedBadges.add(badgeId);
              }
            }
            OwnershipChecker.onProcessed.emit(this.userId);
            return true;
          }
        }
        ;
        class CentralOwnershipChecker {
          constructor(badgeListArray, cloudKeyRotary2) {
            this.badgeList = badgeListArray;
            this.cloudKeyRotary = cloudKeyRotary2;
            this.ownershipCheckers = /* @__PURE__ */ new Map();
          }
          get(userId) {
            const current = this.ownershipCheckers.get(userId);
            if (current) {
              return current;
            } else {
              const newChecker = new OwnershipChecker(userId, this.badgeList, this.cloudKeyRotary);
              this.ownershipCheckers.set(userId, newChecker);
              return newChecker;
            }
          }
        }
        class CloudKeyRotary {
          constructor(cloudKeys2) {
            this.cloudKeys = [];
            this.currentIndex = 0;
            for (const cloudKey of cloudKeys2) {
              if (cloudKey != "") {
                this.cloudKeys.push(cloudKey);
              }
            }
          }
          get() {
            if (this.cloudKeys.length == 0) {
              return void 0;
            }
            const nextKey = this.cloudKeys[this.currentIndex++];
            if (this.currentIndex >= this.cloudKeys.length) {
              this.currentIndex = 0;
            }
            return nextKey;
          }
        }
        class UserInformation {
          constructor() {
            this.info = /* @__PURE__ */ new Map();
            this.usernames = /* @__PURE__ */ new Map();
          }
          async getInfoByUserId(userId) {
            const cacheResponse = this.info.get(userId);
            if (cacheResponse) {
              return cacheResponse;
            }
            const username = await fetch(`https://users.roblox.com/v1/users/${userId}`).then(async function(response) {
              return response.json();
            }).then(function(data2) {
              if (data2.errors) {
                return void 0;
              } else {
                return data2.name;
              }
            });
            if (username == void 0) {
              return void 0;
            }
            const imageURL = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png&isCircular=false`).then(async function(response) {
              return (await response.json()).data[0].imageUrl;
            });
            const data = {
              id: userId,
              name: username,
              imageURL
            };
            this.info.set(userId, data);
            this.usernames.set(username, userId);
            return data;
          }
          async getInfoByUsername(username) {
            const cacheUserId = this.usernames.get(username);
            if (cacheUserId) {
              return this.info.get(cacheUserId);
            }
            const body = JSON.stringify({
              "usernames": [username]
            });
            const infoResponse = await fetch("https://users.roblox.com/v1/usernames/users", { body, method: "POST" }).then(function(response) {
              return response.json();
            }).then(function(data2) {
              if (data2.data.length == 0) {
                return void 0;
              } else {
                return data2.data[0];
              }
            });
            if (infoResponse == void 0) {
              return void 0;
            }
            const userId = infoResponse.id;
            const imageURL = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png&isCircular=false`).then(async function(response) {
              return (await response.json()).data[0].imageUrl;
            });
            const data = {
              id: userId,
              name: infoResponse.name,
              imageURL
            };
            this.info.set(userId, data);
            this.usernames.set(username, userId);
            return data;
          }
        }
        async function fetchAssetThumbnails(assetIds) {
          const URL = `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
          const response = await retry(async function() {
            return await fetch(URL).then(function(response2) {
              return response2.json();
            }).then(function(data) {
              return data.data;
            });
          }, 500);
          return response;
        }
        async function fetchOwnership(userId, badgeIds) {
          const URL = `https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${badgeIds}`;
          const response = await retry(async function() {
            return await fetch(URL, { credentials: "include" }).then(function(response2) {
              return response2.json();
            }).then(function(data) {
              return data.data;
            });
          }, 1500);
          return response;
        }
        async function fetchOwnershipByCloudKey(userId, badgeIds, cloudKey) {
          const URL = `https://apis.roblox.com/cloud/v2/users/${userId}/inventory-items?maxPageSize=100&filter=badgeIds=${badgeIds}`;
          const response = await retry(async function() {
            return await fetch(URL, { headers: { "x-api-key": cloudKey } }).then(function(response2) {
              return response2.json();
            }).then(function(data) {
              const code = data.code;
              const errors = data.errors;
              if (code == "FAILED_PRECONDITION") {
                throw new ImpossibleResultError("User is banned.");
              } else if (code == "PERMISSION_DENIED") {
                throw new ImpossibleResultError("User's inventory is off.");
              } else if (errors && errors[0].code == 0) {
                throw new ImpossibleResultError("Invalid cloud key.");
              }
              ;
              return data.inventoryItems;
            });
          }, 1500);
          return response;
        }
        const ABLContainer = createBadgeListUI();
        const loadButton = ABLContainer.querySelector("#abl-load");
        const ownerRefreshBtn = ABLContainer.querySelector("#abl-ownerRefreshBtn");
        const ownerEditBtn = ABLContainer.querySelector("#abl-ownerEditBtn");
        const nextPageBtn = ABLContainer.querySelector("#abl-nextPage");
        const previousPageBtn = ABLContainer.querySelector("#abl-previousPage");
        const toTop = ABLContainer.querySelector("#abl-toTop");
        const addFilterBtn = ABLContainer.querySelector("#abl-addFilter");
        const ownerInput = ABLContainer.querySelector("#abl-owner-input");
        const ownerEditSearch = ABLContainer.querySelector("#abl-ownerEditDropdownSearch");
        const sortType = ABLContainer.querySelector("#abl-sortType");
        const sortDirection = ABLContainer.querySelector("#abl-sortDirection");
        const badgeListPage = ABLContainer.querySelector("#abl-list");
        const pagesDiv = ABLContainer.querySelector("#abl-pagesDiv");
        const viewingImg = ABLContainer.querySelector("#abl-viewing-img");
        const ownedRemaining = ABLContainer.querySelector("#abl-ownedRemaining");
        const cloudKeyWarning = ABLContainer.querySelector("#abl-cloudKeyWarning");
        const viewingUsername = ABLContainer.querySelector("#abl-viewing-user");
        const mainStatus = ABLContainer.querySelector("#abl-status");
        const pageDisplay = ABLContainer.querySelector("#abl-pageDisplay");
        const filterOptionsList = ABLContainer.querySelector("#abl-filter-options-list");
        const filterList = ABLContainer.querySelector("#abl-filter-list");
        const ownerEditDropdown = ABLContainer.querySelector("#abl-ownerEditDropdown");
        const ownerEditDropdownList = ABLContainer.querySelector("#abl-ownerEditDropdownList");
        const renderedBadgeNodes = /* @__PURE__ */ new Map();
        const renderedBadgeImages = /* @__PURE__ */ new Map();
        await insertBadgeListUI(ABLContainer);
        const cloudKeys = await getSetting("ablCloudKeys");
        const hideCloudKeyWarning = await getSetting("ablShutUpKeyWarning");
        const hasCloudKey = Array.isArray(cloudKeys) && cloudKeys.some((k) => String(k).trim());
        if (!hasCloudKey && !hideCloudKeyWarning) {
          cloudKeyWarning.style.display = "";
        }
        const cloudKeyRotary = new CloudKeyRotary(cloudKeys);
        const badgeIconManager = new BadgeIconManager();
        const badgeList = new FilteredBadgeList(universeId);
        const ownershipCheckers = new CentralOwnershipChecker(badgeList.list, cloudKeyRotary);
        const userInfo = new UserInformation();
        function getCurrentOwnershipChecker() {
          return ownershipCheckers.get(viewingUserId);
        }
        function usesOwnershipFilter() {
          for (const filter of badgeList.filters.values()) {
            if (filter.type == "ownsBadge") {
              return true;
            }
          }
          return false;
        }
        let refreshQueued = false;
        function queueRefreshPage() {
          if (refreshQueued) return;
          refreshQueued = true;
          requestAnimationFrame(function() {
            refreshQueued = false;
            refreshPage();
          });
        }
        function refreshFilterList() {
          filterList.innerHTML = "";
          for (const [id, filter] of badgeList.filters) {
            const info = filterTypes[filter.type];
            const element = createFilterBlock(info.layout);
            const deleteBtn = element.querySelector(".abl-deleteFilterBtn");
            const notCheck = element.querySelector(".abl-notFilterCheck");
            const inputs = element.querySelectorAll(".abl-filterInput");
            notCheck.classList.toggle("on", !filter.NOT);
            deleteBtn.onclick = function() {
              badgeList.deleteFilter(id);
              element.remove();
            };
            notCheck.onclick = function() {
              const isOn = notCheck.classList.toggle("on");
              badgeList.setNOT(id, !isOn);
            };
            for (const input of inputs) {
              const name = input.name;
              const inputValue = filter.inputs[name];
              if (inputValue) {
                input.value = inputValue;
              }
              input.addEventListener("input", function() {
                badgeList.setInput(id, name, input.value);
              });
            }
            filterList.appendChild(element);
          }
        }
        function addFilterOptionClicked(type) {
          const filterId = badgeList.addFilter(type);
          badgeList.setNOT(filterId, false);
          refreshFilterList();
        }
        function addFilterOptionRightClicked(type) {
          const filterId = badgeList.addFilter(type);
          badgeList.setNOT(filterId, true);
          refreshFilterList();
        }
        for (const type in filterTypes) {
          const info = filterTypes[type];
          const element = createFilterOption(info.name);
          element.onclick = function() {
            addFilterOptionClicked(type);
          };
          element.oncontextmenu = function(event) {
            event.preventDefault();
            addFilterOptionRightClicked(type);
          };
          filterOptionsList.appendChild(element);
        }
        function refreshListStatus() {
          if (!loaded) {
            mainStatus.textContent = "";
          } else if (badgeList.isFinished()) {
            mainStatus.textContent = `Showing ${badgeList.filteredList.length} of ${badgeList.list.length} (${Math.round(badgeList.filteredList.length / badgeList.list.length * 100)}%)`;
          } else {
            mainStatus.textContent = `Showing ${badgeList.filteredList.length} of ${badgeList.list.length} (Getting Badges)`;
          }
        }
        function onOwnerEditOptionClicked(userId) {
          closeOwnerEditDropdown();
          viewUser(userId);
        }
        async function refreshOwnerEditOptions() {
          ownerEditDropdownList.innerHTML = "";
          let userOrder = [mainUserId];
          for (let i = viewedUserOrder.length - 1; i >= 0; i--) {
            const id = viewedUserOrder[i];
            if (id != mainUserId) {
              userOrder.push(id);
            }
          }
          for (const userId of userOrder) {
            const info = await userInfo.getInfoByUserId(userId);
            const option = createOwnerEditOption(info.imageURL, info.name);
            option.onclick = function() {
              onOwnerEditOptionClicked(userId);
            };
            ownerEditDropdownList.appendChild(option);
          }
        }
        function openOwnerEditDropdown() {
          refreshOwnerEditOptions();
          ownerEditDropdown.style.display = "";
        }
        function closeOwnerEditDropdown() {
          ownerEditDropdown.style.display = "none";
        }
        async function refreshList() {
          renderedBadgeNodes.clear();
          renderedBadgeImages.clear();
          const fragment = document.createDocumentFragment();
          const minIndex = currentPage * pageSize;
          const maxIndex = (currentPage + 1) * pageSize - 1;
          const ownershipChecker = getCurrentOwnershipChecker();
          for (let i = minIndex; i <= maxIndex; i++) {
            const badgeId = badgeList.filteredList[i];
            if (!badgeId) {
              break;
            }
            const badge = badgeList.getBadgeInfo(badgeId);
            const template = createBadgeTemplate(badgeId, badge.value, badgeIconManager.getIconURL(badge.iconId), badge.name, badge.desc, badge.count, badge.countToday, badge.rate, badge.enabled, ownershipChecker.ownsBadge(badgeId));
            template.addEventListener("mouseenter", function(event) {
              const currentChecker = getCurrentOwnershipChecker();
              showBadgeHover(event, badge, currentChecker.getAwardedDate(badgeId));
            });
            template.addEventListener("mousemove", moveBadgeHover);
            template.addEventListener("mouseleave", hideBadgeHover);
            renderedBadgeNodes.set(badgeId, template);
            template.dataset.owned = ownershipChecker.ownsBadge(badgeId) === true ? "1" : "0";
            const img = template.querySelector("img");
            renderedBadgeImages.set(badge.iconId, img);
            fragment.appendChild(template);
          }
          ;
          badgeListPage.replaceChildren(fragment);
          refreshListStatus();
        }
        function updateVisibleOwnership() {
          const ownershipChecker = getCurrentOwnershipChecker();
          for (const [badgeId, node] of renderedBadgeNodes) {
            const owned = ownershipChecker.ownsBadge(badgeId);
            const state = owned === true ? "1" : owned === false ? "0" : "-1";
            if (owned == void 0) {
              setShimmering(node, true);
            } else {
              setShimmering(node, false);
            }
            if (node.dataset.owned == state) {
              continue;
            }
            node.dataset.owned = state;
            if (owned) {
              node.classList.remove("abl-unowned");
            } else {
              node.classList.add("abl-unowned");
            }
          }
        }
        function updateVisibleIcons() {
          for (const [iconId, img] of renderedBadgeImages) {
            const url = badgeIconManager.getIconURL(iconId);
            if (url && img.src !== url) {
              img.src = url;
              img.style.visibility = "";
            }
          }
        }
        function refreshOwnershipStatus() {
          const ownershipChecker = getCurrentOwnershipChecker();
          if (ownershipChecker.isEnd() && badgeList.isFinished() || !loaded) {
            ownedRemaining.textContent = "";
          } else {
            ownedRemaining.textContent = `${ownershipChecker.getRemainingBadges()}`;
          }
        }
        function switchPage(page) {
          const maxPage = Math.floor((badgeList.filteredList.length - 1) / pageSize);
          currentPage = Math.max(Math.min(page, maxPage), 0);
          pageDisplay.textContent = `${currentPage + 1}/${maxPage + 1}`;
          refreshList();
        }
        function refreshPage() {
          switchPage(currentPage);
        }
        async function viewUser(userId) {
          viewingUserId = userId;
          refreshPage();
          refreshOwnershipStatus();
          badgeList.refilterBadgeList();
          awakenOwnershipChecker.emit();
          const info = await userInfo.getInfoByUserId(userId);
          if (info) {
            const viewedIndex = viewedUserOrder.indexOf(userId);
            if (viewedIndex != -1) {
              viewedUserOrder.splice(viewedIndex, 1);
            }
            viewedUserOrder.push(userId);
            if (viewingUserId == userId) {
              viewingImg.src = info.imageURL;
              viewingUsername.textContent = info.name;
            }
          }
        }
        const awakenOwnershipChecker = new AwaitableSignal();
        async function ownershipCheckerLoop() {
          while (true) {
            const ownershipChecker = getCurrentOwnershipChecker();
            const remainingBadges = ownershipChecker.getRemainingBadges();
            if (!badgeList.isFinished() && remainingBadges < 100) {
              await awakenOwnershipChecker.promise;
              continue;
            }
            const result = await ownershipChecker.next();
            if (result != true) {
              await awakenOwnershipChecker.promise;
            }
          }
        }
        ownershipCheckerLoop();
        async function load() {
          if (loaded) {
            return;
          }
          loaded = true;
          loadButton.remove();
          refreshOwnershipStatus();
          while (!badgeList.isFinished()) {
            const response = await badgeList.next();
            refreshOwnershipStatus();
            let iconIds = [];
            for (const info of response.values()) {
              iconIds.push(info.iconId);
            }
            badgeIconManager.processBatch(iconIds).then(updateVisibleIcons);
            awakenOwnershipChecker.emit();
          }
          awakenOwnershipChecker.emit();
        }
        OwnershipChecker.onProcessed.subscribe(function() {
          refreshOwnershipStatus();
          if (usesOwnershipFilter()) {
            badgeList.refilterBadgeList();
          } else {
            updateVisibleOwnership();
          }
        });
        badgeList.onFilterListChanged.subscribe(function() {
          queueRefreshPage();
        });
        const RBXbody = document.querySelector("#rbx-body");
        function onUpdate() {
          const nowS = Date.now() / 1e3;
          shimmerPosition = nowS % shimmerDuration / shimmerDuration;
          requestAnimationFrame(onUpdate);
          if (RBXbody.classList.contains("light-theme")) {
            document.documentElement.style.setProperty("--abl-color-surface", "rgb(251, 252, 253)");
          } else if (RBXbody.classList.contains("dark-theme")) {
            document.documentElement.style.setProperty("--abl-color-surface", "rgb(13, 13, 16)");
          } else {
            document.documentElement.style.setProperty("--abl-color-surface", "rgba(20, 20, 20, 0.05)");
          }
        }
        requestAnimationFrame(onUpdate);
        loadButton.onclick = load;
        nextPageBtn.onclick = function() {
          switchPage(currentPage + 1);
        };
        previousPageBtn.onclick = function() {
          switchPage(currentPage - 1);
        };
        toTop.onclick = function() {
          ABLContainer.scrollIntoView(true);
        };
        ownerRefreshBtn.onclick = function() {
          const ownershipChecker = getCurrentOwnershipChecker();
          ownershipChecker.reset();
          refreshOwnershipStatus();
          updateVisibleOwnership();
          if (usesOwnershipFilter()) {
            badgeList.refilterBadgeList();
          }
          ;
          awakenOwnershipChecker.emit();
        };
        ownerEditBtn.onclick = function() {
          openOwnerEditDropdown();
          ownerEditSearch.value = "";
          ownerEditSearch.focus();
        };
        ownerEditSearch.addEventListener("keydown", async function(event) {
          if (event.key === "Enter") {
            const info = await userInfo.getInfoByUsername(ownerEditSearch.value);
            if (info) {
              viewUser(info.id);
              closeOwnerEditDropdown();
            }
          }
        });
        document.onclick = function(event) {
          if (event.target != ownerEditDropdown && !ownerEditDropdown.contains(event.target) && event.target != ownerEditBtn && !ownerEditBtn.contains(event.target)) {
            closeOwnerEditDropdown();
          }
        };
        function onSortChanged() {
          badgeList.setSort(sortType.value, sortDirection.value);
        }
        sortType.addEventListener("change", onSortChanged);
        sortDirection.addEventListener("change", onSortChanged);
        viewUser(mainUserId);
      })();
    }
  });
  require_gamePage();
})();
