// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://objection.lol/courtroom/*
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.46
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
    "music_roulette": getSetting("music_roulette", false)
};

let storedUsername = getStoredUsername();

const uiElement = {
    "joinBox_container": "#app > div.v-dialog__content.v-dialog__content--active > div > div",
    "joinBox_joinButton": "form > div.v-card__actions > button:nth-child(3)",
    "joinBox_usernameInput": "form > div.v-card__text > div > div > div > div > div.v-input__slot > div > input",

    "settings_container": "#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div.v-window__container > div.v-window-item:nth-child(4)",
    "settings_usernameChangeInput": "div > div > div div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input[type=text]",
    "settings_hrSeparator": "div > hr:last-of-type",

    "mainFrame_container": "#app > div > div.container > main > div > div > div > div:nth-child(1)",
    "mainFrame_textarea": "div textarea.frameTextarea",
    "mainFrame_sendButton": "#app > div > div.container > main > div > div > div.row.no-gutters > div:nth-child(1) > div > div:nth-child(4) > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > button > span > i.mdi-send",

    "chatLog_container": "#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div",
    "chatLog_chat": "#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div > div.v-window-item.v-window-item--active > div > div.chat",
    "chatLog_textField": "#app > div.v-application--wrap > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div > div.v-window-item > div > div:nth-child(2) > div > div > div > div.v-text-field__slot > input[type=text]",
    "chatLog_singleMessageText": "#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div > div.v-window-item.v-window-item--active > div > div.chat > div > div > div.v-list-item__content.py-1 > div.v-list-item__subtitle.black--text.chat-text",
    "chatLog_sendButton": "#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div > div.v-window-item.v-window-item--active > div > div:nth-child(2) > div > div > div > div.v-input__append-inner > div > button"
};

function getUiElement(name, parent=document) {
    return parent.querySelector(uiElement[name]);
}

window.addEventListener('beforeunload', confirmClose, false);

const observer = new MutationObserver(checkJoinBoxReady);
observer.observe(document, {
    childList: true,
    subtree: true
});

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
            ui_settings_separator = getUiElement("settings_hrSeparator", ui_settings_container);

        let ui_mainFrame_container = getUiElement("mainFrame_container"),
            ui_mainFrame_textarea = getUiElement("mainFrame_textarea", ui_mainFrame_container),
            ui_mainFrame_sendButton = getUiElement("mainFrame_sendButton", ui_mainFrame_container).parentNode.parentNode;

        let ui_chatLog_container = getUiElement("chatLog_container"),
            ui_chatLog_chat = getUiElement("chatLog_chat", ui_chatLog_container),
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
        createAdditionalButtons();

        function createSettingsElements() {
            // Get the <hr> separator on the Settings page
            let settings_separator = ui_settings_separator;

            let div_switch = document.querySelector("#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div > div.v-window-item > div > div:nth-child(2) > div > div.v-input--switch");

            let extra_settings = div_switch.parentNode.parentNode.cloneNode();
            let extra_settings_col = div_switch.parentNode.cloneNode();
            extra_settings.appendChild(extra_settings_col);

            function create_extra_setting_elem(id, text, callback, input_type="checkbox") {
                let div = document.createElement("div");
                div.setAttribute("class", "v-input d-inline-block mr-4");

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
                input.type = input_type;
                input.id = id;
                input.checked = scriptSetting[id];
                input.setAttribute("class","theme--dark v-input--selection-controls__input pointer-item");
                input.setAttribute("style","margin-right:4px");
                input.addEventListener("change",callback);

                let label = document.createElement("label");
                div_input_slot.appendChild(label);
                label.setAttribute("for",id);
                label.setAttribute("class","v-label theme--dark pointer-item");
                label.textContent = text;

                return div;
            }

            let extra_warn_on_exit = create_extra_setting_elem("warn_on_exit", "Confirm on exit", function(e) {
                let value = e.target.checked;
                setSetting("warn_on_exit", value);
            })

            let extra_evid_roulette = create_extra_setting_elem("evid_roulette", "Evidence roulette", function(e) {
                let value = e.target.checked;
                setSetting("evid_roulette", value);
                document.querySelector("div#evid_roulette_button").style.display = getSetting("evid_roulette", true) ? "inline" : "none"
            });

            let extra_sound_roulette = create_extra_setting_elem("sound_roulette", "Sound roulette", function(e) {
                let value = e.target.checked;
                setSetting("sound_roulette", value);
                document.querySelector("div#sound_roulette_button").style.display = getSetting("sound_roulette", true) ? "inline" : "none"
            });

            let extra_music_roulette = create_extra_setting_elem("music_roulette", "Music roulette", function(e) {
                let value = e.target.checked;
                setSetting("music_roulette", value);
                document.querySelector("div#music_roulette_button").style.display = getSetting("music_roulette", true) ? "inline" : "none"
            });

            extra_settings_col.append(extra_warn_on_exit,
                                      extra_evid_roulette,
                                      extra_sound_roulette,
                                      extra_music_roulette);

            settings_separator.after(extra_settings);
            extra_settings.after(settings_separator.cloneNode());
        }

        function createAdditionalButtons() {

            function createButton(id, label, callback) {
                let elem_div = document.createElement("div");
                elem_div.setAttribute('class','px-1');
                elem_div.id = id + "_button"
                elem_div.style.display = getSetting(id, false) ? "inline" : "none";

                let elem_button = document.createElement("button");
                elem_button.setAttribute("class","v-btn v-btn--has-bg theme--dark v-size--small primary");
                elem_button.setAttribute("type","button");
                elem_button.style = 'background-color: #f37821 !important;';
                elem_button.addEventListener("click", callback)

                let elem_span = document.createElement("span");
                elem_span.setAttribute("class","v-btn__content");

                let elem_i = document.createElement("i");
                elem_i.setAttribute("class","v-icon notranslate mdi theme--dark");
                elem_i.textContent = label;
                elem_i.style.fontSize = "18px";

                elem_span.appendChild(elem_i);
                elem_button.appendChild(elem_span);
                elem_div.appendChild(elem_button);

                return elem_div;
            }

            let evdRouletteButton = createButton("evid_roulette","EVD", function() {
                // Upper limit for roulettes
                let max = 461000
                let random = Math.floor(Math.random() * max)

                ui_mainFrame_textarea.value = "[#evd" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                // Show last ID on the right chatbox
                ui_chatLog_textField.value = "Last evidence: " + random;
                ui_chatLog_textField.dispatchEvent(new Event("input"));
            });

            let soundRouletteButton = createButton("sound_roulette","SND", function() {
                // Upper limit for roulettes
                let max = 38700
                let random = Math.floor(Math.random() * max)

                ui_mainFrame_textarea.value = "[#bgs" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                // Show last ID on the right chatbox
                ui_chatLog_textField.value = "Last sound: " + random;
                ui_chatLog_textField.dispatchEvent(new Event("input"));
            });

            let musicRouletteButton = createButton("music_roulette","MUS", function() {
                // Upper limit for roulettes
                let max = 129000;
                let random = Math.floor(Math.random() * max)

                ui_mainFrame_textarea.value = "[#bgm" + random + "]";
                ui_mainFrame_textarea.dispatchEvent(new Event("input"));

                // Click Send button
                ui_mainFrame_sendButton.click();

                // Show last ID on the right chatbox
                ui_chatLog_textField.value = "Last music: " + random;
                ui_chatLog_textField.dispatchEvent(new Event("input"));
            });

            let existing_button = document.querySelector("#app div.v-application--wrap div.pl-1 button");
            existing_button.parentNode.parentNode.firstChild.before(evdRouletteButton, soundRouletteButton, musicRouletteButton);

        }
    }
}



function confirmClose (zEvent) {
    if (getSetting("warn_on_exit", true)) {
        zEvent.preventDefault ();
        zEvent.returnValue = "Are you sure?";
    }
}

function getSetting(setting_name, default_value) {
    return GM_getValue("setting_" + setting_name, default_value);
}

function setSetting(setting_name, value) {
    scriptSetting[setting_name] = value;
    return GM_setValue("setting_" + setting_name, value);
}

function getStoredUsername() {
    return GM_getValue("courtroom_username","")
}

function setStoredUsername(username) {
    storedUsername = username;
    return GM_setValue("courtroom_username", username);
}
