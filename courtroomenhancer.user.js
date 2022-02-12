// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://objection.lol/courtroom/*
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.542
// @author       w452tr4w5etgre
// @match        https://objection.lol/courtroom/*
// @icon         https://objection.lol/favicon.ico
// @downloadURL  https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/courtroomenhancer.user.js
// @updateURL    https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/courtroomenhancer.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @run-at       document-end
// ==/UserScript==

let scriptSetting = {};

function initSettings() {
    scriptSetting = {
        "warn_on_exit": getSetting("warn_on_exit", true),
        "evid_roulette": getSetting("evid_roulette", false),
        "sound_roulette": getSetting("sound_roulette", false),
        "music_roulette": getSetting("music_roulette", false),
        "evid_roulette_max": getSetting("evid_roulette_max", 463000),
        "sound_roulette_max": getSetting("sound_roulette_max", 39000),
        "music_roulette_max": getSetting("music_roulette_max", 129000)
    };
};

initSettings();

let storedUsername = getStoredUsername();

const uiElement = {
    "joinBox_container": "#app > div.v-dialog__content.v-dialog__content--active > div > div",
    "joinBox_joinButton": "form > div.v-card__actions > button:nth-child(3)",
    "joinBox_usernameInput": "form > div.v-card__text > div > div > div > div > div.v-input__slot > div > input",

    "mainFrame_container": "#app > div > div.container > main > div > div > div > div:nth-child(1)",
    "mainFrame_textarea": "div textarea.frameTextarea",
    "mainFrame_sendButton": "#app > div > div.container > main > div > div > div.row.no-gutters > div:nth-child(1) > div > div:nth-child(4) > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > button > span > i.mdi-send",

    "rightFrame_container": "#app > div > div.container > main > div > div > div > div:nth-child(2) div",

    "chatLog_container": "div.v-card.v-sheet > div.v-window.v-item-group > div.v-window__container",
    "chatLog_chat": "div.v-window-item:nth-of-type(1) > div > div.chat",
    "chatLog_chatList": "div.v-list",
    "chatLog_textField": "div.v-window-item > div > div:nth-child(2) > div > div > div > div.v-text-field__slot > input[type=text]",
    "chatLog_sendButton": "div > button",

    "settings_container": "div.v-card.v-sheet > div.v-window.v-item-group > div.v-window__container > div.v-window-item:nth-child(4)",
    "settings_usernameChangeInput": "div > div > div div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input[type=text]",
    "settings_switchDiv": "div > div:nth-child(2) > div > div.v-input--switch",
    "settings_hrSeparator": "div > hr:last-of-type"
};

function getUiElement(name, parent=document) {
    return parent.querySelector(uiElement[name]);
}

window.addEventListener('beforeunload', confirmClose, false);

(new MutationObserver(checkJoinBoxReady)).observe(document, {childList: true, subtree: true});

function checkJoinBoxReady(changes, observer) {
    // Wait for the Join pop-up to show up
    let ui_joinBox_container;
    if (ui_joinBox_container = getUiElement("joinBox_container")) {
        observer.disconnect();
        let ui_joinBox_usernameInput = getUiElement("joinBox_usernameInput", ui_joinBox_container);
        ui_joinBox_usernameInput.value = storedUsername;
        ui_joinBox_usernameInput.dispatchEvent(new Event("input"));

        // When the "Join" button is clicked
        getUiElement("joinBox_joinButton", ui_joinBox_container).addEventListener('click', function(){
            setStoredUsername(ui_joinBox_usernameInput.value);
        });

        // When "Enter" is pressed in the username input box
        ui_joinBox_usernameInput.addEventListener("keydown", function(e) {
            if (ui_joinBox_usernameInput.value && (e.keyCode == 13 || e.key == "Enter")) {
                setStoredUsername(ui_joinBox_usernameInput.value);
            }
        });

        let ui_mainFrame_container = getUiElement("mainFrame_container"),
            ui_mainFrame_textarea = getUiElement("mainFrame_textarea", ui_mainFrame_container),
            ui_mainFrame_sendButton = getUiElement("mainFrame_sendButton", ui_mainFrame_container).parentNode.parentNode;

        let ui_rightFrame_container = getUiElement("rightFrame_container");

        let ui_chatLog_container = getUiElement("chatLog_container", ui_rightFrame_container),
            ui_chatLog_chat = getUiElement("chatLog_chat", ui_chatLog_container),
            ui_chatLog_chatList = getUiElement("chatLog_chatList", ui_chatLog_chat),
            ui_chatLog_textField = getUiElement("chatLog_textField", ui_chatLog_container);

        let ui_settings_container = getUiElement("settings_container", ui_rightFrame_container),
            ui_settings_usernameChangeInput = getUiElement("settings_usernameChangeInput", ui_settings_container),
            ui_settings_switchDiv = getUiElement("settings_switchDiv", ui_settings_container).parentNode.parentNode,
            ui_settings_separator = getUiElement("settings_hrSeparator", ui_settings_container);

        // Handle username changes and update the stored username
        let onUsernameChange = function(name) {
            // Set a timeout because for some reason the name box reverts for a split second on change
            setTimeout(function() {
                setStoredUsername(name);
            }, 100);
        };

        ui_settings_usernameChangeInput.addEventListener("focusout", function(e) {
            onUsernameChange(e.target.value);
        });

        ui_settings_usernameChangeInput.addEventListener("keydown", function (e) {
            if (e.keyCode == 13 || e.key == "Enter") {
                onUsernameChange(e.target.value);
            }
        });

        // Add setting options under the Settings tab
        createExtraSettingsElements();

        // Create additional buttons container below the right panels
        createCustomButtonsContainer();

        function createButton(id, label, icon=null, callback) {
            let elem_div = document.createElement("div");
            elem_div.setAttributes({
                className: "pr-2",
                id: id + "_button"
            });

            let elem_button = document.createElement("button");
            elem_button.setAttributes({
                className: "v-btn v-btn--has-bg v-size--small theme--dark",
                type: "button",
                style: {
                    background: "rgb(184 39 146)"
                }
            });
            elem_button.addEventListener("click", callback)

            let elem_span = document.createElement("span");
            elem_span.setAttributes({
                className: "v-btn__content"
            });

            elem_span.textContent = label;

            if (icon) {
                let elem_icon = document.createElement("i");
                elem_icon.setAttributes({
                    className: "v-icon v-icon--left mdi mdi-"+icon+" theme--dark"
                });
                elem_span.firstChild.before(elem_icon);
            }

            elem_button.appendChild(elem_span);
            elem_div.appendChild(elem_button);

            return elem_div;
        }

        function createExtraSettingsElements() {

            function createExtraSettingElemCheckbox(id, text, callback) {
                let div = document.createElement("div");
                div.setAttributes({
                    className: "v-input d-inline-block mr-2"
                });

                let div_input_control = document.createElement("div");
                div_input_control.setAttributes({
                    className: "v-input__control"
                });
                div.appendChild(div_input_control);

                let div_input_slot = document.createElement("div");
                div_input_slot.setAttributes({
                    className: "v-input__slot"
                });
                div_input_control.appendChild(div_input_slot);

                let div_input_selection = document.createElement("div");
                div_input_selection.setAttributes({
                    className: "v-input--selection-controls__input mr-0"
                });
                div_input_slot.appendChild(div_input_selection);

                let input = document.createElement("input");
                div_input_selection.appendChild(input);
                input.setAttributes({
                    className: "v-input--selection-controls__input pointer-item",
                    style: {
                        accentColor: "#007aff"
                    },
                    checked: scriptSetting[id],
                    id: id,
                    type: "checkbox"
                });
                input.addEventListener("change", callback);

                let label = document.createElement("label");
                div_input_slot.appendChild(label);
                label.setAttributes({
                    htmlFor: id,
                    className: "v-label pointer-item",
                    style: {
                        paddingLeft: "6px"
                    }
                });
                label.textContent = text;

                return div;
            }

            function createExtraSettingElemText(id, text, callback, input_type="text") {
                let div_column = document.createElement("div");
                div_column.setAttributes({
                    className: "d-inline-block"
                });

                let div = document.createElement("div");
                div.setAttributes({
                    className: "v-input v-text-field",
                    style: {
                        padding: "0px"
                    }
                });
                div_column.appendChild(div);

                let div_input_control = document.createElement("div");
                div_input_control.setAttributes({
                    className: "v-input__control"
                });
                div.appendChild(div_input_control);

                let div_input_slot = document.createElement("div");
                div_input_slot.setAttributes({
                    className: "v-input__slot",
                    style: {
                        margin: "0"
                    }
                });
                div_input_control.appendChild(div_input_slot);

                let div_input_selection = document.createElement("div");
                div_input_selection.setAttributes({
                    className: "v-text-field__slot"
                });
                div_input_slot.appendChild(div_input_selection);

                let label = document.createElement("label");
                label.setAttributes({
                    htmlFor: id,
                    className: "v-label v-label--active",
                    style: {
                        left: "0px",
                        right: "auto",
                        position: "absolute"
                    }
                });

                label.textContent = text;
                div_input_slot.appendChild(label);

                let input = document.createElement("input");
                input.type = input_type;
                input.id = id;
                input.value = scriptSetting[id];
                input.setAttributes({
                    className: "v-input--selection-controls__input",
                    style: {
                        marginRight: "0"
                    }
                });

                input.addEventListener("focus", function(e) {
                    div.classList.add("v-input--is-focused","primary--text");
                    label.classList.add("primary--text");
                });

                input.addEventListener("focusout",function (e) {
                    div.classList.remove("v-input--is-focused","primary--text");
                    label.classList.remove("primary--text");
                    callback(e)
                });

                div_input_selection.append(label, input);

                return div_column;
            }

            let ui_extraSettings_warnOnExit = createExtraSettingElemCheckbox("warn_on_exit", "Confirm on exit", function(e) {
                let value = e.target.checked;
                setSetting("warn_on_exit", value);
            }),
                ui_extraSettings_rouletteEvid = createExtraSettingElemCheckbox("evid_roulette", "Evidence roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("evid_roulette", value);
                    document.querySelector("div#customButtons_evidRoulette_button").style.display = value ? "inline" : "none"
                    ui_extraSettings_rouletteEvidMax.style.display = value ? "inline-block" : "none"
                }),
                ui_extraSettings_rouletteSound = createExtraSettingElemCheckbox("sound_roulette", "Sound roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("sound_roulette", value);
                    document.querySelector("div#customButtons_soundRoulette_button").style.display = value ? "inline" : "none"
                    ui_extraSettings_rouletteSoundMax.style.display = value ? "inline-block" : "none"
                }),
                ui_extraSettings_rouletteMusic = createExtraSettingElemCheckbox("music_roulette", "Music roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("music_roulette", value);
                    document.querySelector("div#customButtons_musicRoulette_button").style.display = value ? "inline" : "none"
                    ui_extraSettings_rouletteMusicMax.style.display = value ? "inline-block" : "none"
                }),
                ui_extraSettings_rouletteEvidMax = createExtraSettingElemText("evid_roulette_max", "max", function(e) {
                    let value = parseInt(e.target.value);
                    if (value) {
                        setSetting("evid_roulette_max", value);
                    } else {
                        e.target.value = scriptSetting.evid_roulette_max;
                        e.preventDefault();
                        return false;
                    }
                }, "number"),
                ui_extraSettings_rouletteSoundMax = createExtraSettingElemText("sound_roulette_max", "max", function(e) {
                    let value = parseInt(e.target.value);
                    if (value) {
                        setSetting("sound_roulette_max", value);
                    } else {
                        e.target.value = scriptSetting.sound_roulette_max;
                        e.preventDefault();
                        return false;
                    }
                }, "number"),
                ui_extraSettings_rouletteMusicMax = createExtraSettingElemText("music_roulette_max", "max", function(e) {
                    let value = parseInt(e.target.value);
                    if (value) {
                        setSetting("music_roulette_max", value);
                    } else {
                        e.target.value = scriptSetting.music_roulette_max;
                        e.preventDefault();
                        return false;
                    }
                }, "number")

            // Get the <hr> separator on the Settings page
            let settings_separator = ui_settings_separator;

            // Row 1 - Header
            let extraSettings_rows = [];
            let ui_extraSettings_rowHeader = document.createElement("h3");
            ui_extraSettings_rowHeader.textContent = "Courtroom Enhancer";

            let ui_extraSettings_resetButton = createButton("extraSettings_reset", "Reset and reload", "refresh", function() {
                let storedSettings = GM_listValues();
                for (let val in storedSettings) {
                    GM_deleteValue(storedSettings[val]);
                    scriptSetting.warn_on_exit = false;
                    window.location.reload();
                }
            });

            ui_extraSettings_resetButton.classList.add("d-inline-block", "ml-2");
            ui_extraSettings_resetButton.firstChild.setAttributes({
                style: {
                    backgroundColor: "rgb(161 35 35)"
                }
            });

            ui_extraSettings_rowHeader.appendChild(ui_extraSettings_resetButton);
            extraSettings_rows.push(ui_extraSettings_rowHeader);

            // Row 2 - Buttons
            let ui_extraSettings_rowButtons = ui_settings_switchDiv.cloneNode();
            ui_extraSettings_rowButtons.appendChild(ui_settings_switchDiv.firstChild.cloneNode());
            ui_extraSettings_rowButtons.lastChild.append(ui_extraSettings_warnOnExit);
            extraSettings_rows.push(ui_extraSettings_rowButtons);

            // Row 3 - Roulettes
            let ui_extraSettings_rowRoulettes = ui_settings_switchDiv.cloneNode();

            ui_extraSettings_rowRoulettes.appendChild(ui_settings_switchDiv.firstChild.cloneNode());

            ui_extraSettings_rouletteEvidMax.classList.remove("d-inline-block");
            ui_extraSettings_rouletteEvidMax.setAttributes({
                style: {
                    display: scriptSetting.evid_roulette ? "inline-block" : "none",
                    padding: "0px",
                    marginRight: "8px"
                }
            });
            ui_extraSettings_rouletteEvidMax.querySelector("input").setAttributes({
                maxLength: "7",
                min: "0",
                max: "9999999",
                style: {
                    width:"55px"
                }
            });

            ui_extraSettings_rouletteSoundMax.classList.remove("d-inline-block");
            ui_extraSettings_rouletteSoundMax.setAttributes({
                style: {
                    display: scriptSetting.sound_roulette ? "inline-block" : "none",
                    padding: "0px",
                    marginRight: "8px"
                }
            });
            ui_extraSettings_rouletteSoundMax.querySelector("input").setAttributes({
                maxLength: "7",
                min: "0",
                max: "9999999",
                style: {
                    width:"65px"
                }
            });

            ui_extraSettings_rouletteMusicMax.classList.remove("d-inline-block");
            ui_extraSettings_rouletteMusicMax.setAttributes({
                style: {
                    display: scriptSetting.music_roulette ? "inline-block" : "none",
                    padding: "0px",
                    marginRight: "8px"
                }
            });
            ui_extraSettings_rouletteMusicMax.querySelector("input").setAttributes({
                maxLength: "7",
                min: "0",
                max: "9999999",
                style: {
                    width:"65px"
                }
            });

            ui_extraSettings_rowRoulettes.lastChild.append(
                ui_extraSettings_rouletteEvid,
                ui_extraSettings_rouletteEvidMax,
                ui_extraSettings_rouletteSound,
                ui_extraSettings_rouletteSoundMax,
                ui_extraSettings_rouletteMusic,
                ui_extraSettings_rouletteMusicMax);
            extraSettings_rows.push(ui_extraSettings_rowRoulettes);

            // Find the element after the last <hr> and attach the extra settings before it
            let ui_settings_afterSeparator = settings_separator.nextElementSibling;
            extraSettings_rows.forEach(row => {
                ui_settings_afterSeparator.insertAdjacentElement("beforebegin", row);
            });

            // Add the <hr> separator after the last row
            ui_settings_afterSeparator.insertAdjacentElement("beforebegin",settings_separator.cloneNode());
        }

        function createCustomButtonsContainer() {
            let ui_customButtonsContainer = ui_rightFrame_container.insertAdjacentElement("afterend", document.createElement("div"));
            ui_customButtonsContainer.className = "mx-0 mx-md-2 mt-4 rounded-0";

            let ui_customButtons_rows = []

            // Roulette buttons row
            let ui_customButtons_rowRoulette = document.createElement("div");
            ui_customButtons_rowRoulette.setAttributes({
                className: "row no-gutters"
            });

            let ui_customButtons_evidRouletteButton = createButton("customButtons_evidRoulette", "EVD", "dice-multiple", function() {
                // Check if the send button is not on cooldown
                if (ui_mainFrame_sendButton.disabled) {
                    return;
                }

                let random = Math.floor(Math.random() * scriptSetting.evid_roulette_max);

                ui_mainFrame_textarea.value = "[#evd" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click()
                Logger.log("[#evd" + random + "]", "image");

            });
            ui_customButtons_evidRouletteButton.setAttributes({
                style: {
                    display: scriptSetting.evid_roulette ? "inline" : "none"
                }
            });

            let ui_customButtons_soundRouletteButton = createButton("customButtons_soundRoulette", "SFX", "dice-multiple", function() {
                // Check if the send button is not on cooldown
                if (ui_mainFrame_sendButton.disabled) {
                    return;
                }

                let random = Math.floor(Math.random() * scriptSetting.sound_roulette_max);

                ui_mainFrame_textarea.value = "[#bgs" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                Logger.log("[#bgs" + random + "]", "volume-medium");
            });
            ui_customButtons_soundRouletteButton.setAttributes({
                style: {
                    display: scriptSetting.sound_roulette ? "inline" : "none"
                }
            });

            let ui_customButtons_musicRouletteButton = createButton("customButtons_musicRoulette", "BGM", "dice-multiple", function() {
                // Check if the send button is not on cooldown
                if (ui_mainFrame_sendButton.disabled) {
                    return;
                }

                let random = Math.floor(Math.random() * scriptSetting.music_roulette_max);

                ui_mainFrame_textarea.value = "[#bgm" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                Logger.log("[#bgm" + random + "]", "music-note");
            });
            ui_customButtons_musicRouletteButton.setAttributes({
                style: {
                    display: scriptSetting.music_roulette ? "inline" : "none"
                }
            });

            ui_customButtons_rowRoulette.append(
                ui_customButtons_evidRouletteButton,
                ui_customButtons_soundRouletteButton,
                ui_customButtons_musicRouletteButton);

            ui_customButtons_rows.push(ui_customButtons_rowRoulette);

            // Music buttons row
            if (typeof unsafeWindow !== "undefined" && typeof unsafeWindow.Howler === "object") {
                let ui_customButtons_rowMusic = document.createElement("div");
                ui_customButtons_rowMusic.setAttributes({
                    className: "row mt-3 no-gutters"
                });

                let ui_customButton_stopAllSounds = createButton("stop_all_sounds", "Stop all sounds", "music-off", function(){
                    if (typeof unsafeWindow !== "undefined") {
                        unsafeWindow.Howler.stop();
                    }
                });

                ui_customButton_stopAllSounds.classList.remove("px-1");

                ui_customButton_stopAllSounds.firstChild.setAttributes({
                    style: {
                        backgroundColor: "teal"
                    }
                });

                let ui_customButton_getCurMusicUrl = createButton("get_cur_music_url", "Get current BGM URL", "link-variant", function(){
                    if (typeof unsafeWindow !== "undefined") {
                        for (let howl of unsafeWindow.Howler._howls) {
                            if (howl._loop) {
                                Logger.log(howl._src, "link-variant");
                                break;
                            }
                        };
                    };
                });

                ui_customButton_getCurMusicUrl.firstChild.setAttributes({
                    style: {
                        backgroundColor: "teal"
                    }
                });

                ui_customButtons_rowMusic.append(ui_customButton_stopAllSounds,
                                                 ui_customButton_getCurMusicUrl);

                ui_customButtons_rows.push(ui_customButtons_rowMusic);
            }

            // Log row
            let Logger = {
                lines: [],
                log: function(str,icon=null) {
                    if (this.lines.length >= 5) {
                        this.lines.shift();
                    }
                    this.lines.push({
                        str: str,
                        icon: icon
                    });

                    while (ui_customButtons_logArea.firstChild) {
                        ui_customButtons_logArea.firstChild.remove()
                    }

                    this.lines.forEach(entry => {
                        let item = document.createElement("span")
                        if (entry.icon) {
                            icon = document.createElement("i");
                            icon.classList.add("mdi","mr-1", "mdi-" + entry.icon);
                            item.append(icon);
                        }
                        item.setAttributes({
                            style: {
                                display: "inline-block",
                                padding: "2px 4px",
                                border: "1px line rgbrgb(126 85 143)",
                                borderRadius: "4px",
                                backgroundColor: "rgb(126 85 143)",
                                userSelect: "all",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                            }
                        });
                        item.append(document.createTextNode(entry.str));

                        if (ui_customButtons_rowLogContainer.style.display == "none") {
                            ui_customButtons_rowLogContainer.style.display = "flex";
                        }
                        ui_customButtons_logArea.append(item);
                    });
                }
            }

            let ui_customButtons_rowLog = document.createElement("div");
            ui_customButtons_rowLog.setAttributes({
                className: "row mt-3 no-gutters"
            });

            let ui_customButtons_rowLogContainer = document.createElement("div");
            ui_customButtons_rowLogContainer.setAttributes({
                style: {
                    width: "100%",
                    display: "none"
                }
            });
            ui_customButtons_rowLog.append(ui_customButtons_rowLogContainer);

            let ui_customButtons_showLogButton = document.createElement("i");
            ui_customButtons_showLogButton.classList.add("mdi", "mdi-console", "v-icon", "theme--dark");
            ui_customButtons_rowLogContainer.append(ui_customButtons_showLogButton);

            let ui_customButtons_logArea = document.createElement("div");
            ui_customButtons_logArea.setAttributes({
                className: "d-flex ml-2",
                style: {
                    width: "100%",
                    gap: "4px",
                    overflow: "auto",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flexWrap: "nowrap",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    textColor: "white",
                    lineHeight: "15px",
                    alignItems: "center"
                }
            });

            ui_customButtons_rowLogContainer.append(ui_customButtons_logArea);

            ui_customButtons_rows.push(ui_customButtons_rowLog);

            // Attach each rows to the custom buttons container
            ui_customButtons_rows.forEach(row => {
                ui_customButtonsContainer.append(row);
            });

            return true;
        }

    }
}

function confirmClose (zEvent) {
    if (scriptSetting.warn_on_exit) {
        zEvent.preventDefault();
        zEvent.returnValue = "Are you sure?";
    }
}

function getSetting(setting_name, default_value) {
    let value = GM_getValue("setting_" + setting_name, default_value);
    switch (typeof default_value) {
        case "number":
            value = parseInt(value) || default_value;
            break;
        case "boolean":
            value = Boolean(value);
            break;
    }
    return value;
}

function setSetting(setting_name, value) {
    scriptSetting[setting_name] = value;
    return GM_setValue("setting_" + setting_name, value);
}

function getStoredUsername() {
    return String(GM_getValue("courtroom_username",""));
}

function setStoredUsername(username) {
    storedUsername = username;
    return GM_setValue("courtroom_username", String(username));
}

// Helper function to set multiple element attributes at once
Element.prototype.setAttributes = function(attr) {var recursiveSet = function(at,set) {for(var prop in at){if(typeof at[prop] == 'object' && at[prop].dataset == null && at[prop][0] == null){recursiveSet(at[prop],set[prop]);}else {set[prop] = at[prop];}}};recursiveSet(attr,this);}
