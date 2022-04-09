// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://github.com/w452tr4w5etgre/
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.744
// @author       w452tr4w5etgre
// @homepage     https://github.com/w452tr4w5etgre/courtroom-enhancer
// @match        https://objection.lol/courtroom/*
// @icon         https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/logo.png
// @downloadURL  https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/courtroomenhancer.user.js
// @updateURL    https://github.com/w452tr4w5etgre/courtroom-enhancer/raw/main/courtroomenhancer.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @run-at       document-end
// ==/UserScript==

var scriptSetting = {};

const initSettings = function() {
    scriptSetting = {
        "warn_on_exit": getSetting("warn_on_exit", true),
        "remember_username": getSetting("remember_username", true),
        "show_console": getSetting("show_console", false),
        "adjust_chat_text_with_wheel": getSetting("adjust_chat_text_with_wheel", true),
        "chat_hover_tooltip": getSetting("chat_hover_tooltip", true),
        "disable_keyboard_shortcuts": getSetting("disable_keyboard_shortcuts", true),
        "evid_roulette": getSetting("evid_roulette", false),
        "sound_roulette": getSetting("sound_roulette", false),
        "music_roulette": getSetting("music_roulette", false),
        "evid_roulette_as_icon": getSetting("evid_roulette_as_icon", false),
        "evid_roulette_max": Math.max(getSetting("evid_roulette_max", 0), 497000),
        "sound_roulette_max": Math.max(getSetting("sound_roulette_max", 0), 142500),
        "music_roulette_max": Math.max(getSetting("music_roulette_max", 0), 44000),
        "file_host": getSetting("file_host", "catbox")
    };
}();

let storedUsername = getStoredUsername();

const ui = {"app": document.querySelector("div#app")};

(new MutationObserver(checkJoinBoxReady)).observe(document, {childList: true, subtree: true});

function checkJoinBoxReady(changes, observer) {
    if (typeof ui.app === "undefined" || !ui.app) {
        ui.app = document.querySelector("div#app");
    }

    for (const change of changes) {
        for (const node of change.addedNodes) {
            if (node instanceof HTMLDivElement && node.classList.contains("v-dialog__content--active") && node.querySelector("div.v-card__title > span.headline").innerText === "Join Courtroom") {
                if (ui.joinBox_container = node.querySelector("div.v-dialog > div.v-card")) {
                    ui.joinBox_usernameInput = ui.joinBox_container.querySelector("form > div.v-card__text > div.row:first-of-type > div.col > div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input");
                    ui.joinBox_passwordInput = ui.joinBox_container.querySelector("form > div.v-card__text > div.row:nth-of-type(2) > div.col > div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input");
                    ui.joinBox_spectateButton = ui.joinBox_container.querySelector("form > div.v-card__actions > button:first-of-type");
                    ui.joinBox_joinButton = ui.joinBox_container.querySelector("form > div.v-card__actions > button:last-of-type");

                    // When "Spectate" button is clicked
                    ui.joinBox_spectateButton.addEventListener("click", e => {
                        ui.spectating = true;
                    });

                    // When "Join" button is clicked
                    ui.joinBox_joinButton.addEventListener("click", e => {
                        ui.spectating = false;
                    });

                    // When "Enter" is pressed in the username input box
                    ui.joinBox_usernameInput.addEventListener("keydown", e => {
                        if (ui.joinBox_usernameInput.value && (e.keyCode == 13 || e.key == "Enter")) {
                            ui.joinBox_joinButton.click();
                        }
                    });

                    // When "Enter" is pressed in the password input box
                    if (ui.joinBox_passwordInput) {
                        ui.joinBox_passwordInput.addEventListener("keydown", e => {
                            if (ui.joinBox_usernameInput.value && (e.keyCode == 13 || e.key == "Enter")) {
                                ui.joinBox_joinButton.click();
                            }
                        });
                    }

                    if (scriptSetting.remember_username) {
                        ui.joinBox_usernameInput.value = storedUsername;
                        ui.joinBox_usernameInput.dispatchEvent(new Event("input"));
                    }
                }
            }
        }

        for (const node of change.removedNodes) {
            if (ui.joinBox_container && node === ui.joinBox_container.parentNode.parentNode) {
                observer.disconnect();
                if (scriptSetting.remember_username) {
                    setStoredUsername(ui.joinBox_usernameInput.value);
                }
                onCourtroomJoin();
            }
        }
    }
}

function onCourtroomJoin() {
    ui.main = ui.app.querySelector("div > div.container > main > div.v-main__wrap > div");
    ui.leftFrame_container = ui.main.firstChild.firstChild;

    if (ui.spectating) {
        if (!ui.leftFrame_joinRoomButton) {
            ui.leftFrame_joinRoomButton = ui.leftFrame_container.querySelector("div > div:last-of-type > div.text-right > button");
            ui.leftFrame_joinRoomButton.addEventListener("click", f => {
                (new MutationObserver(checkJoinBoxReady)).observe(document, {childList: true, subtree: true});
            }, true);
        }
        return;
    }

    ui.leftFrame_textarea = ui.leftFrame_container.querySelector("div textarea.frameTextarea");
    ui.leftFrame_sendButton = ui.leftFrame_container.querySelector("div > div:nth-child(4) > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div:last-of-type > button.v-btn > span.v-btn__content > i.mdi-send").parentNode.parentNode;
    ui.leftFrame_currentChar = ui.leftFrame_container.querySelector("div > div:nth-child(2) > div.col-sm-3.col-2 > div");

    ui.courtroom_container = ui.leftFrame_container.querySelector("div.court-container > div.courtroom");
    ui.courtroom_chatBoxes = ui.courtroom_container.querySelector("div.fade_everything").previousSibling;

    ui.rightFrame_container = ui.main.firstChild.lastChild.firstChild;
    ui.rightFrame_toolbarContainer = ui.rightFrame_container.querySelector("div.v-card.v-sheet > header.v-toolbar > div.v-toolbar__content");

    ui.rightFrame_toolbarGetTabs = function() {
        ui.rightFrame_toolbarTabs = ui.rightFrame_toolbarContainer.querySelector("div.v-tabs > div[role=tablist] > div.v-slide-group__wrapper > div.v-slide-group__content.v-tabs-bar__content")
        if (ui.rightFrame_toolbarTabs) {
            for (const toolbarTab of ui.rightFrame_toolbarTabs.querySelectorAll("div.v-tab")) {
                switch (toolbarTab.textContent.trim().toUpperCase()) {
                    case "CHAT LOG":
                        ui.rightFrame_toolbarTabChatLog = toolbarTab;
                        break;
                    case "EVIDENCE":
                        ui.rightFrame_toolbarTabEvidence = toolbarTab;
                        break;
                    case "BACKGROUNDS":
                        ui.rightFrame_toolbarTabBackgrounds = toolbarTab;
                        break;
                    case "SETTINGS":
                        ui.rightFrame_toolbarTabSettings = toolbarTab;
                        break;
                    case "ADMIN":
                        ui.rightFrame_toolbarTabAdmin = toolbarTab;
                        break;
                    default:
                        console.log("Toolbar tab not found: " + toolbarTab.innerText);
                }
            }
        }
    }();

    ui.chatLog_container = ui.rightFrame_container.querySelector("div.v-card.v-sheet > div.v-window.v-item-group > div.v-window__container > div.v-window-item:first-of-type");
    ui.chatLog_chat = ui.chatLog_container.querySelector("div > div.chat");
    ui.chatLog_chatList = ui.chatLog_chat.querySelector("div.v-list");
    ui.chatLog_textField = ui.chatLog_container.querySelector("div.v-window-item > div > div:nth-child(2) > div > div > div > div.v-text-field__slot > input[type=text]");

    ui.evidence_container = ui.rightFrame_container.querySelector("div.v-card.v-sheet > div.v-window.v-item-group > div.v-window__container > div.v-window-item:nth-of-type(2)");
    ui.evidence_form = ui.evidence_container.querySelector("div > form");
    ui.evidence_formFields = ui.evidence_form.querySelectorAll("div:first-of-type input");
    ui.evidence_formBottomRow = ui.evidence_form.lastChild;
    ui.evidence_formBottomRow_buttonsColumn = ui.evidence_formBottomRow.firstChild;
    ui.evidence_addButton = ui.evidence_formBottomRow_buttonsColumn.querySelector("button.mr-2.v-btn.success");
    ui.evidence_list = ui.evidence_container.querySelector("div > div.row:last-of-type");

    ui.settings_container = ui.rightFrame_container.querySelector("div.v-card.v-sheet > div.v-window.v-item-group > div.v-window__container > div.v-window-item:nth-of-type(4)");
    ui.settings_usernameChangeInput = ui.settings_container.querySelector("div > div > div div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input[type=text]");
    ui.settings_switchDiv = ui.settings_container.querySelector("div > div:nth-child(2) > div > div.v-input--switch").parentNode.parentNode;
    ui.settings_separator = ui.settings_container.querySelector("div > hr:last-of-type");
    ui.settings_keyboardShortcutsHeader = ui.settings_container.querySelector("div > h3:first-of-type");
    ui.settings_keyboardShortcutsWS = ui.settings_keyboardShortcutsHeader.nextSibling.nextSibling.nextSibling;
    ui.settings_keyboardShortcutsAD = ui.settings_keyboardShortcutsWS.nextSibling;

    window.addEventListener("beforeunload", on_beforeUnload, false);

    // Handle username changes and update the stored username
    const on_usernameChange = function(name) {
        // Delay check
        setStoredUsername(name);
    };

    ui.settings_usernameChangeInput.addEventListener("blur", e => {
        on_usernameChange(e.target.value);
    }, true);

    ui.settings_usernameChangeInput.addEventListener("keydown", e => {
        if (e.keyCode == 13 || e.key == "Enter") {
            on_usernameChange(e.target.value);
        }
    });

    ui.evidence_list.style.maxHeight = "70vh";
    ui.evidence_list.style.scrollBehavior = "smooth";

    // Look for Dialog windows
    const myAssetsWatcher = {
        on_myAssetsAdded(node) {
            const tabsContainer = node.querySelector("div.v-dialog > div.v-card > div.v-window > div.v-window__container");
            this.element = node;
            this.observer = new MutationObserver(this.on_myAssetsListChange.bind(this))
            this.observer.observe(tabsContainer, {childList: true});
        },
        on_myAssetsListChange(changes, observer) {
            const node = this.element;
            for (const change of changes) {
                for (const addedNode of change.addedNodes) {
                    const activeTab = node.querySelector("div.v-dialog > div.v-card > div.v-tabs > div.v-tabs-bar > div > div.v-tabs-bar__content > div.v-tab.v-tab--active");
                    const activeWindow = addedNode.parentNode.childNodes[Array.from(activeTab.parentNode.children).indexOf(activeTab)-1];
                    switch (activeTab.firstChild.firstChild.textContent.trim().toUpperCase()) {
                        case "BACKGROUNDS":
                            break;
                        case "CHARACTERS":
                            break;
                        case "POPUPS":
                            break;
                        case "MUSIC":
                            ui.musicFilePicker = new ui.Uploader.filePicker(uploaderResponse => {
                                const inputName = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(1) div.v-text-field__slot > input[type=text]");
                                const inputURL = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(2) div.v-text-field__slot > input[type=text]");
                                inputName.value = uploaderResponse.filename;
                                inputName.dispatchEvent(new Event("input"));
                                inputURL.value = uploaderResponse.url;
                                inputURL.dispatchEvent(new Event("input"));
                            }, {label: "music", icon: "file-music", acceptedhtml:"audio/*", acceptedregex:"^audio/", maxsize: 25e6, pastetargets:activeWindow.querySelectorAll("input[type=text]")});
                            activeWindow.querySelector("div.v-card__actions").prepend(ui.musicFilePicker);
                            break;
                        case "SOUNDS":
                            ui.soundFilePicker = new ui.Uploader.filePicker(uploaderResponse => {
                                const inputName = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(1) div.v-text-field__slot > input[type=text]");
                                const inputURL = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(2) div.v-text-field__slot > input[type=text]");
                                inputName.value = uploaderResponse.filename;
                                inputName.dispatchEvent(new Event("input"));
                                inputURL.value = uploaderResponse.url;
                                inputURL.dispatchEvent(new Event("input"));
                            }, {label: "sound", icon: "file-music", acceptedhtml:"audio/*", acceptedregex:"^audio/", maxsize: 25e6, pastetargets:activeWindow.querySelectorAll("input[type=text]")});
                            activeWindow.querySelector("div.v-card__actions").prepend(ui.soundFilePicker);
                            break;
                        default:
                            console.log("My Assets tab not found: " + activeTab.firstChild.firstChild.textContent);
                    }
                }
            }
        },
        on_myAssetsRemoved(node) {
            this.observer.disconnect();
        }
    };

    (new MutationObserver(on_appNodeListChange)).observe(ui.app, {childList: true});
    function on_appNodeListChange(changes, observer) {
        for (const change of changes) {
            for (const node of change.addedNodes) {
                if (node.classList.contains("v-dialog__content")) {
                    const closeButton = node.querySelector("header.v-sheet.v-toolbar > div.v-toolbar__content > div.v-toolbar__items > button.v-btn:last-of-type");
                    const dialogCard = node.querySelector("div.v-dialog > div.v-card");
                    if (dialogCard.childNodes.length == 3 &&
                        dialogCard.childNodes[1] instanceof HTMLImageElement &&
                        dialogCard.childNodes[1].className == "d-flex mx-auto" &&
                        (dialogCard.childNodes[2] instanceof Comment || (dialogCard.childNodes[2] instanceof HTMLDivElement && dialogCard.childNodes[2].classList.contains("subtitle-1")))) {
                        const img = dialogCard.childNodes[1];
                        img.style.maxWidth = "100%";
                        img.style.maxHeight = "80vh";
                        img.addEventListener("load", e => {
                            if (img.naturalHeight > img.height || img.naturalWidth > img.width) {
                                img.style.cursor = "zoom-in";
                                img.addEventListener("click", e => {
                                    if (e.target.style.cursor == "zoom-out") {
                                        e.target.style.maxWidth = "100%";
                                        e.target.style.maxHeight = "80vh";
                                        e.target.style.cursor = "zoom-in";
                                    } else {
                                        e.target.style.maxWidth = "";
                                        e.target.style.maxHeight = "";
                                        e.target.style.cursor = "zoom-out";
                                    }
                                });
                            }
                        });
                    } else {
                        const dialogTitle = node.querySelector("header.v-sheet > div.v-toolbar__content > div.v-toolbar__title").textContent.trim().toUpperCase();
                        switch (dialogTitle) {
                            case "PAIRING":
                                break;
                            case "CHANGE CHARACTER":
                                break;
                            case "MANAGE CHARACTER":
                                break;
                            case "MY ASSETS":
                                myAssetsWatcher.on_myAssetsAdded(node);
                                break;
                        }
                    }
                }
            }
            for (const node of change.removedNodes) {
                if (node === myAssetsWatcher.element) {
                    myAssetsWatcher.on_myAssetsRemoved(node);
                }
            }
        }
    }

    const createButton = function(options) {
        const container = document.createElement("div");
        const button = document.createElement("button");

        button.setAttributes({
            className: "v-btn v-btn--has-bg v-size--small theme--dark",
            type: "button",
            title: options.title || "",
            style: {
                backgroundColor: options.backgroundColor || "rgb(184 39 146)"
            }
        });
        button.addEventListener("click", options.onclick.bind(this));

        const label = document.createElement("span");
        label.setAttributes({
            className: "v-btn__content"
        });

        label.textContent = options.label;

        if (options.icon) {
            const icon = document.createElement("i");
            icon.setAttributes({
                className: "v-icon v-icon--left mdi mdi-" + options.icon + " theme--dark"
            });
            label.firstChild.before(icon);
        }

        if (options.display === false) {
            container.style.display = "none";
        }

        button.appendChild(label);
        container.appendChild(button);

        return container;
    }

    // Evidence tab enhancements
    const enhanceEvidenceTab = function() {
        // Pressing the Enter key on the form fields clicks the "Add" button
        ui.evidence_formFields.forEach(f => {
            f.addEventListener("keydown", e => {
                if (e.keyCode == 13 || e.key == "Enter") {
                    ui.evidence_addButton.focus();
                }
            });
        });

        // Clicking the "Add" button fills the "Name" tab with a space if it's empty
        ui.evidence_addButton.addEventListener("click", e => {
            if (ui.evidence_formFields[0].value.length == 0) {
                ui.evidence_formFields[0].value = String.fromCharCode(32);
                ui.evidence_formFields[0].dispatchEvent(new Event("input"));
            }
            e.target.blur();
            if (ui.evidence_list.childElementCount) {
                setTimeout(f => {ui.evidence_list.scrollTop = ui.evidence_list.scrollHeight;}, 250);
            }
        }, true);

        // Add evidence sources

        ui.Uploader = {
            parseForm(data) {
                const form = new FormData();
                Object.entries(data).filter(([key, value]) => value !== null).map(([key, value]) => form.append(key, value));
                return form;
            },
            parseParams(data) {
                return Object.entries(data).map(([key, val]) => `${key}=${val}`).join('&');
            },
            hostApis: new Map([
                ["catbox", {
                    method: "POST",
                    formatDataFile(data) {
                        return {
                            headers: {},
                            data: ui.Uploader.parseForm({reqtype: "fileupload", fileToUpload: data})
                        }
                    },
                    formatDataUrl(data) {
                        return {
                            headers: {},
                            data: ui.Uploader.parseForm({reqtype: "urlupload", url: data})
                        }
                    },
                    urlFromResponse(response) {
                        return response.toString();
                    }
                }],
                ["lolisafe", {
                    method: "POST",
                    formatDataFile(data) {
                        return {
                            headers: {},
                            data: ui.Uploader.parseForm({"files[]": data})
                        }
                    },
                    formatDataUrl(data) {
                        return {
                            headers: {"Content-type": "application/x-www-form-urlencoded"},
                            data: ui.Uploader.parseParams({"urls[]": data})
                        }
                    },
                    urlFromResponse(response) {
                        const responseJSON = JSON.parse(response);
                        if (!responseJSON.success) {
                            throw new Error("Server returned " + responseJSON.description);
                        }
                        for (const file of responseJSON.files) {
                            if (file.url) {
                                return file.url;
                            }
                        }
                    }
                }]
                ]),
            fileHosts: new Map([
                ["catboxmoe", {
                    name: "catbox.moe",
                    url: "https://catbox.moe/user/api.php",
                    api: "catbox",
                    supported: new Map([["audio", true], ["urls", true], ["m4a", true]])
                }],
                ["uguuse", {
                    name: "uguu.se",
                    url: "https://uguu.se/upload.php",
                    api: "lolisafe",
                    supported: new Map([["audio", true], ["urls", false], ["m4a", true]])
                }],
                ["pomflainla", {
                    name: "pomf.lain.la",
                    url: "https://pomf.lain.la/upload.php",
                    api: "lolisafe",
                    supported: new Map([["audio", true], ["urls", false], ["m4a", true]])
                }],
                ["zzht", {
                    name: "zz.ht",
                    url: "https://zz.ht/api/upload",
                    api: "lolisafe",
                    supported: new Map([["audio", true], ["urls", true], ["m4a", false]])
                }],
                ["imoutokawaii", {
                    name: "imouto.kawaii.su",
                    url: "https://imouto.kawaii.su/api/upload",
                    api: "lolisafe",
                    supported: new Map([["audio", false], ["urls", true], ["m4a", false]])
                }],
                ["takemetospace", {
                    name: "take-me-to.space",
                    url: "https://take-me-to.space/api/upload",
                    api: "lolisafe",
                    supported: new Map([["audio", true], ["urls", false], ["m4a", false]])
                }]
            ]),

            upload: function (file, callbackSuccess, callbackError) {
                const hostFallback = new Map([["base", "zzht"], ["audio", "zzht"], ["urls", "imoutokawaii"], ["m4a", "uguuse"]]);
                var dataToUpload, filename, fileHost = (this.fileHosts.has(scriptSetting.file_host) ? scriptSetting.file_host : hostFallback.get("base"));

                if (typeof file === "string") { // Argument passed is an URL
                    let url = new URL(file);
                    switch (url.host) {
                        case "pbs.twimg.com":
                            url.href = url.origin + url.pathname + "." + (url.searchParams.get("format") || "jpg") + "?name=" + (url.searchParams.get("name") || "orig");
                            break;
                    }
                    if (this.fileHosts.get(fileHost).supported.get("urls") === false) {
                        fileHost = hostFallback.get("urls");
                    }
                    dataToUpload = this.hostApis.get(this.fileHosts.get(fileHost).api).formatDataUrl(url.href);
                    filename = ((url.pathname.substring(0, url.pathname.lastIndexOf('.')) || url.pathname).replace(/^.*[\\\/]/, ''));
                } else if (typeof file === "object" && file instanceof File) { // Argument is a file
                    if (file.type.match("^audio/") && this.fileHosts.get(fileHost).supported.get("audio") === false) {
                        fileHost = hostFallback.get("audio");
                    }
                    if (file.type == "audio/x-m4a" && this.fileHosts.get(fileHost).supported.get("m4a") === false) { // fix for broken m4a support
                        fileHost = hostFallback.get("m4a");
                    }
                    dataToUpload = this.hostApis.get(this.fileHosts.get(fileHost).api).formatDataFile(file);
                    filename = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
                } else {
                    throw new Error("Invalid data");
                }
                CrossOrigin({
                    url: this.fileHosts.get(fileHost).url,
                    method: this.hostApis.get(this.fileHosts.get(fileHost).api).method,
                    headers: dataToUpload.headers,
                    data: dataToUpload.data,
                    onload: response => {
                        if (response.readyState == 4 && response.status == 200 || response.status == 400) {
                            try {
                                callbackSuccess({
                                    url: new URL(this.hostApis.get(this.fileHosts.get(fileHost).api).urlFromResponse(response.responseText)).href,
                                    filename: filename || "file"
                                });
                            } catch (e) {
                                callbackError(e.toString());
                            }
                        } else {
                            callbackError("Err " + response.status + ": " + response.responseText);
                        }
                    },
                    onabort: response => {
                        callbackError("Aborted" + response.responseText);
                    },
                    onerror: response => {
                        callbackError("Error" + response.responseText);
                    },
                    ontimeout: response => {
                        callbackError("Timeout" + response.responseText);
                    }
                });
            },

            filePicker: function(callback, options) {
                this.label = options.label || "image";
                this.icon = options.icon || "image-size-select-large";
                this.acceptedhtml = options.acceptedhtml || "image/*";
                this.acceptedregex = options.acceptedregex || "^image/";
                this.maxsize = options.maxsize || 2e6;

                const resetElem = (function() {
                    elemContainer.setAttributes({
                        title: "",
                        firstChild: {className: "v-icon v-icon--left mdi mdi-" + this.icon},
                        lastChild: {textContent: "Upload " + this.label},
                        style: {
                            borderColor: "teal",
                            pointerEvents: "auto",
                            cursor: "pointer"
                        }
                    });
                }).bind(this);

                const uploadError = function(errorText) {
                    elemContainer.setAttributes({
                        title: errorText,
                        firstChild: {className: "v-icon v-icon--left mdi mdi-alert"},
                        lastChild: {textContent: errorText.substr(0, 100)},
                        style: {
                            borderColor: "red",
                            pointerEvents: "auto",
                            cursor: "not-allowed"
                        }
                    });
                    setTimeout(resetElem, 3000);
                    ui.Logger.log(errorText);
                }

                const uploadCallbackSuccess = function() {
                    resetElem();
                    callback.apply(this, arguments);
                };

                const elemContainer = document.createElement("div");
                elemContainer.setAttributes({
                    className: "d-flex justify-center px-2",
                    style: {
                        alignItems: "center",
                        minWidth: "140px",
                        border: "2px dashed teal",
                        userSelect: "none",
                        cursor: "pointer"
                    }
                });

                const elemIcon = document.createElement("i");
                elemIcon.className = "v-icon v-icon--left mdi mdi-" + this.icon;
                elemContainer.appendChild(elemIcon);
                elemIcon.after(document.createTextNode("Upload " + this.label));

                const elemFile = document.createElement("input");
                elemFile.setAttributes({
                    type: "file",
                    accept: this.acceptedhtml,
                    style: {opacity: 0}
                });

                elemContainer.addEventListener("click", e => {
                    elemFile.click();
                });

                const uploaderElementEvent = function(e) {
                    try {
                        var dataList, file;
                        if (e instanceof Event && e.type === "change" && e.target.files instanceof FileList && e.target.files.length > 0) {
                            dataList = e.target.files;
                        } else if (e instanceof DragEvent && e.type === "drop" && e.dataTransfer instanceof DataTransfer) {
                            if (e.dataTransfer.files instanceof FileList && e.dataTransfer.files.length > 0) { // File dropped
                                dataList = e.dataTransfer.files;
                            } else if (e.dataTransfer.items instanceof DataTransferItemList && e.dataTransfer.items.length > 0) { // URL dropped
                                dataList = e.dataTransfer.items;
                            }
                        } else if (e instanceof ClipboardEvent && e.type === "paste") {
                            if (e.clipboardData instanceof DataTransfer && e.clipboardData.files instanceof FileList && e.clipboardData.files.length > 0) { // File pasted
                                dataList = e.clipboardData.files;
                            }
                        }

                        if (!dataList) {
                            return;
                        }

                        e.preventDefault();

                        if (dataList instanceof FileList) {
                            for (const data of dataList) {
                                if (!data.type.match(this.acceptedregex)) {
                                    throw new Error("File type");
                                }
                                if (data.size >= this.maxsize) {
                                    throw new Error("Max size: " + this.maxsize / 1e6 + "MB");
                                }
                                file = data;
                                break;
                            }
                        } else if (dataList instanceof DataTransferItemList) {
                            for (const data of dataList) {
                                if (data.kind === "string") {
                                    if (data.type.match("^text/uri")) {
                                        file = data;
                                        break;
                                    }
                                } else if (data.kind === "file") {
                                    file = data.getAsFile();
                                    break;
                                } else {
                                    throw new Error("Invalid kind");
                                }
                            }
                        } else {
                            throw new Error("Invalid dataList");
                        }

                        elemContainer.setAttributes({
                            firstChild: {className: "v-icon v-icon--left mdi mdi-progress-upload"},
                            lastChild: {textContent: "Uploading"},
                            style: {
                                borderColor: "yellow",
                                pointerEvents: "none",
                            }
                        });
                        if (file instanceof File) {
                            ui.Uploader.upload(file, uploadCallbackSuccess, uploadError);
                        } else if (file instanceof DataTransferItem && file.kind == "string") {
                            file.getAsString(url => {
                                ui.Uploader.upload(url, uploadCallbackSuccess.bind(this), uploadError.bind(this));
                            });
                        } else {
                            throw new Error("Invalid file");
                        }
                    } catch (e) {
                        uploadError(e.toString());
                    }
                }

                elemFile.addEventListener("change", uploaderElementEvent.bind(this));
                elemContainer.addEventListener("drop", uploaderElementEvent.bind(this));

                elemContainer.addEventListener("dragover", e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "red";
                });

                elemContainer.addEventListener("dragleave", e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "teal";
                });

                if (options.pastetargets) {
                    if (options.pastetargets instanceof Node) {
                        options.pastetargets.addEventListener("paste", e =>{ uploaderElementEvent.bind(this, e)});
                    } else if (options.pastetargets instanceof NodeList) {
                        options.pastetargets.forEach(f => {f.addEventListener("paste", e => { uploaderElementEvent.call(this, e);});})
                    }
                }

                return elemContainer;
            }
        };

        const createEvidenceUploaders = {
            init: function() {
                const container = document.createElement("div");
                container.setAttributes({
                    className: "d-flex justify-center",
                    style: {
                        gap: "8px",
                        flex: "2 1 auto",
                    }
                });

                const evidenceImageUploader = new ui.Uploader.filePicker(res => {
                    ui.evidence_formFields[0].value = res.filename.substr(0, 20);
                    ui.evidence_formFields[0].dispatchEvent(new Event("input"));
                    ui.evidence_formFields[1].value = res.url;
                    ui.evidence_formFields[1].dispatchEvent(new Event("input"));
                }, {label: "image", icon: "image-size-select-large", acceptedhtml:"image/*", acceptedregex:"^image/", maxsize: 2e6, pastetargets: ui.evidence_formFields});

                evidenceImageUploader.setAttributes({
                    style: {
                        alignSelf: "flex-end",
                        height: "36px"
                    }
                });

                // Upload by gelbooru tags
                const gelbooruUploader = document.createElement("div");
                gelbooruUploader.setAttributes({
                    className: "d-flex",
                    style: {
                        alignItems: "center"
                    }
                });

                const gelbooruIcon = document.createElement("img");
                gelbooruIcon.setAttributes({
                    src: "https://gelbooru.com/favicon.png",
                    title: "Gelbooru",
                    className: "v-icon v-icon--left",
                    style: {
                        cursor: "pointer"
                    }
                });

                const gelbooruTagsContainer = document.createElement("div");
                gelbooruTagsContainer.setAttributes({
                    style: {
                        display: "none",
                        gap: "5px"
                    }
                });

                const gelbooruInputTags = document.createElement("input");
                gelbooruInputTags.setAttributes({
                    maxLength: "255",
                    placeholder: "Ex: blue_sky cloud 1girl",
                    style: {
                        borderBottom: "1px solid white",
                        color: "white"
                    }
                });

                const gelbooruBtnSend = document.createElement("div");
                gelbooruBtnSend.setAttributes({
                    className: "mdi mdi-send",
                    style: {cursor: "pointer"}
                });

                gelbooruTagsContainer.append(gelbooruInputTags, gelbooruBtnSend);
                gelbooruUploader.append(gelbooruIcon, gelbooruTagsContainer);

                gelbooruIcon.addEventListener("click", e => {
                    var state = gelbooruTagsContainer.classList.toggle("d-flex");
                    gelbooruTagsContainer.classList.toggle("d-none");
                    evidenceImageUploader.classList.toggle("d-flex");
                    evidenceImageUploader.classList.toggle("d-none");
                    if (state) {
                        gelbooruInputTags.focus();
                    }
                });

                gelbooruInputTags.addEventListener("keydown", e => {
                    if (e.target.value && (e.keyCode == 13 || e.key == "Enter")) {
                        gelbooruBtnSend.click();
                    }
                });

                const gelbooruUploaderError = function(error = "Error") {
                    const errorText = (error instanceof Error || typeof error === "string") ? error.toString() : (error.responseText || "Error");
                    gelbooruInputTags.value = errorText;
                    gelbooruInputTags.style.color = "white";
                    gelbooruInputTags.disabled = false;
                    gelbooruInputTags.addEventListener("focus", e => {
                        e.target.value = "";
                    }, {once: true});
                    ui.Logger.log(errorText);
                }

                gelbooruBtnSend.addEventListener("click", e => {
                    var tags = gelbooruInputTags.value;
                    if (!tags || tags.length === 0) { gelbooruInputTags.focus(); return; }
                    gelbooruInputTags.value = "Uploading...";
                    gelbooruInputTags.style.color = "grey";
                    gelbooruInputTags.disabled = true;
                    CrossOrigin({
                        url: "https://gelbooru.com/index.php?page=dapi&json=1&s=post&q=index&limit=1&tags=" + encodeURIComponent(tags + " -video -huge_filesize -absurdres -incredibly_absurdres sort:random"),
                        method: "GET",
                        onload: getterResponse => {
                            try {
                                if (getterResponse.readyState == 4 && getterResponse.status == 200) {
                                    var responseJSON = JSON.parse(getterResponse.responseText);
                                    if (!responseJSON.post) {
                                        throw new Error("No results");
                                    }
                                    ui.Uploader.upload(responseJSON.post[0].file_url, uploaderResponse => {
                                        try {
                                            ui.evidence_formFields[0].value = responseJSON.post[0].id;
                                            ui.evidence_formFields[0].dispatchEvent(new Event("input"));
                                            ui.evidence_formFields[1].value = uploaderResponse.url;
                                            ui.evidence_formFields[1].dispatchEvent(new Event("input"));
                                            gelbooruInputTags.value = "";
                                            gelbooruInputTags.style.color = "white";
                                            gelbooruInputTags.disabled = false;
                                            gelbooruIcon.click();
                                            setTimeout(f => {ui.evidence_addButton.click()}, 500);
                                        } catch (e) {
                                            throw (e);
                                        }
                                    }, gelbooruUploaderError);
                                }
                            } catch(e) {
                                gelbooruUploaderError(e);
                            }
                        },
                        onerror: gelbooruUploaderError
                    });
                });

                container.append(evidenceImageUploader, gelbooruUploader);

                return container;
            }
        };

        ui.evidence_evidenceUploaders = createEvidenceUploaders.init();
        ui.evidence_formBottomRow.append(ui.evidence_formBottomRow_buttonsColumn, ui.evidence_evidenceUploaders);
        ui.evidence_formBottomRow.classList.remove("pb-1");
        ui.evidence_formBottomRow.classList.add("align-center", "pb-2");
        ui.evidence_formBottomRow_buttonsColumn.className = "d-flex";

        // Show evidence count
        const evidenceCounter = {
            updateCount: function() {
                const evidMax = 75, evidCount = Math.max(ui.evidence_list.childElementCount, 0);
                if (evidCount == evidMax) {
                    this.text.className = "mdi mdi-alert error--text";
                } else if (evidCount / evidMax > 0.9) {
                    this.text.className = "warning--text";
                } else {
                    this.text.className = "success--text";
                }
                this.text.textContent = evidCount + " / " + evidMax;
            },
            init: function() {
                this.container = document.createElement("div");
                this.text = document.createElement("div");
                this.container.className = "d-flex";
                this.container.appendChild(this.text);
                this.updateCount();
                return this.container;
            }
        };

        ui.evidence_evidenceCounter = evidenceCounter.init();
        evidenceCounter.updateCount(20);
        ui.evidence_formBottomRow.appendChild(ui.evidence_evidenceCounter);

        // Adjust evidence items
        ui.evidence_list.fixEvidenceItem = function(node) {
            const divCard = node.firstChild;
            const divImage = divCard.querySelector("div.v-image");
            const divTitle = divCard.querySelector("div.v-card__title");
            const divSubtitle = divCard.querySelector("div.v-card__subtitle");
            const divActions = divCard.querySelector("div.v-card__actions");
            const buttonEye = divActions.querySelector("button > span.v-btn__content > i.mdi-eye").parentNode.parentNode;


            divCard.addEventListener("mouseenter", e => {
                const image = e.target.querySelector("div.v-image__image");
                image.classList.add("v-image__image--contain");
                image.classList.remove("v-image__image--cover");

                divActions.style.visibility = "visible";
                divActions.style.opacity = "1";
            });
            divCard.addEventListener("mouseleave", e => {
                const image = e.target.querySelector("div.v-image__image");
                image.classList.remove("v-image__image--contain");
                image.classList.add("v-image__image--cover");

                divActions.style.visibility = "hidden";
                divActions.style.opacity = "0";
            });

            divImage.style.cursor = "pointer";
            divImage.style.height = "200px";
            divImage.addEventListener("click", e => {
                if (divActions.contains(e.target)) {
                    return;
                }
                buttonEye.click();
            }, true);

            divTitle.setAttributes({
                style: {
                    textShadow: "2px 1px #000000",
                    padding: "4px"
                }
            });

            divSubtitle.setAttributes({
                style: {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    padding: "6px"
                }});
            divSubtitle.insertAdjacentElement("beforebegin", divActions);

            divActions.setAttributes({
                style: {
                    backgroundColor: "rgb(40, 40, 40)",
                    opacity: "0",
                    visibility: "hidden",
                    position: "absolute",
                    width: "100%",
                    height: "34px",
                    transition: "opacity 0.1s ease-in-out 0s"
                }
            });

            buttonEye.style.display = "none";
        };

        (new MutationObserver(on_evidenceListChange)).observe(ui.evidence_list, {childList: true});
        function on_evidenceListChange(changes, observer) {
            evidenceCounter.updateCount();
            for (const change of changes) {
                for (const node of change.addedNodes) {
                    ui.evidence_list.fixEvidenceItem(node);
                }
            }
        }
    }();

    // Add setting options under the Settings tab
    var enhanceSettingsTab = function() {
        const createInputCheckbox = function(options) {
            const container = document.createElement("div");
            const inputControl = document.createElement("div");
            const inputSlot = document.createElement("div");
            const selectSlot = document.createElement("div");
            const label = document.createElement("label");
            const icon = document.createElement("i");
            const input = document.createElement("input");

            container.title = options.title || "";
            inputControl.className = "v-input__control";
            inputSlot.className = "v-input__slot mb-0";
            selectSlot.className = "v-input--selection-controls__input mr-0";
            label.setAttributes({
                className: "v-label pointer-item"
            });
            icon.setAttributes({
                className: "v-icon notranslate mdi " + (options.checked ? "mdi-checkbox-marked primary--text" : "mdi-checkbox-blank-outline")
            });
            input.setAttributes({
                className: "v-input--selection-controls__input",
                checked: options.checked || false,
                type: "checkbox"
            });
            input.setAttribute("role", "checkbox");
            container.appendChild(inputControl);
            inputControl.appendChild(inputSlot);
            inputSlot.append(selectSlot, label);
            selectSlot.append(icon, input);

            if (options.display === false) {
                container.style.display = "none";
            }

            label.textContent = options.label || "Button";

            label.addEventListener("click", e => {
                input.click();
            });

            input.addEventListener("change", e => {
                icon.classList.toggle("mdi-checkbox-blank-outline", !e.target.checked);
                icon.classList.toggle("mdi-checkbox-marked", e.target.checked);
                icon.classList.toggle("primary--text", e.target.checked);
                options.onchange.call(this, e);
            });

            return container;
        }

        const createInputText = function(options) {
            const container = document.createElement("div");
            const inputControl = document.createElement("div");
            const inputSlot = document.createElement("div");
            const selectSlot = document.createElement("div");
            const label = document.createElement("label");
            const input = document.createElement("input");

            container.className = "v-input v-input--dense v-text-field";
            inputControl.className = "v-input__control";
            inputSlot.className = "v-input__slot mb-0";
            selectSlot.className = "v-select__slot";
            label.setAttributes({
                className: "v-label v-label--active theme--dark",
                style: {
                    left: "0px",
                    right: "auto",
                    position: "absolute"
                }
            });
            input.setAttributes({
                className: "v-select__selections pa-0 mr-0",
                type: options.type,
                style: {color: "white", backgroundColor: "#1e1e1e", lineHeight: "18px"}
            });

            container.appendChild(inputControl);
            inputControl.appendChild(inputSlot);
            inputSlot.appendChild(selectSlot);
            selectSlot.append(label, input);

            if (options.display === false) {
                container.style.display = "none";
            }

            label.textContent = options.label;
            input.value = options.value;

            input.addEventListener("focus", function(e) {
                container.classList.add("v-input--is-focused","primary--text");
                label.classList.add("primary--text");
            });

            input.addEventListener("focusout", function (e) {
                container.classList.remove("v-input--is-focused", "primary--text");
                label.classList.remove("primary--text");
                options.onfocusout.call(this, e);
            });

            return container;
        }

        const createInputSelect = function(options) {
            const container = document.createElement("div");
            const inputControl = document.createElement("div");
            const inputSlot = document.createElement("div");
            const selectSlot = document.createElement("div");
            const label = document.createElement("label");
            const select = document.createElement("select");

            container.className = "v-input v-input--dense v-text-field";
            container.style.flex = "0 0 auto";
            inputControl.className = "v-input__control";
            inputSlot.className = "v-input__slot";
            inputSlot.style.cursor = "default";
            selectSlot.className = "v-select__slot";
            label.setAttributes({
                className: "v-label v-label--active theme--dark",
                style: {
                    left: "0px",
                    right: "auto",
                    position: "absolute"
                }
            });
            select.setAttributes({
                className: "v-select__selections",
                style: {color: "white", backgroundColor: "#1e1e1e"}
            });

            container.appendChild(inputControl);
            inputControl.appendChild(inputSlot);
            inputSlot.appendChild(selectSlot);
            selectSlot.append(label, select);

            if (options.display === false) {
                container.style.display = "none";
            }

            label.textContent = options.label;
            options.values.forEach(([key, value]) => {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = value;
                option.selected = (key === options.selectedValue);
                select.appendChild(option);
            });

            select.addEventListener("change", e => {
                options.onchange.call(this, e);
            });

            return container;
        };

        ui.extraSettings_warnOnExit = new createInputCheckbox({
            checked: scriptSetting.warn_on_exit,
            label: "Confirm on exit",
            onchange: e => {
                setSetting("warn_on_exit", e.target.checked);
            }
        });

        ui.extraSettings_rememberUsername = new createInputCheckbox({
            checked: scriptSetting.remember_username,
            label: "Remember username",
            onchange: e => {
                setSetting("remember_username", e.target.checked);
            }
        });

        ui.extraSettings_showConsole = new createInputCheckbox({
            checked: scriptSetting.show_console,
            label: "Show console",
            onchange: e => {
                const value = e.target.checked;
                setSetting("show_console", value);
                ui.Logger.toggle(value);
            }
        });

        ui.extraSettings_adjustChatTextWithWheel = new createInputCheckbox({
            checked: scriptSetting.adjust_chat_text_with_wheel,
            label: "Scroll to resize chat",
            onchange: e => {
                const value = e.target.checked;
                setSetting("adjust_chat_text_with_wheel", value);
                if (value) {
                    ui.courtroom_chatBoxes.addEventListener("wheel", on_chatBoxTextWheel);
                } else {
                    ui.courtroom_chatBoxes.removeEventListener("wheel", on_chatBoxTextWheel);
                }
            }
        });

        ui.extraSettings_chatHoverTooltip = new createInputCheckbox({
            checked: scriptSetting.chat_hover_tooltip,
            label: "Chat tooltips",
            onchange: e => {
                const value = e.target.checked;
                setSetting("chat_hover_tooltip", value);
                if (value) {
                    ui.chatLog_chat.addEventListener("mouseover", chatTooltip.onChatListMouseOver, false);
                } else {
                    ui.chatLog_chat.removeEventListener("mouseover", chatTooltip.onChatListMouseOver, false);
                }
            }
        });

        ui.extraSettings_disableKeyboardShortcuts = new createInputCheckbox({
            checked: scriptSetting.disable_keyboard_shortcuts,
            label: "Disable WASD hotkeys",
            onchange: e => {
                const value = e.target.checked;
                setSetting("disable_keyboard_shortcuts", value);
                if (value) {
                    ui.main.addEventListener("shortkey", disableKeyboardShortcuts, true);
                } else {
                    ui.main.removeEventListener("shortkey", disableKeyboardShortcuts, true);
                }
                ui.settings_keyboardShortcutsWS.style.display = value ? "none" : "flex";
                ui.settings_keyboardShortcutsAD.style.display = value ? "none" : "flex";
            }
        });

        ui.extraSettings_rouletteEvid = new createInputCheckbox({
            checked: scriptSetting.evid_roulette,
            label: "EVD roulette",
            onchange: e => {
                const value = e.target.checked;
                setSetting("evid_roulette", value);
                ui.customButtons_evidRouletteButton.style.display = value ? "flex" : "none";
                ui.extraSettings_rouletteEvidAsIcon.style.display = value ? "flex" : "none";
                ui.extraSettings_rouletteEvidMax.style.display = value ? "flex" : "none";
            }
        });

        ui.extraSettings_rouletteSound = new createInputCheckbox({
            checked: scriptSetting.sound_roulette,
            label: "SND roulette",
            onchange: e => {
                const value = e.target.checked;
                setSetting("sound_roulette", value);
                ui.customButtons_soundRouletteButton.style.display = value ? "flex" : "none";
                ui.extraSettings_rouletteSoundMax.style.display = value ? "flex" : "none";
            }
        });

        ui.extraSettings_rouletteMusic = new createInputCheckbox({
            checked: scriptSetting.music_roulette,
            label: "MUS roulette",
            onchange: e => {
                const value = e.target.checked;
                setSetting("music_roulette", value);
                ui.customButtons_musicRouletteButton.style.display = value ? "flex" : "none";
                ui.extraSettings_rouletteMusicMax.style.display = value ? "flex" : "none";
            }
        });

        ui.extraSettings_rouletteEvidAsIcon = new createInputCheckbox({
            checked: scriptSetting.evid_roulette_as_icon,
            label: "Icon",
            title: "Smaller evidence in the corner",
            display: scriptSetting.evid_roulette,
            onchange: e => {
                setSetting("evid_roulette_as_icon", e.target.checked);
            }
        });

        ui.extraSettings_rouletteEvidMax = new createInputText({
            value: scriptSetting.evid_roulette_max,
            label: "max",
            type: "number",
            display: scriptSetting.evid_roulette,
            onfocusout: e => {
                const value = parseInt(e.target.value);
                if (value) {
                    setSetting("evid_roulette_max", value);
                } else {
                    e.target.value = scriptSetting.evid_roulette_max;
                    e.preventDefault();
                    return false;
                }
            }
        });

        ui.extraSettings_rouletteSoundMax = new createInputText({
            value: scriptSetting.sound_roulette_max,
            label: "max",
            type: "number",
            display: scriptSetting.sound_roulette,
            onfocusout: e => {
                const value = parseInt(e.target.value);
                if (value) {
                    setSetting("sound_roulette_max", value);
                } else {
                    e.target.value = scriptSetting.sound_roulette_max;
                    e.preventDefault();
                    return false;
                }
            }
        });

        ui.extraSettings_rouletteMusicMax = new createInputText({
            value: scriptSetting.music_roulette_max,
            label: "max",
            type: "number",
            display: scriptSetting.music_roulette,
            onfocusout: e => {
                const value = parseInt(e.target.value);
                if (value) {
                    setSetting("music_roulette_max", value);
                } else {
                    e.target.value = scriptSetting.music_roulette_max;
                    e.preventDefault();
                    return false;
                }
            }
        });

        // Get the <hr> separator on the Settings page
        const settings_separator = ui.settings_separator;

        // Row 1 - Header
        const extraSettings_rows = [];
        ui.extraSettings_rowHeader = document.createElement("h3");
        ui.extraSettings_rowHeader.textContent = "Courtroom Enhancer";

        ui.extraSettings_resetButton = new createButton({
            label: "Reset and reload",
            icon: "refresh",
            onclick: e => {
                if (!confirm("Reset Courtroom Enhancer settings and refresh the page?")) {
                    return;
                }
                storeClear();
            }
        });

        ui.extraSettings_resetButton.classList.add("d-inline-block", "ml-2");
        ui.extraSettings_resetButton.firstChild.setAttributes({
            style: {
                backgroundColor: "rgb(161 35 35)"
            }
        });

        ui.extraSettings_rowHeader.appendChild(ui.extraSettings_resetButton);
        extraSettings_rows.push(ui.extraSettings_rowHeader);

        // Row 2 - Buttons
        ui.extraSettings_rowButtons = document.createElement("div");
        ui.extraSettings_rowButtons.className = "row mt-4 no-gutters";
        ui.extraSettings_rowButtonsCol = document.createElement("div");
        ui.extraSettings_rowButtonsCol.setAttributes({
            className: "col col-12 d-flex align-center",
            style: {
                flexWrap: "wrap",
                gap: "12px 5px"
            }
        });

        ui.extraSettings_fileHostSelector = new createInputSelect({
            label: "File host",
            values: Array.from(ui.Uploader.fileHosts).map(([k, v]) => [k, v.name]),
            selectedValue: scriptSetting.file_host,
            onchange: e => {
                if (ui.Uploader.fileHosts.has(e.target.value)) {
                    setSetting("file_host", e.target.value);
                }
            }
        });

        ui.extraSettings_rowButtons.appendChild(ui.extraSettings_rowButtonsCol);
        ui.extraSettings_rowButtonsCol.append(ui.extraSettings_warnOnExit,
                                              ui.extraSettings_rememberUsername,
                                              ui.extraSettings_showConsole,
                                              ui.extraSettings_adjustChatTextWithWheel,
                                              ui.extraSettings_chatHoverTooltip,
                                              ui.extraSettings_disableKeyboardShortcuts,
                                              ui.extraSettings_fileHostSelector);
        extraSettings_rows.push(ui.extraSettings_rowButtons);

        // Row 3 - Roulettes
        ui.extraSettings_rowRoulettes = document.createElement("div");
        ui.extraSettings_rowRoulettes.className = "row mt-4 no-gutters";
        ui.extraSettings_rowRoulettesCol = document.createElement("div");
        ui.extraSettings_rowRoulettesCol.setAttributes({
            className: "col col-12 d-flex align-center",
            style: {
                flexWrap: "wrap",
                gap: "12px 15px"
            }
        });

        ui.extraSettings_rowRoulettes.appendChild(ui.extraSettings_rowRoulettesCol);

        ui.extraSettings_rouletteEvidMax.querySelector("input").setAttributes({
            maxLength: "7",
            min: "0",
            max: "9999999",
            style: {
                width: "55px"
            }
        });

        ui.extraSettings_rouletteSoundMax.querySelector("input").setAttributes({
            maxLength: "7",
            min: "0",
            max: "9999999",
            style: {
                width: "45px"
            }
        });

        ui.extraSettings_rouletteMusicMax.querySelector("input").setAttributes({
            maxLength: "7",
            min: "0",
            max: "9999999",
            style: {
                width: "55px"
            }
        });

        const rouletteEvidContainer = document.createElement("div");
        rouletteEvidContainer.setAttributes({
            className: "d-flex align-center",
            style: {
                gap: "0px 4px"
            }
        });
        const rouletteSoundContainer = rouletteEvidContainer.cloneNode();
        const rouletteMusicContainer = rouletteEvidContainer.cloneNode();

        rouletteEvidContainer.append(
            ui.extraSettings_rouletteEvid,
            ui.extraSettings_rouletteEvidMax,
            ui.extraSettings_rouletteEvidAsIcon,
        );

        rouletteSoundContainer.append(
            ui.extraSettings_rouletteSound,
            ui.extraSettings_rouletteSoundMax
        );

        rouletteMusicContainer.append(
            ui.extraSettings_rouletteMusic,
            ui.extraSettings_rouletteMusicMax
        );

        ui.extraSettings_rowRoulettes.lastChild.append(rouletteEvidContainer, rouletteSoundContainer, rouletteMusicContainer);

        extraSettings_rows.push(ui.extraSettings_rowRoulettes);

        // Find the element after the last <hr> and attach the extra settings before it
        ui.settings_afterSeparator = settings_separator.nextElementSibling;
        extraSettings_rows.forEach(row => {
            ui.settings_afterSeparator.insertAdjacentElement("beforebegin", row);
        });

        // Add the <hr> separator after the last row
        ui.settings_afterSeparator.insertAdjacentElement("beforebegin", settings_separator.cloneNode());
    }();

    // Create additional buttons container below the right panels
    var addRightFrameExtraButtons = function() {
        ui.customButtonsContainer = ui.rightFrame_container.insertAdjacentElement("afterend", document.createElement("div"));
        ui.customButtonsContainer.className = "mx-3 mt-4";

        ui.customButtons_rows = []

        // Roulette buttons row
        ui.customButtons_rowButtons = document.createElement("div");
        ui.customButtons_rowButtons.setAttributes({
            className: "row no-gutters",
            style: {
                gap: "15px 5px"
            }
        });

        function rouletteClick(command, max, icon) {
            if (ui.leftFrame_sendButton.disabled || !ui.leftFrame_container.contains(ui.leftFrame_sendButton)) {
                return;
            }
            ui.leftFrame_textarea.value = command;
            ui.leftFrame_textarea.dispatchEvent(new Event("input"));
            ui.leftFrame_sendButton.click();
            ui.Logger.log(command, icon);
        }

        ui.customButtons_evidRouletteButton = new createButton({
            label: "EVD",
            title: "Show a random piece of evidence",
            display: scriptSetting.evid_roulette,
            icon: "dice-multiple",
            onclick: e => {
                rouletteClick("[#evd" + (scriptSetting.evid_roulette_as_icon ? "i" : "") + Math.floor(Math.random() * scriptSetting.evid_roulette_max) + "]", "image");
            }
        });

        ui.customButtons_soundRouletteButton = new createButton({
            label: "SFX",
            title: "Play a random sound",
            display: scriptSetting.sound_roulette,
            icon: "dice-multiple",
            onclick: e => {
                rouletteClick("[#bgs" + Math.floor(Math.random() * scriptSetting.sound_roulette_max) + "]", "volume-medium");
            }
        });

        ui.customButtons_musicRouletteButton = new createButton({
            label: "BGM",
            title: "Play a random song",
            display: scriptSetting.music_roulette,
            icon: "dice-multiple",
            onclick: e => {
                rouletteClick("[#bgm" + Math.floor(Math.random() * scriptSetting.music_roulette_max) + "]", "music-note");
            }
        });

        ui.customButtons_rowButtons.append(ui.customButtons_evidRouletteButton,
                                           ui.customButtons_soundRouletteButton,
                                           ui.customButtons_musicRouletteButton);

        // Music buttons
        if (typeof unsafeWindow !== "undefined" && typeof unsafeWindow.Howler === "object") {
            ui.customButton_stopAllSounds = new createButton({
                label: "Shut up SFX and BGM",
                title: "Stop all sounds that are currently playing (only for you)",
                icon: "volume-variant-off",
                backgroundColor: "teal",
                onclick: unsafeWindow.Howler.stop.bind()
            });

            ui.customButton_getCurMusicUrl = new createButton({
                label: "BGM URL",
                title: "Get the URL for the song playing now",
                icon: "link-variant",
                backgroundColor: "teal",
                onclick: e => {
                    for (const howl of unsafeWindow.Howler._howls) {
                        if (howl._state == "loaded" && howl._loop) {
                            if (!scriptSetting.show_console) {
                                alert(howl._src);
                            }
                            ui.Logger.log(howl._src, "link-variant");
                            break;
                        }
                    };
                }
            });

            ui.customButtons_rowButtons.append(ui.customButton_stopAllSounds,
                                               ui.customButton_getCurMusicUrl);

            ui.customButtons_rows.push(ui.customButtons_rowButtons);
        }

        // Log row
        ui.customButtons_rowLog = document.createElement("div");
        ui.customButtons_rowLog.setAttributes({
            className: "row mt-4 no-gutters",
            style: {
                display: "flex"
            }
        });

        ui.Logger = {
            init() {
                this.entries = [];
                const elemContainer = document.createElement("div");
                elemContainer.setAttributes({
                    style: {
                        width: "100%",
                        display: "none"
                    }
                });

                const elemShowLogButton = document.createElement("button");
                elemShowLogButton.setAttributes({
                    className: "mdi mdi-console theme--dark",
                    style: {
                        fontSize: "24px"
                    }
                });

                elemShowLogButton.addEventListener("mouseover", e=>{
                    e.target.classList.remove("mdi-console");
                    e.target.classList.add("mdi-close-circle");
                });

                elemShowLogButton.addEventListener("mouseout", e=>{
                    e.target.classList.remove("mdi-close-circle");
                    e.target.classList.add("mdi-console");
                });

                elemShowLogButton.addEventListener("click", e=>{
                    ui.Logger.clear();
                });

                elemContainer.appendChild(elemShowLogButton);

                const elemItems = document.createElement("div");
                elemItems.setAttributes({
                    className: "d-flex ml-1",
                    style: {
                        width: "100%",
                        gap: "3px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flexWrap: "nowrap",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        textColor: "white",
                        lineHeight: "14px",
                        alignItems: "center",
                        textAlign: "center"
                    }
                });

                elemContainer.appendChild(elemItems);

                this.elemContainer = elemContainer;
                this.elemItems = elemItems;
                return elemContainer;
            },
            log: function(text, icon = null) {
                let duplicate;
                if (duplicate = this.entries.find(line => line.text == text)) {
                    this.entries.splice(this.entries.indexOf(duplicate), 1);
                }
                if (this.entries.length > 7) {
                    this.entries.shift();
                }
                this.entries.push({
                    text: text,
                    icon: icon
                });

                while (this.elemItems.firstChild) {
                    this.elemItems.firstChild.remove()
                }

                this.entries.forEach(entry => {
                    const item = document.createElement("span")
                    if (entry.icon) {
                        icon = document.createElement("i");
                        icon.classList.add("mdi","mr-1", "mdi-" + entry.icon);
                        item.appendChild(icon);
                    }
                    item.setAttributes({
                        style: {
                            display: "inline-block",
                            padding: "2px 4px",
                            border: "1px solid rgb(126 85 143)",
                            borderRadius: "4px",
                            backgroundColor: "rgb(126 85 143)",
                            userSelect: "all",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }
                    });
                    item.append(entry.text);

                    item.addEventListener("mouseenter", e => {
                        e.target.style.overflow = "visible";
                    });

                    item.addEventListener("mouseleave", e => {
                        e.target.parentNode.childNodes.forEach(c => {
                            c.style.overflow = "hidden";
                        })
                    });

                    if (scriptSetting.show_console && this.elemContainer.style.display == "none") {
                        this.elemContainer.style.display = "flex";
                    }
                    this.elemItems.prepend(item);
                });
                this.elemItems.firstChild.style.borderColor = "#b82792";
            },
            clear() {
                this.entries = [];
                while (this.elemItems.firstChild) {
                    this.elemItems.firstChild.remove()
                }
                this.toggle(false);
            },

            toggle(value) {
                this.elemContainer.style.display = value ? "flex" : "none";
            }
        }

        ui.customButtons_rowLogLogger = ui.Logger.init();
        ui.customButtons_rowLog.appendChild(ui.customButtons_rowLogLogger);

        ui.customButtons_rows.push(ui.customButtons_rowLog);

        // Attach each rows to the custom buttons container
        ui.customButtons_rows.forEach(row => {
            ui.customButtonsContainer.appendChild(row);
        });
    }();

    // Adjust chatbox text size with mouse wheel
    const on_chatBoxTextWheel = function(e) {
        if (ui.courtroom_chatBoxText === null || typeof ui.courtroom_chatBoxText === "undefined") {
            ui.courtroom_chatBoxText = ui.courtroom_container.querySelector("div.chat-box-text");
            ui.courtroom_chatBoxText.style.lineHeight = "1.3";
        }
        ui.courtroom_chatBoxText.style.fontSize = Math.min(100, Math.max(10, parseFloat(parseFloat(getComputedStyle(ui.courtroom_chatBoxText, null).getPropertyValue('font-size')) + e.deltaY * -0.01))) + "px";
    }
    if (scriptSetting.adjust_chat_text_with_wheel) {
        ui.courtroom_chatBoxes.addEventListener("wheel", on_chatBoxTextWheel);
    }

    // Make the "fade" courtroom elements click-through to right-click images underneath directly
    ui.courtroom_container.querySelectorAll("div.fade_everything, div.fade_scene, div.fade_background").forEach(f => {
        f.style.pointerEvents = "none";
    });
    ui.courtroom_container.querySelector("div.scene-container").style.pointerEvents = "auto";

    // Chat hover tooltips
    const chatTooltip = {
        init() {
            this.chat = {};
            this.tooltipElement = document.createElement("div");
            this.tooltipElement.setAttributes({
                style: {
                    visibility: "hidden",
                    opacity: "0",
                    position: "absolute",
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "5px",
                    top: "0px",
                    right: "20px",
                    padding: "4px",
                    maxWidth: "360px",
                    maxHeight: "90%",
                    overflow: "auto",
                    background: "rgba(24, 24, 24, 0.95)",
                    boxShadow: "2px 2px 6px #121212",
                    border: "1px solid rgb(62, 67, 70)",
                    borderRadius: "3px",
                    wordBreak: "break-all",
                    fontSize: "15px",
                    lineHeight: "15px",
                    color: "rgb(211, 207, 201)",
                    transition: "opacity 0.15s ease-in-out 0.25s, top 0s",
                    zIndex: "2"
                }
            });
            this.onChatListMouseOver = this.onChatListMouseOver.bind(this);
            this.onChatItemMouseLeave = this.onChatItemMouseLeave.bind(this);

            if (scriptSetting.chat_hover_tooltip) {
                ui.chatLog_chat.addEventListener("mouseover", this.onChatListMouseOver, false);
            }
            this.tooltipElement.addEventListener("mouseenter", e => {e.target.style.opacity = "1";});
            this.tooltipElement.addEventListener("mouseleave", this.onChatItemMouseLeave.bind(this), {capture:false});
            this.tooltipElement.addEventListener("transitioncancel", e => {
                if (e.target.style.opacity == "0") {
                    e.target.style.visibility = "hidden";
                }
            });
            this.tooltipElement.addEventListener("transitionend", e => {
                if (e.target.style.opacity == "0") {
                    e.target.style.visibility = "hidden";
                    this.tooltipElement.querySelectorAll("audio, video").forEach(f => {f.pause();});
                    this.tooltipElement.querySelectorAll("iframe[src^=\"https://www.youtube.com/embed/\"]").forEach(f => {f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');});
                    this.tooltipElement.removeEventListener("mouseleave", this.onChatItemMouseLeave, {capture:false});
                    this.chat.element.removeEventListener("mouseleave", this.onChatItemMouseLeave, {capture:false});
                }
            });

            return this.tooltipElement;
        },

        reposition() {
            let top = 0;
            if (!this.tooltipElement || !this.chat.element) {return;}

            top = this.chat.element.getBoundingClientRect().y + (this.chat.element.offsetHeight / 2) - (this.tooltipElement.offsetHeight / 2);
            if (top < ui.chatLog_chat.getBoundingClientRect().y) {
                top = ui.chatLog_chat.getBoundingClientRect().y;
            } else if (top + this.tooltipElement.offsetHeight > this.tooltipElement.parentNode.offsetHeight) {
                top = this.parentNode.offsetHeight - this.tooltipElement.offsetHeight - 20;
            }
            this.tooltipElement.style.top = top + "px"
        },

        embedFiles: {
            link(url) {
                const a = document.createElement("a");
                a.setAttributes({
                    href: url.href,
                    textContent: url.href,
                    target: "_blank",
                    rel: "noreferrer",
                    style: {display: "inline-block", fontSize: "14px"}
                });
                const i = document.createElement("i");
                i.setAttributes({
                    className: "mdi mdi-open-in-new",
                    style: {marginLeft: "2px", fontSize: "12px"}
                });
                a.appendChild(i);
                return a;
            },
            image(url) {
                const img = document.createElement("img");
                img.setAttributes({
                    src: url.href,
                    alt: url.href,
                    referrerPolicy: "no-referrer",
                    style: {maxWidth: "280px", maxHeight: "300px"}
                });

                img.addEventListener("load", e => {
                    img.style.display = "inline";
                    this.reposition();
                });

                img.addEventListener("error", e => {
                    img.style.display = "none";
                    this.reposition();
                });

                const a = document.createElement("a");
                a.setAttributes({
                    href: url.href,
                    target: "_blank",
                    rel: "noreferrer",
                    style: {display: "inline-block"}
                });
                a.appendChild(img);
                return a;
            },
            video(url) {
                const video = document.createElement("video");
                video.setAttributes({
                    src: url.href,
                    loop: "true",
                    controls: "true",
                    style: {maxWidth: "280px", maxHeight: "300px", display: "none"}
                });

                video.addEventListener("loadeddata", e => {
                    video.style.display = "inline-block";
                    this.reposition();
                });

                video.addEventListener("error", e => {
                    video.style.display = "none";
                    this.reposition();
                });
                return video;
            },
            youtube(url) {
                const youtubeEmbed = document.createElement("iframe");
                const key = (url.searchParams.get("v") || url.pathname.substr(url.pathname.lastIndexOf("/")));
                if (!key) {return;}
                var timeStart = url.searchParams.get("t") || url.searchParams.get("start") || 0;
                if (timeStart && !/^\d+$/.test(timeStart)) { // convert 2m5s to 125
                    timeStart = timeStart.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
                    timeStart = 3600 * (timeStart[1]||0) + 60 * (timeStart[2]||0) + 1 * (timeStart[3]||0);
                }
                youtubeEmbed.setAttributes({
                    src: "https://www.youtube.com/embed/" + key + "?enablejsapi=1&start=" + timeStart,
                    loop: "true",
                    width: "320",
                    height: "180",
                    frameborder: "0",
                    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                    allowFullscreen: "true",
                    style: {maxWidth: "320px", maxHeight: "180px", display: "inline-block"}
                });

                youtubeEmbed.addEventListener("load", e => {
                    youtubeEmbed.style.display = "inline-block";
                    this.reposition();
                });

                youtubeEmbed.addEventListener("error", e => {
                    youtubeEmbed.style.display = "none";
                    this.reposition();
                });

                return youtubeEmbed;
            },
            audio(url) {
                const audio = document.createElement("audio");
                audio.setAttributes({
                    src: url.href,
                    controls: "true",
                    style: {maxWidth: "280px", maxHeight: "300px", height: "30px", display: "none"}
                });

                audio.addEventListener("loadedmetadata", e => {
                    audio.style.width = "100%";
                    audio.style.display = "inline-block";
                    this.reposition();
                });

                audio.addEventListener("error", e => {
                    audio.style.display = "none";
                    this.reposition();
                });

                return audio;
            }
        },

        extractUrls(text) {
            return text.split(/\s+/).map(word => {
                try {
                    return new URL(word);
                } catch(e) {
                    return null;
                }
            }).filter(Boolean);
        },

        chatItemPopulate(chat) {
            const matchedElements = [];

            this.extractUrls(chat.text).forEach(url => {
                matchedElements.push(this.embedFiles.link.call(this, url));
                const extension = url.pathname.substring(url.pathname.lastIndexOf('.') + 1);
                if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
                    matchedElements.push(this.embedFiles.image.call(this, url));
                } else if (["webm", "mp4"].includes(extension)) {
                    matchedElements.push(this.embedFiles.video.call(this, url));
                } else if (["mp3", "ogg", "m4a"].includes(extension)) {
                    matchedElements.push(this.embedFiles.audio.call(this, url));
                } else if (["youtu.be", "www.youtube.com", "youtube.com"].includes(url.hostname)) {
                    matchedElements.push(this.embedFiles.youtube.call(this, url));
                }
            });

            if (!matchedElements.length) {
                return;
            }

            this.chat = chat;
            this.tooltipElement.innerHTML = this.chat.name + ":&nbsp;";
            matchedElements.forEach(f => {this.tooltipElement.appendChild(f)});
            this.reposition();
            this.tooltipElement.setAttributes({
                style: {
                    visibility: "visible",
                    opacity: "1"
                }
            });
            this.chat.element.addEventListener("mouseleave", this.onChatItemMouseLeave, {capture:false});
        },

        onChatListMouseOver(e) {
            const chat = {
                element: e.target.closest("div.v-list-item__content")
            };
            if (!chat.element) {
                return;
            }
            if (["mdi-account-tie", "mdi-crown", "mdi-account"].filter(element => chat.element.previousSibling.firstChild.firstChild.classList.contains(element)).length == 0) {
                return;
            }

            chat.name = chat.element.firstChild.textContent;
            chat.text = chat.element.lastChild.textContent;

            if (this.chat.element) {
                if (chat.text === this.chat.text) {
                    if (this.tooltipElement.style.opacity == "0") { // Mouse left and re-entered the same item when it was hidden
                        this.tooltipElement.style.visibility = "visible";
                        this.tooltipElement.style.opacity = "1";
                        this.chat.element.addEventListener("mouseleave", this.onChatItemMouseLeave, {capture:false});
                        this.chat = chat;
                        this.reposition();
                    }
                    return;
                } else { // Mouse left and entered a different item
                    this.tooltipElement.style.opacity = "0";
                }
            }

            if (!chat.text.match(/http/)) {
                return;
            }

            this.chatItemPopulate(chat);
        },

        onChatItemMouseLeave(e) {
            if (this.tooltipElement.contains(e.toElement)) {
                return;
            }
            this.tooltipElement.style.opacity = "0";
        }
    }

    ui.chatTooltip = chatTooltip.init();
    ui.app.appendChild(ui.chatTooltip);

    // Restore right click functionality to courtroom container
    ui.courtroom_container.addEventListener("contextmenu", e => {
        e.stopImmediatePropagation();
    }, true);

    // Disable WASD shortcuts
    const disableKeyboardShortcuts = function(e) {
        if ("wasd".includes(e.srcKey)) {
            e.stopImmediatePropagation()
        }
    };

    if (scriptSetting.disable_keyboard_shortcuts) {
        ui.main.addEventListener("shortkey", disableKeyboardShortcuts, true);
        ui.settings_keyboardShortcutsWS.style.display = "none";
        ui.settings_keyboardShortcutsAD.style.display = "none";
    }

}

function on_beforeUnload(e) {
    if (scriptSetting.warn_on_exit) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave?";
        return "Are you sure you want to leave?";
    }
}

function getSetting(setting_name, default_value) {
    var value = storeGet("setting_" + setting_name, default_value);
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
    return storeSet("setting_" + setting_name, value);
}

function getStoredUsername() {
    return storeGet("courtroom_username");
}

function setStoredUsername(username) {
    storedUsername = username;
    return storeSet("courtroom_username", String(username));
}

function storeGet(key, def = "") {
    var res;
    if (typeof GM_getValue === "undefined") {
        res = localStorage.getItem(key);
    } else {
        res = GM_getValue(key);
    }
    try {
        if (typeof res === "undefined" || res === null) {
            return def;
        } else {
            return JSON.parse(res);
        }
    } catch {
        if (typeof res === "undefined" || res === null) {
            return def;
        } else {
            return res;
        }
    }
};

function storeSet(key, value) {
    if (typeof GM_setValue === "undefined") {
        return localStorage.setItem(key, value);
    } else {
        return GM_setValue(key, value);
    }
};

function storeDel(key) {
    if (typeof GM_deleteValue === "undefined") {
        return localStorage.removeItem(key);
    } else {
        return GM_deleteValue(key);
    }
};

function storeClear() {
    if (typeof GM_listValues === "undefined") {
        localStorage.clear();
    } else {
        const storedSettings = GM_listValues();
        for (const val in storedSettings) {
            GM_deleteValue(storedSettings[val]);
        }
    }
    scriptSetting.warn_on_exit = false;
    window.location.reload();
};

const CrossOrigin = (function() {
    try {
        return (typeof GM !== "undefined" && GM !== null ? GM.xmlHttpRequest : void 0) || GM_xmlhttpRequest;
    } catch (e) {
        return console.error(e);
    }
})();

// Helper function to set multiple element attributes at once
Element.prototype.setAttributes = function(attr) {var recursiveSet = function(at,set) {for(var prop in at){if(typeof at[prop] == 'object' && at[prop].dataset == null && at[prop][0] == null){recursiveSet(at[prop],set[prop]);}else {set[prop] = at[prop];}}};recursiveSet(attr,this);}
