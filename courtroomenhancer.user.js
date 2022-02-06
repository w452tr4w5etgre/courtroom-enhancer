// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://objection.lol/courtroom/*
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.381
// @author       w452tr4w5etgre
// @match        https://objection.lol/courtroom/*
// @icon         https://www.google.com/s2/favicons?domain=objection.lol
// @downloadURL  https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/courtroomenhancer.user.js
// @updateURL    https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/courtroomenhancer.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// ==/UserScript==

var scriptSetting = {
    "warn_on_exit": getSetting("warn_on_exit", true),
    "evid_roulette": getSetting("evid_roulette", true)
};

var storedUsername = GM_getValue("courtroom_username","")

window.addEventListener('beforeunload', confirmClose, false);

(new MutationObserver(checkJoinBoxReady)).observe(document, {childList: true, subtree: true});

function checkJoinBoxReady(changes, observer) {
    // Wait for the Join pop-up to show up
    if(document.querySelector("#app > div.v-dialog__content.v-dialog__content--active > div > div")) {
        observer.disconnect();
        let username_join_input = document.querySelector("#app > div.v-dialog__content > div > div > form > div.v-card__text > div > div > div > div > div.v-input__slot > div > input");
        username_join_input.value = storedUsername;
        username_join_input.dispatchEvent(new Event("input"));

        // When the "Join" button is clicked
        document.querySelector("#app > div.v-dialog__content.v-dialog__content--active > div > div > form > div.v-card__actions > button:nth-child(3) > span").parentNode.addEventListener('click', function(){
            storedUsername = username_join_input.value
            GM_setValue("courtroom_username", username_join_input.value);
        });

        // When "Enter" is pressed in the username input box
        username_join_input.addEventListener("keydown", function(e) {
            if (username_join_input.value && (e.keyCode == 13 || e.key == "Enter")) {
                storedUsername = username_join_input.value
                GM_setValue("courtroom_username", username_join_input.value);
            }
        });

        // Handle username changes and update the stored username
        let onUsernameChange = function(e) {
            // Set a timeout because for some reason the name box reverts for a split second on change
            setTimeout(function() {
                storedUsername = username_change_input.value
                GM_setValue("courtroom_username", storedUsername);
            }, 100);
        }

        let username_change_input = document.querySelector("#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div > div.v-window-item > div > div:nth-child(1) > div > div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input[type=text]")
        username_change_input.addEventListener("focusout", function(e) {
            onUsernameChange();
        });

        username_change_input.addEventListener("keydown", function (e) {
            if (e.keyCode == 13 || e.key == "Enter") {
                onUsernameChange();
            }
        });

        // Add setting options under the Settings tab
        createSettingsElements();

        // Create EVD roulette button
        createRouletteButton();
    }
}

function createSettingsElements() {
    // Get the <hr> separator on the Settings page
    let settings_separator = document.querySelector("#app > div > div.container > main > div > div > div > div:nth-child(2) > div > div > div > div > div.v-window-item > div > hr:nth-child(10)");

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
        input.addEventListener("change",callback);

        let label = document.createElement("label");
        div_input_slot.appendChild(label);
        label.setAttribute("for",id);
        label.setAttribute("class","v-label theme--dark pointer-item");
        label.textContent = text;

        return div;
    }

    let extra_warn_on_exit = create_extra_setting_elem("warn_on_exit", "Warn on page exit", function(e) {
        let value = e.target.checked;
        setSetting("warn_on_exit", value);
    })

    let extra_evid_roulette = create_extra_setting_elem("evid_roulette", "Evidence roulette button", function(e) {
        let value = e.target.checked;
        setSetting("evid_roulette", value);
        document.querySelector("div#extra_roulette_button").style.visibility = getSetting("evid_roulette") ? "visible" : "hidden"
    });

    extra_settings_col.append(extra_warn_on_exit, extra_evid_roulette);
    settings_separator.after(extra_settings);
    extra_settings.after(settings_separator.cloneNode());
}

function createRouletteButton() {
    // Upper limit of random evidence number
    var max_evid = 461000;

    let elem_div = document.createElement("div");
    elem_div.setAttribute('class','px-1');
    elem_div.id = "extra_roulette_button"
    let elem_button = document.createElement("button");
    elem_button.setAttribute("class","v-btn v-btn--has-bg theme--dark v-size--small primary");
    elem_button.setAttribute("type","button");
    elem_button.style = 'background-color: #f37821 !important;';
    let elem_span = document.createElement("span");
    elem_span.setAttribute("class","v-btn__content");
    let elem_i=document.createElement("i");
    elem_i.setAttribute("class","v-icon notranslate mdi theme--dark");
    elem_i.textContent = "EVD";
    elem_i.style.fontSize = "18px";

    elem_span.appendChild(elem_i);
    elem_button.appendChild(elem_span);
    elem_div.appendChild(elem_button);

    let existing_button = document.querySelector("#app div.v-application--wrap div.pl-1 button");
    existing_button.parentNode.parentNode.firstChild.before(elem_div);

    elem_button.onclick = function() {
        let textarea = document.querySelector("#app > div > div > main > div textarea.frameTextarea");
        let random = Math.floor(Math.random() * max_evid)
        textarea.value = "[#evd" + random + "]";
        textarea.dispatchEvent(new Event("input"));

        // Click Send button
        document.querySelector("#app > div div div button i.mdi-send").parentNode.parentNode.click();

        // Update textarea value with ID
        textarea.value = "Last evidence: [#evd" + random + "] (" + String(random) + ")";
        textarea.dispatchEvent(new Event("input"));
    }

    elem_div.style.visibility = getSetting("evid_roulette") ? "visible" : "hidden";
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
    scriptSetting[setting_name] = value
    return GM_setValue("setting_" + setting_name, value)
}
