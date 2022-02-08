// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://objection.lol/courtroom/*
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.50
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

let scriptSetting = {
    "warn_on_exit": getSetting("warn_on_exit", true),
    "evid_roulette": getSetting("evid_roulette", false),
    "sound_roulette": getSetting("sound_roulette", false),
    "music_roulette": getSetting("music_roulette", false),
    "evid_roulette_max": getSetting("evid_roulette_max", 463000),
    "sound_roulette_max": getSetting("sound_roulette_max", 39000),
    "music_roulette_max": getSetting("music_roulette_max", 129000),
    "clickable_links": false,
    "ping_on_mention": false,
    "ping_sound_file": getSetting("ping_sound_file", "https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/ping.mp3"),
    "ping_sound_volume": getSetting("ping_sound_volume", 50)
};

let storedUsername = getStoredUsername();

const uiElement = {
    "joinBox_container": "#app > div.v-dialog__content.v-dialog__content--active > div > div",
    "joinBox_joinButton": "form > div.v-card__actions > button:nth-child(3)",
    "joinBox_usernameInput": "form > div.v-card__text > div > div > div > div > div.v-input__slot > div > input",

    "settings_container": "#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div.v-window__container > div.v-window-item:nth-child(4)",
    "settings_usernameChangeInput": "div > div > div div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input[type=text]",
    "settings_switchDiv": "div > div:nth-child(2) > div > div.v-input--switch",
    "settings_hrSeparator": "div > hr:last-of-type",

    "mainFrame_container": "#app > div > div.container > main > div > div > div > div:nth-child(1)",
    "mainFrame_textarea": "div textarea.frameTextarea",
    "mainFrame_sendButton": "#app > div > div.container > main > div > div > div.row.no-gutters > div:nth-child(1) > div > div:nth-child(4) > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > button > span > i.mdi-send",

    "chatLog_container": "#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div",
    "chatLog_chat": "div.v-window-item > div > div.chat",
    "chatLog_chatList": "div.v-list",
    "chatLog_textField": "div.v-window-item > div > div:nth-child(2) > div > div > div > div.v-text-field__slot > input[type=text]",
    "chatLog_sendButton": "div > button"
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

        let ui_settings_container = getUiElement("settings_container"),
            ui_settings_usernameChangeInput = getUiElement("settings_usernameChangeInput", ui_settings_container),
            ui_settings_switchDiv = getUiElement("settings_switchDiv", ui_settings_container).parentNode.parentNode,
            ui_settings_separator = getUiElement("settings_hrSeparator", ui_settings_container);

        let ui_mainFrame_container = getUiElement("mainFrame_container"),
            ui_mainFrame_textarea = getUiElement("mainFrame_textarea", ui_mainFrame_container),
            ui_mainFrame_sendButton = getUiElement("mainFrame_sendButton", ui_mainFrame_container).parentNode.parentNode;

        let ui_chatLog_container = getUiElement("chatLog_container"),
            ui_chatLog_chat = getUiElement("chatLog_chat", ui_chatLog_container),
            ui_chatLog_chatList = getUiElement("chatLog_chatList", ui_chatLog_chat),
            ui_chatLog_textField = getUiElement("chatLog_textField", ui_chatLog_container);

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
        createSettingsElements();

        // Create EVD roulette button
        createRouletteButtons();

        function createSettingsElements() {

            function create_extra_setting_elem_checkbox(id, text, callback) {
                let div = document.createElement("div");
                div.setAttribute("class", "v-input d-inline-block mr-2");

                let div_input_control = document.createElement("div");
                div_input_control.setAttribute("class", "v-input__control");
                div.appendChild(div_input_control);

                let div_input_slot = document.createElement("div");
                div_input_slot.setAttribute("class", "v-input__slot");
                div_input_control.appendChild(div_input_slot);

                let div_input_selection = document.createElement("div");
                div_input_selection.setAttribute("class", "v-input--selection-controls__input");
                div_input_slot.appendChild(div_input_selection);

                let input = document.createElement("input");
                div_input_selection.appendChild(input);
                input.type = "checkbox";
                input.id = id;
                input.checked = scriptSetting[id];
                input.setAttribute("class"," v-input--selection-controls__input pointer-item mr-4");
                input.addEventListener("change",callback);

                let label = document.createElement("label");
                div_input_slot.appendChild(label);
                label.setAttribute("for",id);
                label.setAttribute("class","v-label pointer-item");
                label.textContent = text;

                return div;
            }

            function create_extra_setting_elem_text(id, text, callback, input_type="text") {
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
                    for: id,
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

            let extra_warn_on_exit = create_extra_setting_elem_checkbox("warn_on_exit", "Confirm on exit", function(e) {
                let value = e.target.checked;
                setSetting("warn_on_exit", value);
            }),
                extra_evid_roulette = create_extra_setting_elem_checkbox("evid_roulette", "Evidence roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("evid_roulette", value);
                    document.querySelector("div#evid_roulette_button").style.display = value ? "inline" : "none"
                    extra_evid_roulette_max.style.display = value ? "inline-block" : "none"
                }),
                extra_sound_roulette = create_extra_setting_elem_checkbox("sound_roulette", "Sound roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("sound_roulette", value);
                    document.querySelector("div#sound_roulette_button").style.display = value ? "inline" : "none"
                    extra_sound_roulette_max.style.display = value ? "inline-block" : "none"
                }),
                extra_music_roulette = create_extra_setting_elem_checkbox("music_roulette", "Music roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("music_roulette", value);
                    document.querySelector("div#music_roulette_button").style.display = value ? "inline" : "none"
                    extra_music_roulette_max.style.display = value ? "inline-block" : "none"
                }),
                extra_evid_roulette_max = create_extra_setting_elem_text("evid_roulette_max", "max", function(e) {
                    let value = parseInt(e.target.value);
                    if (value) {
                        setSetting("evid_roulette_max", value);
                    } else {
                        e.target.value = scriptSetting.evid_roulette_max;
                        e.preventDefault();
                        return false;
                    }
                }, "number"),
                extra_sound_roulette_max = create_extra_setting_elem_text("sound_roulette_max", "max", function(e) {
                    let value = parseInt(e.target.value);
                    if (value) {
                        setSetting("sound_roulette_max", value);
                    } else {
                        e.target.value = scriptSetting.sound_roulette_max;
                        e.preventDefault();
                        return false;
                    }
                }, "number"),
                extra_music_roulette_max = create_extra_setting_elem_text("music_roulette_max", "max", function(e) {
                    let value = parseInt(e.target.value);
                    if (value) {
                        setSetting("music_roulette_max", value);
                    } else {
                        e.target.value = scriptSetting.music_roulette_max;
                        e.preventDefault();
                        return false;
                    }
                }, "number"),
                extra_clickable_links = create_extra_setting_elem_checkbox("clickable_links", "Clickable links", function(e) {
                    let value = e.target.checked;
                    setSetting("clickable_links", value);
                }),
                extra_ping_on_mention = create_extra_setting_elem_checkbox("ping_on_mention", "Beep on mention", function(e) {
                    let value = e.target.checked;
                    setSetting("ping_on_mention", value);
                    extra_ping_sound_file.style.setProperty("display", value ? "inline-block" : "none", "important");
                    extra_ping_sound_volume.style.setProperty("display", value ? "inline-block" : "none", "important");
                }),
                extra_ping_sound_file = create_extra_setting_elem_text("ping_sound_file", "Beep sound URL", function(e) {
                    let value = e.target.value;
                    if (value) {
                        //pingSound.src = value;
                        setSetting("ping_sound_file", value);
                    } else {
                        e.target.value = scriptSetting.ping_sound_file;
                        e.preventDefault();
                        return false;
                    }

                }, "text"),
                extra_ping_sound_volume = create_extra_setting_elem_text("ping_sound_volume", "volume", function(e) {
                    let value = e.target.value;
                    if (value >= 0 && value <= 100) {
                        setSetting("ping_sound_volume", value);
                    } else {
                        e.target.value = scriptSetting.ping_sound_volume;
                        e.preventDefault();
                        return false;
                    }
                }, "number");

            // Get the <hr> separator on the Settings page
            let settings_separator = ui_settings_separator;

            let extra_settings_row_head = document.createElement("h3");
            extra_settings_row_head.textContent = "Courtroom Enhancer";

            let extra_settings_row_1 = ui_settings_switchDiv.cloneNode();
            let extra_settings_row_1_col_1 = ui_settings_switchDiv.firstChild.cloneNode();

            extra_settings_row_1.appendChild(extra_settings_row_1_col_1);

            /*extra_settings_row_1_col_1.append(extra_warn_on_exit,
                                              extra_clickable_links);*/
            extra_settings_row_1_col_1.append(extra_warn_on_exit);

            // Row 2

            let extra_settings_row_2 = ui_settings_switchDiv.cloneNode();
            let extra_settings_row_2_col_1 = ui_settings_switchDiv.firstChild.cloneNode();

            extra_settings_row_2.appendChild(extra_settings_row_2_col_1);

            /* Chat parser disabled
            extra_ping_sound_file.querySelector("input").maxLength = "255";
            extra_ping_sound_file.setAttribute("class","d-inline-block col-sm-6 mr-1");
            extra_ping_sound_file.style.padding = "0";

            extra_ping_sound_file.style.setProperty("display", scriptSetting.ping_on_mention ? "inline-block" : "none", "important");
            extra_ping_sound_volume.style.setProperty("display", scriptSetting.ping_on_mention ? "inline-block" : "none", "important");

            extra_ping_sound_volume.setAttribute("class","d-inline-block col-sm-2, ml-1");
            extra_ping_sound_volume.style.padding = "0";

            extra_ping_sound_volume.querySelector("input").maxLength = "3";
            extra_ping_sound_volume.querySelector("input").min = "0";
            extra_ping_sound_volume.querySelector("input").max = "100";
            extra_ping_sound_volume.querySelector("input").style.width = "45px";

            extra_settings_row_2_col_1.append(
                extra_ping_on_mention,
                extra_ping_sound_file,
                extra_ping_sound_volume);
            */

            // Row 3
            let extra_settings_row_3 = ui_settings_switchDiv.cloneNode();
            let extra_settings_row_3_col_1 = ui_settings_switchDiv.firstChild.cloneNode();

            extra_settings_row_3.appendChild(extra_settings_row_3_col_1);

            extra_evid_roulette_max.classList.remove("d-inline-block");
            extra_evid_roulette_max.setAttributes({
                style: {
                    display: scriptSetting.evid_roulette ? "inline-block" : "none",
                    padding: "0px",
                    marginRight: "8px"
                }
            });
            extra_evid_roulette_max.querySelector("input").setAttributes({
                maxLength: "7",
                min: "0",
                max: "9999999",
                style: {
                    width:"65px"
                }
            });

            extra_sound_roulette_max.classList.remove("d-inline-block");
            extra_sound_roulette_max.setAttributes({
                style: {
                    display: scriptSetting.sound_roulette ? "inline-block" : "none",
                    padding: "0px",
                    marginRight: "8px"
                }
            });
            extra_sound_roulette_max.querySelector("input").setAttributes({
                maxLength: "7",
                min: "0",
                max: "9999999",
                style: {
                    width:"65px"
                }
            });

            extra_music_roulette_max.classList.remove("d-inline-block");
            extra_music_roulette_max.setAttributes({
                style: {
                    display: scriptSetting.music_roulette ? "inline-block" : "none",
                    padding: "0px",
                    marginRight: "8px"
                }
            });
            extra_music_roulette_max.querySelector("input").setAttributes({
                maxLength: "7",
                min: "0",
                max: "9999999",
                style: {
                    width:"65px"
                }
            });

            extra_settings_row_3_col_1.append(
                extra_evid_roulette,
                extra_evid_roulette_max,
                extra_sound_roulette,
                extra_sound_roulette_max,
                extra_music_roulette,
                extra_music_roulette_max);

            settings_separator.after(extra_settings_row_head,
                                     extra_settings_row_1,
                                     extra_settings_row_2,
                                     extra_settings_row_3);

            extra_settings_row_3.after(settings_separator.cloneNode());
        }

        function createRouletteButtons() {

            function createButton(id, label, callback) {
                let elem_div = document.createElement("div");
                elem_div.setAttribute('class','px-1');
                elem_div.id = id + "_button";
                elem_div.style.display = getSetting(id, false) ? "inline" : "none";

                let elem_button = document.createElement("button");
                elem_button.setAttribute("class","v-btn v-btn--has-bg v-size--small primary");
                elem_button.setAttribute("type","button");
                elem_button.style = 'background-color: #f37821 !important;';
                elem_button.addEventListener("click", callback)

                let elem_span = document.createElement("span");
                elem_span.setAttribute("class","v-btn__content");

                let elem_i = document.createElement("i");
                elem_i.setAttribute("class","v-icon notranslate mdi");
                elem_i.textContent = label;
                elem_i.style.fontSize = "18px";

                elem_span.appendChild(elem_i);
                elem_button.appendChild(elem_span);
                elem_div.appendChild(elem_button);

                return elem_div;
            }

            let evdRouletteButton = createButton("evid_roulette","EVD", function() {
                let random = Math.floor(Math.random() * scriptSetting.evid_roulette_max);

                ui_mainFrame_textarea.value = "[#evd" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                // Show last ID on the right chatbox
                ui_chatLog_textField.value = "Last evidence: " + random;
                ui_chatLog_textField.dispatchEvent(new Event("input"));
            });

            let soundRouletteButton = createButton("sound_roulette","SND", function() {
                let random = Math.floor(Math.random() * scriptSetting.sound_roulette_max);

                ui_mainFrame_textarea.value = "[#bgs" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                // Show last ID on the right chatbox
                ui_chatLog_textField.value = "Last sound: " + random;
                ui_chatLog_textField.dispatchEvent(new Event("input"));
            });

            let musicRouletteButton = createButton("music_roulette","MUS", function() {
                let random = Math.floor(Math.random() * scriptSetting.music_roulette_max);

                ui_mainFrame_textarea.value = "[#bgm" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                // Show last ID on the right chatbox
                ui_chatLog_textField.value = "Last music: " + random;
                ui_chatLog_textField.dispatchEvent(new Event("input"));
            });

            let existing_button = document.querySelector("#app div.v-application--wrap div.pl-1 button");
            existing_button.parentNode.parentNode.firstChild.before(
                evdRouletteButton,
                soundRouletteButton,
                musicRouletteButton);
        }


    }
}

function confirmClose (zEvent) {
    if (getSetting("warn_on_exit", true)) {
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

Element.prototype.setAttributes = function(attr) {var recursiveSet = function(at,set) {for(var prop in at){if(typeof at[prop] == 'object' && at[prop].dataset == null && at[prop][0] == null){recursiveSet(at[prop],set[prop]);}else {set[prop] = at[prop];}}};recursiveSet(attr,this);}
