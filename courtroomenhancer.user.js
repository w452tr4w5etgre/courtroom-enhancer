// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://objection.lol/courtroom/*
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.48
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
    "clickable_links": getSetting("clickable_links", true),
    "ping_on_mention": getSetting("ping_on_mention", false),
    "ping_sound_file": getSetting("ping_sound_file", "https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/ping.mp3"),
    "ping_sound_volume": getSetting("ping_sound_volume", 0.5)
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
            // Get the <hr> separator on the Settings page
            let settings_separator = ui_settings_separator;

            let extra_settings_row_head = ui_settings_switchDiv.cloneNode();
            extra_settings_row_head.classList.remove("mt-2")
            extra_settings_row_head.append(document.createElement("h3").textContent="Courtroom Enhancer");

            let extra_settings_row = ui_settings_switchDiv.cloneNode();
            let extra_settings_col = ui_settings_switchDiv.firstChild.cloneNode();

            extra_settings_row.appendChild(extra_settings_col);

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
                label.setAttribute("class","v-label pointer-item");
                label.textContent = text;

                return div;
            }

            let extra_warn_on_exit = create_extra_setting_elem("warn_on_exit", "Confirm on exit", function(e) {
                let value = e.target.checked;
                setSetting("warn_on_exit", value);
            }),
                extra_evid_roulette = create_extra_setting_elem("evid_roulette", "Evidence roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("evid_roulette", value);
                    document.querySelector("div#evid_roulette_button").style.display = getSetting("evid_roulette", true) ? "inline" : "none"
                }),
                extra_sound_roulette = create_extra_setting_elem("sound_roulette", "Sound roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("sound_roulette", value);
                    document.querySelector("div#sound_roulette_button").style.display = getSetting("sound_roulette", true) ? "inline" : "none"
                }),
                extra_music_roulette = create_extra_setting_elem("music_roulette", "Music roulette", function(e) {
                    let value = e.target.checked;
                    setSetting("music_roulette", value);
                    document.querySelector("div#music_roulette_button").style.display = getSetting("music_roulette", true) ? "inline" : "none"
                }),
                extra_clickable_links = create_extra_setting_elem("clickable_links", "Clickable links", function(e) {
                    let value = e.target.checked;
                    setSetting("clickable_links", value);
                }),
                extra_ping_on_mention = create_extra_setting_elem("ping_on_mention", "Ping on mention", function(e) {
                    let value = e.target.checked;
                    setSetting("ping_on_mention", value);
                });

            extra_settings_col.append(extra_warn_on_exit,
                                      extra_evid_roulette,
                                      extra_sound_roulette,
                                      extra_music_roulette,
                                      extra_clickable_links,
                                      extra_ping_on_mention);

            settings_separator.after(extra_settings_row_head, extra_settings_row);
            extra_settings_row.after(settings_separator.cloneNode());
        }

        function createRouletteButtons() {

            function createButton(id, label, callback) {
                let elem_div = document.createElement("div");
                elem_div.setAttribute('class','px-1');
                elem_div.id = id + "_button"
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

        const chatLogObserver = new MutationObserver(chatLogWatcher);
        chatLogObserver.observe(ui_chatLog_chatList, {
            childList: true,
            subtree: true
        });

        function chatLogWatcher(mutations, observer) {
            for (const mutation of mutations) {
                if (mutation.type != "childList") {
                    continue;
                }
                for (const node of mutation.addedNodes) {
                    // Make sure the added node is an element
                    if (node.nodeType !== Node.ELEMENT_NODE) {continue;}

                    let message = node.querySelector(".chat-text");

                    // Make sure the message node was found
                    if (message === null) {continue;}

                    // Make sure the message is a message and not a system notification
                    if (message.previousSibling === null || message.previousSibling.nodeType !== Node.ELEMENT_NODE) {continue;}

                    if (scriptSetting.clickable_links === true) {
                        message.innerHTML = message.textContent.replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&#039;')
                            .replace(/\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim, '<a href="$&" target="_blank" rel="noreferrer">$&</a>')
                            .replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="http://$2" target="_blank">$2</a>');
                    }

                    if (scriptSetting.ping_on_mention === true) {
                        if (message.textContent.match("\\b"+storedUsername+"\\b")) {
                            if (!document.hasFocus()) {
                                pingSound.play();
                            }
                        }
                    }
                }
            }
        }

        let pingSound = new Audio();
        pingSound.src = scriptSetting.ping_sound_file;
        pingSound.volume = scriptSetting.ping_sound_volume;
        pingSound.loop = false;
    }
}

function confirmClose (zEvent) {
    if (getSetting("warn_on_exit", true)) {
        zEvent.preventDefault();
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
