// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://github.com/w452tr4w5etgre/
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.780
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

'use strict';

const _CE_ = {};

_CE_.options = {
    "warn_on_exit": getSetting("warn_on_exit", true),
    "remember_username": getSetting("remember_username", true),
    "show_console": getSetting("show_console", false),
    "adjust_chat_text_with_wheel": getSetting("adjust_chat_text_with_wheel", true),
    "chat_hover_tooltip": getSetting("chat_hover_tooltip", true),
    "disable_keyboard_shortcuts": getSetting("disable_keyboard_shortcuts", true),
    "evid_roulette": getSetting("evid_roulette", false),
    "sound_roulette": getSetting("sound_roulette", false),
    "music_roulette": getSetting("music_roulette", false),
    "global_buttons": getSetting("global_buttons", false),
    "mute_bgm_buttons": getSetting("mute_bgm_buttons", false),
    "evid_roulette_as_icon": getSetting("evid_roulette_as_icon", false),
    "evid_roulette_max": Math.max(getSetting("evid_roulette_max", 0), 577000),
    "sound_roulette_max": Math.max(getSetting("sound_roulette_max", 0), 53000),
    "music_roulette_max": Math.max(getSetting("music_roulette_max", 0), 172000),
    "file_host": getSetting("file_host", "catbox"),
    "textbox_style": getSetting("textbox_style", "none"),
    "custom_styles": getSetting("custom_styles")
};

const URL_REGEX = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@;:%_\+.~#?&\/\/=]*)/gi;

const ui = { "app": document.querySelector("div#app") };

(new MutationObserver(checkVueLoaded)).observe(document, { childList: true, subtree: true });

function checkVueLoaded(_changes, observer) {
    if (!document.body.contains(ui.app)) ui.app = document.querySelector("div#app");
    ui.main = ui.app.querySelector("div.v-application--wrap > div.container > main.v-main > div.v-main__wrap > div");
    if (!ui.main || !ui.main.__vue__) return;
    observer.disconnect();
    onVueLoaded();
}

function onVueLoaded() {
    _CE_.vue = ui.main.__vue__;
    _CE_.socket = _CE_.vue.$socket;

    _CE_.vue.sockets.subscribe("join_success", () => { setTimeout(onCourtroomJoin, 0) });

    // when join courtroom window popups
    _CE_.vue.$watch("$store.state.courtroom.dialogs.joinCourtroom", s => {
        if (!s) { return; }
    })

    // remember username
    if (_CE_.options.remember_username) {
        _CE_.vue.$store.state.courtroom.user.username = storeGet("courtroom_username");
        _CE_.vue.$watch("$store.state.courtroom.user.username", username => {
            storeSet("courtroom_username", String(username));
        });
    }

    // this.$store.state.courtroom.frame.text

}

function onCourtroomJoin() {
    ui.leftFrame_container = _CE_.vue.$children.find(child => { return child.$vnode.componentOptions.tag === "CourtLeftPanel"; }).$el;

    ui.leftFrame_textEditor = ui.leftFrame_container.__vue__.$children.find(child => { return child.$vnode.componentOptions.tag === "courtTextEditor"; }).$el;

    ui.leftFrame_sendButton = ui.leftFrame_container.querySelector("div > div:nth-child(4) > div:nth-child(2) > div > div > div:nth-child(2) > div > div.pl-1 > button.v-btn > span.v-btn__content > i.mdi-send").parentNode.parentNode;

    ui.courtroom_container = ui.leftFrame_container.querySelector("div.court-container > div.courtroom");
    ui.courtroom_chatBoxes = ui.courtroom_container.querySelector("div.fade_everything").previousSibling;

    ui.rightFrame_container = _CE_.vue.$children.find(child => { return child.$vnode.componentOptions.tag === "CourtRightPanel"; }).$el;

    ui.rightFrame_content = ui.rightFrame_container.__vue__.$children[0];
    ui.rightFrame_toolbar = ui.rightFrame_content.$children.find(child => { return child.$vnode.componentOptions.tag === "v-toolbar"; });

    ui.rightFrame_tabs = ui.rightFrame_content.$children.find(child => { return child.$vnode.componentOptions.tag === "v-tabs-items"; });

    ui.rightFrame_tabChatLog = ui.rightFrame_tabs.$children[0];
    ui.rightFrame_tabEvidence = ui.rightFrame_tabs.$children[1];
    ui.rightFrame_tabBackgrounds = ui.rightFrame_tabs.$children[2];
    ui.rightFrame_tabSettings = ui.rightFrame_tabs.$children[3];
    ui.rightFrame_tabAdmin = ui.rightFrame_tabs.$children[4];

    ui.courtEvidence = ui.rightFrame_tabEvidence.$children.find(child => { return child.$vnode.componentOptions.tag === "courtEvidence"; });

    ui.chatLog_container = ui.rightFrame_container.querySelector("div.v-card.v-sheet > div.v-window.v-item-group > div.v-window__container > div.v-window-item:first-of-type");
    ui.chatLog_chat = ui.chatLog_container.querySelector("div > div.chat");
    ui.chatLog_chatList = ui.chatLog_chat.querySelector("div.v-list");
    ui.chatLog_textField = ui.chatLog_container.querySelector("div.v-window-item > div > div:nth-child(2) > div > div > div > div.v-text-field__slot > input[type=text]");

    ui.settings_container = ui.rightFrame_container.querySelector("div.v-card.v-sheet > div.v-window.v-item-group > div.v-window__container > div.v-window-item:nth-of-type(4)");
    ui.settings_usernameChangeInput = ui.settings_container.querySelector("div > div > div div.v-input > div.v-input__control > div.v-input__slot > div.v-text-field__slot > input[type=text]");
    ui.settings_switchDiv = ui.settings_container.querySelector("div > div:nth-child(2) > div > div.v-input--switch").parentNode.parentNode;
    ui.settings_separator = ui.settings_container.querySelector("div > hr:last-of-type");
    ui.settings_keyboardShortcutsHeader = ui.settings_container.querySelector("div > h3:first-of-type");
    ui.settings_keyboardShortcutsWS = ui.settings_keyboardShortcutsHeader.nextSibling.nextSibling.nextSibling;
    ui.settings_keyboardShortcutsAD = ui.settings_keyboardShortcutsWS.nextSibling;

    window.addEventListener("beforeunload", on_beforeUnload, false);

    // remember last character
    _CE_.vue.$store.state.courtroom.frame.poseId = storeGet("last_poseId") || 1;
    _CE_.vue.$store.state.courtroom.frame.characterId = storeGet("last_characterId");
    _CE_.vue.$watch("$store.state.courtroom.frame.poseId", poseId => {
        storeSet("last_poseId", String(poseId));
    });
    _CE_.vue.$watch("$store.state.courtroom.frame.characterId", characterId => {
        storeSet("last_characterId", String(characterId));
    });

    // remember chat color
    _CE_.vue.$store.state.courtroom.color = storeGet("courtroom_chat_color");
    _CE_.vue.$watch("$store.state.courtroom.color", color => {
        storeSet("courtroom_chat_color", String(color));
    });

    // Look for Dialog windows
    const myAssetsWatcher = {
        on_myAssetsAdded(node) {
            const tabsContainer = node.querySelector("div.v-dialog > div.v-card > div.v-window > div.v-window__container");
            this.element = node;
            this.observer = new MutationObserver(this.on_myAssetsListChange.bind(this))
            this.observer.observe(tabsContainer, { childList: true });
            this.myAssets_DoChanges(node.querySelector("div.v-window-item--active"));
        },
        on_myAssetsListChange(changes, observer) {
            for (const change of changes) {
                for (const addedNode of change.addedNodes) {
                    this.myAssets_DoChanges(addedNode);
                }
            }
        },
        on_myAssetsRemoved(node) {
            this.observer.disconnect();
        },
        myAssets_DoChanges(node) {
            const activeTab = this.element.querySelector("div.v-dialog > div.v-card > div.v-tabs > div.v-tabs-bar > div > div.v-tabs-bar__content > div.v-tab.v-tab--active");
            const activeWindow = node.parentNode.childNodes[Array.from(activeTab.parentNode.children).indexOf(activeTab) - 1];
            switch (activeTab.firstChild.firstChild.textContent.trim().toUpperCase()) {
                case "BACKGROUNDS":
                    ui.backgroundsFilePicker = new ui.Uploader.filePicker(uploaderResponse => {
                        const inputName = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(1) div.v-text-field__slot > input[type=text]");
                        const inputURL = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(2) div.v-text-field__slot > input[type=text]");
                        inputName.value = uploaderResponse.filename;
                        inputName.dispatchEvent(new Event("input"));
                        inputURL.value = uploaderResponse.url;
                        inputURL.dispatchEvent(new Event("input"));
                    }, { label: "bg", icon: "image", acceptedhtml: "image/*", acceptedregex: "^image/", maxsize: 4e6, pastetargets: activeWindow.querySelectorAll("input[type=text]") });
                    activeWindow.querySelector("div.v-card__actions").prepend(ui.backgroundsFilePicker);
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
                    }, { label: "music", icon: "file-music", acceptedhtml: "audio/*", acceptedregex: "^audio/", maxsize: 25e6, pastetargets: activeWindow.querySelectorAll("input[type=text]") });
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
                    }, { label: "sound", icon: "file-music", acceptedhtml: "audio/*", acceptedregex: "^audio/", maxsize: 25e6, pastetargets: activeWindow.querySelectorAll("input[type=text]") });
                    activeWindow.querySelector("div.v-card__actions").prepend(ui.soundFilePicker);
                    break;
                default:
                    console.log("My Assets tab not found: " + activeTab.firstChild.firstChild.textContent);
            }
        }
    };

    (new MutationObserver(on_appNodeListChange)).observe(ui.app, { childList: true });
    function on_appNodeListChange(changes, observer) {
        for (const change of changes) {
            for (const node of change.addedNodes) {
                if (node.classList.contains("v-dialog__content")) {
                    const closeButton = node.querySelector("header.v-sheet.v-toolbar > div.v-toolbar__content > div.v-toolbar__items > button.v-btn:last-of-type");
                    const dialogCard = node.querySelector("div.v-dialog > div.v-card");
                    // Check if the pop up is an image (Evidence)
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
                    } else if (node.querySelector("div.v-dialog > div.v-card > div.v-sheet > div > span:first-of-type")?.textContent.trim().toUpperCase() === "COURT RECORD") {
                        ui.courtRecord_toolbarContent = node.querySelector("div.v-card > div:nth-child(1)");
                        ui.courtRecord_cardContent = node.querySelector("div.v-card > div:nth-child(2)");

                        ui.courtRecord_buttons = ui.courtRecord_cardContent.firstChild;
                        ui.courtRecord_checkButton = ui.courtRecord_buttons.querySelector("div:first-child > button");

                    } else {
                        const toolbarContent = node.querySelector("header.v-sheet > div.v-toolbar__content");
                        const dialogTitle = toolbarContent.querySelector("div.v-toolbar__title").textContent.trim().toUpperCase();
                        switch (dialogTitle) {
                            case "PAIRING":
                                break;
                            case "CHANGE CHARACTER":
                                break;
                            case "MANAGE CHARACTER":
                                // Add an uploader at the top of the Manage Character window
                                var characterHelperURL = document.createElement("input")
                                characterHelperURL.setAttributes({
                                    type: "text",
                                    maxLength: "255",
                                    title: "URL",
                                    readonly: true,
                                    style: {
                                        backgroundColor: "white",
                                        color: "black",
                                        height: "1vw",
                                        fontSize: "8pt",
                                        border: "1px solid black",
                                        minWidth: "140px",
                                        maxWidth: "100%",
                                        display: "none",
                                        flexBasis: "100"
                                    }
                                });
                                characterHelperURL.addEventListener("click", e => { e.target.select(); })

                                var characterHelper_Uploader = new ui.Uploader.filePicker(res => {
                                    if (characterHelperURL.style.display === "none") {
                                        characterHelperURL.style.display = "block";
                                    }
                                    characterHelperURL.value = res.url;
                                }, { label: "file", icon: "image-size-select-large", acceptedhtml: "*", acceptedregex: ".*", maxsize: 2e7, pastetargets: characterHelperURL });
                                characterHelper_Uploader.style.flexBasis = "100";
                                characterHelper_Uploader.style.borderColor = "#83ffff";

                                var characterHelper = document.createElement("div");
                                characterHelper.setAttributes({
                                    className: "v-toolbar__items",
                                    style: {
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        alignContent: "center",
                                        justifyContent: "center",
                                        maxWidth: "150px"
                                    }
                                });

                                characterHelper.append(characterHelper_Uploader, characterHelperURL);

                                var spacer = document.createElement("div");
                                spacer.className = "spacer";
                                toolbarContent.querySelector("div.spacer").after(characterHelper, spacer);
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

    const createButton = function (options) {
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
                        data: ui.Uploader.parseForm({ reqtype: "fileupload", fileToUpload: data })
                    }
                },
                formatDataUrl(data) {
                    return {
                        headers: {},
                        data: ui.Uploader.parseForm({ reqtype: "urlupload", url: data })
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
                        data: ui.Uploader.parseForm({ "files[]": data })
                    }
                },
                formatDataUrl(data) {
                    return {
                        headers: { "Content-type": "application/x-www-form-urlencoded" },
                        data: ui.Uploader.parseParams({ "urls[]": data })
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
            const hostFallback = new Map([["base", "catbox"], ["audio", "catbox"], ["urls", "imoutokawaii"], ["m4a", "uguuse"]]);
            var dataToUpload, filename, fileHost = (this.fileHosts.has(_CE_.options.file_host) ? _CE_.options.file_host : hostFallback.get("base"));

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

        filePicker: function (callback, options) {
            this.label = options.label || "image";
            this.icon = options.icon || "image-size-select-large";
            this.acceptedhtml = options.acceptedhtml || "image/*";
            this.acceptedregex = options.acceptedregex || "^image/";
            this.maxsize = options.maxsize || 2e6;

            const resetElem = (function () {
                elemContainer.setAttributes({
                    title: "",
                    firstChild: { className: "v-icon v-icon--left mdi mdi-" + this.icon },
                    lastChild: { textContent: "Upload " + this.label },
                    style: {
                        borderColor: "teal",
                        pointerEvents: "auto",
                        cursor: "pointer"
                    }
                });
            }).bind(this);

            const uploadError = function (errorText) {
                elemContainer.setAttributes({
                    title: errorText,
                    firstChild: { className: "v-icon v-icon--left mdi mdi-alert" },
                    lastChild: { textContent: errorText.substr(0, 100) },
                    style: {
                        borderColor: "red",
                        pointerEvents: "auto",
                        cursor: "not-allowed"
                    }
                });
                setTimeout(resetElem, 3000);
                ui.Logger.log(errorText);
            }

            const uploadCallbackSuccess = function () {
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
                style: { opacity: 0 }
            });

            elemContainer.addEventListener("click", e => {
                elemFile.click();
            });

            const uploaderElementEvent = function (e) {
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
                        firstChild: { className: "v-icon v-icon--left mdi mdi-progress-upload" },
                        lastChild: { textContent: "Uploading" },
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
                    options.pastetargets.addEventListener("paste", e => { uploaderElementEvent.bind(this, e) });
                } else if (options.pastetargets instanceof NodeList) {
                    options.pastetargets.forEach(f => { f.addEventListener("paste", e => { uploaderElementEvent.call(this, e); }); })
                }
            }

            return elemContainer;
        }
    };

    // Evidence tab enhancements
    ui.enhanceEvidenceTab = function () {
        ui.evidence_form = ui.courtEvidence.$children.find(child => { return child.$vnode.componentOptions.tag === "v-form"; }).$el;
        ui.evidence_formDivs = ui.evidence_form.firstChild;
        ui.evidence_formFields = ui.evidence_formDivs.querySelectorAll("input");
        ui.evidence_formFieldDescription = ui.evidence_formDivs.querySelector("textarea");

        ui.evidence_formBottomRow = ui.evidence_form.querySelector("form > div:nth-child(2)");
        ui.evidence_formBottomRow_buttonsColumn = ui.evidence_formBottomRow.firstChild;
        ui.evidence_list = ui.courtEvidence.$el.querySelector("div > div.row:last-of-type");

        ui.evidence_list.style.maxHeight = "70vh";
        ui.evidence_list.style.scrollBehavior = "smooth";

        // Pressing the Enter key on the form fields adds the evidence
        ui.evidence_formFields.forEach(f => {
            f.addEventListener("keydown", e => {
                if (e.keyCode == 13 || e.key == "Enter") {
                    e.target.blur();
                    ui.courtEvidence.addEvidence();
                }
            });
        });

        // Override the validation function to allow anonymous evidence
        ui.courtEvidence.$refs.form.validate = () => {
            if (!ui.courtEvidence.url && ui.courtEvidence.iconUrl) {
                ui.courtEvidence.url = ui.courtEvidence.iconUrl;
            }
            if (!ui.courtEvidence.iconUrl && ui.courtEvidence.url) {
                ui.courtEvidence.iconUrl = ui.courtEvidence.url;
            }
            if (!ui.courtEvidence.name) {
                ui.courtEvidence.name = " ";
            }
            ui.courtEvidence.valid = true;
            return true;
        };

        // Fix evidence form layout

        // Name
        ui.courtEvidence.$refs.form.$children[0].$el.parentNode.classList.remove("mb-sm-2", "col-12", "col-sm-6");
        ui.courtEvidence.$refs.form.$children[0].$el.parentNode.classList.add("col-sm-4");
        // Icon URL
        ui.courtEvidence.$refs.form.$children[1].$el.parentNode.classList.remove("mb-sm-2", "col-12", "col-sm-6");
        ui.courtEvidence.$refs.form.$children[1].$el.parentNode.classList.add("col-sm-4", "pr-sm-1");
        // Check URL
        ui.courtEvidence.$refs.form.$children[2].$el.parentNode.classList.remove("mb-sm-2", "col-12", "col-sm-6");
        ui.courtEvidence.$refs.form.$children[2].$el.parentNode.classList.add("col-sm-4", "pl-sm-1");
        // Description
        ui.courtEvidence.$refs.form.$children[3].$el.parentNode.previousSibling.classList.add("d-none"); // Hide invisible element
        ui.courtEvidence.$refs.form.$children[3].$el.parentNode.classList.remove("col-12", "my-3");
        ui.courtEvidence.$refs.form.$children[3].$el.parentNode.classList.add("pr-sm-1");
        ui.courtEvidence.$refs.form.$children[3].$refs.input.style.height = "50px";
        // Type
        ui.courtEvidence.$refs.form.$children[4].$el.parentNode.classList.remove("col-12");
        ui.courtEvidence.$refs.form.$children[4].$el.parentNode.classList.add("col-sm-6", "pl-sm-1");


        const createEvidenceUploaders = {
            init: function () {
                const container = document.createElement("div");
                container.setAttributes({
                    className: "d-flex justify-center",
                    style: {
                        gap: "8px",
                        flex: "2 1 auto",
                    }
                });

                const evidenceImageUploader = new ui.Uploader.filePicker(res => {
                    ui.courtEvidence.name = res.filename.substr(0, 20);
                    ui.courtEvidence.iconUrl = res.url;
                    ui.courtEvidence.url = res.url;
                }, { label: "image", icon: "image-size-select-large", acceptedhtml: "image/*", acceptedregex: "^image/", maxsize: 2e6, pastetargets: ui.evidence_formFields });

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
                    style: { cursor: "pointer" }
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

                const gelbooruUploaderError = function (error = "Error") {
                    const errorText = (error instanceof Error || typeof error === "string") ? error.toString() : (error.responseText || "Error");
                    gelbooruInputTags.value = errorText;
                    gelbooruInputTags.style.color = "white";
                    gelbooruInputTags.disabled = false;
                    gelbooruInputTags.addEventListener("focus", e => {
                        e.target.value = "";
                    }, { once: true });
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
                                            ui.courtEvidence.name = responseJSON.post[0].id;
                                            ui.courtEvidence.iconUrl = uploaderResponse.url;
                                            ui.courtEvidence.url = uploaderResponse.url;
                                            gelbooruInputTags.value = "";
                                            gelbooruInputTags.style.color = "white";
                                            gelbooruInputTags.disabled = false;
                                            gelbooruIcon.click();
                                            setTimeout(f => { ui.courtEvidence.addEvidence() }, 100);
                                        } catch (e) {
                                            throw (e);
                                        }
                                    }, gelbooruUploaderError);
                                }
                            } catch (e) {
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
            updateCount: function () {
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
            init: function () {
                this.container = document.createElement("div");
                this.text = document.createElement("div");
                this.container.className = "d-flex";
                this.container.appendChild(this.text);
                this.updateCount();
                return this.container;
            }
        };

        ui.evidence_evidenceCounter = evidenceCounter.init();
        evidenceCounter.updateCount();
        ui.evidence_formBottomRow.appendChild(ui.evidence_evidenceCounter);

        // Adjust evidence items
        ui.evidence_list.fixEvidenceItem = function (node) {
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

                // Check if the evidence is ready to be checked
                const checkEvidInterval = setInterval(e => {
                    // Check if the Check button is visible
                    if (ui.courtRecord_checkButton?.offsetParent === null) return;

                    // Check if the currently loaded thumbnail matches the evidence we want to open
                    if (ui.courtRecord_cardContent.querySelector(":scope > div:nth-child(2) > div:nth-child(1) > div.v-image > div.v-image__image").style.backgroundImage !== divImage.querySelector(":scope > div.v-image__image").style.backgroundImage) return;

                    ui.courtRecord_checkButton.click();
                    clearInterval(checkEvidInterval);
                }, 50);

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
                }
            });
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

            // Add "link" button
            const buttonLink = document.createElement("button");
            buttonLink.className = "v-btn v-btn--icon v-btn--round theme--dark v-size--default mr-0 ml-1";

            const buttonLinkSpan = document.createElement("span");
            buttonLinkSpan.className = "v-btn__content";
            buttonLink.append(buttonLinkSpan);

            const buttonLinkSpanIcon = document.createElement("i");
            buttonLinkSpanIcon.className = "v-icon notranslate mdi mdi-link theme--dark";
            buttonLinkSpan.append(buttonLinkSpanIcon);

            buttonEye.insertAdjacentElement("afterend", buttonLink);

            buttonLink.addEventListener("click", e => {
                if (e.target.disabled) return;
                var imageUrl = divImage.querySelector(":scope > div.v-image__image").style.backgroundImage;
                imageUrl = imageUrl.substring(4, imageUrl.length - 1).replace(/["']/g, "");
                //navigator.clipboard.writeText(imageUrl); // Copy URL to clipboard
                ui.Logger.log(imageUrl, "link-variant");
            });

            // Hide eye button (clicking on the image itself clicks on the eye)
            buttonEye.style.display = "none";
        };

        if (ui.evidence_list.childElementCount) {
            for (const node of ui.evidence_list.childNodes) {
                ui.evidence_list.fixEvidenceItem(node)
            }
        }

        (new MutationObserver(on_evidenceListChange)).observe(ui.evidence_list, { childList: true });
        function on_evidenceListChange(changes, observer) {
            evidenceCounter.updateCount();
            for (const change of changes) {
                for (const node of change.addedNodes) {
                    ui.evidence_list.fixEvidenceItem(node);
                }
            }
        }

    };

    if (_CE_.vue.$store.getters["courtroom/addEvidencePermission"]) {
        ui.enhanceEvidenceTab();
    }

    // Watch for evidence permission or mod/owner status changes
    _CE_.vue.$watch(() => _CE_.vue.$store.state.courtroom.room.permissions.addEvidence == 0 || _CE_.vue.$store.state.courtroom.room.permissions.addEvidence == 1 && (_CE_.vue.isMod || _CE_.vue.isOwner) || _CE_.vue.isOwner,
        (newValue, oldValue) => {
            // Only run the enhancer function when permission are turned from OFF to ON
            if (newValue === false || newValue && oldValue) return;
            ui.enhanceEvidenceTab();
        });

    // CSS injector to change textbox style
    ui.StylePicker = {
        styleSheet: (function () { var style = document.createElement("style"); document.head.appendChild(style); return style; })(),
        customStyles: new Map([
            ["persona4golden", {
                "name": "Persona 4 Golden",
                "optionColor": "#ff9c19",
                "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100% !important;width: 100% !important;letter-spacing: normal!important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://z.zz.fo/XOpfX.png\") !important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100%;top: 0 !important;left: 0 !important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif!important;font-size: 1.4em !important;color: #4c2816!important;top: 70.5% !important;left: 4.8%!important;text-align: left !important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif!important;top: 76.6%!important;left: 5%!important;width: 86%!important;height: 20%!important;padding: 6px 0 !important;}"
            }],
            ["finalfantasy7", {
                "name": "FF7",
                "optionColor": "#0a02de",
                "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100% !important;width: 100% !important;letter-spacing: normal!important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://z.zz.fo/ZAF9I.png\") !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100% !important;top: 0 !important;left: 0 !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: \"Determination Sans\", Verdana, sans-serif!important;color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;top: 0!important;left: 0!important;margin: 45.7% 11.5% !important;padding: 1px 0 !important;width: 21.7% !important;height: 6.5% !important;line-height: normal !important;-webkit-text-stroke: unset !important;text-stroke: unset !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: \"Determination Sans\", Verdana, sans-serif!important;color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;top: 76.2%!important;left: 12%!important;width: 77.5%!important;height: 14.5%!important;line-height: normal !important;margin: 2px 0 !important;}"
            }],
            ["finalfantasy7alternative", {
                "name": "FF7 Alternative",
                "optionColor": "#0a02de",
                "css": "div.courtroom > div:nth-of-type(5) > div > div.chat-box {position: absolute !important;top: unset !important;left: 0 !important;bottom: 0 !important;width: 86% !important;height: 26% !important;margin: 0 7% 1.5% 7% !important;border: solid 1px #424542;box-shadow: 1px 1px #e7dfe7, -1px -1px #e7dfe7, 1px -1px #e7dfe7, -1px 1px #e7dfe7, 0 -2px #9c9a9c, -2px 0 #7b757b, 0 2px #424542;background: #04009dcc;background: -moz-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #04009dcc), color-stop(100%, #050039cc));background: -webkit-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: -o-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: -ms-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: linear-gradient(to bottom, #04009dcc 0%, #050039cc 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#04009dcc', endColorstr='#050039cc', GradientType=0);-webkit-border-radius: 7px;-moz-border-radius: 7px;border-radius: 7px;}div.courtroom > div:nth-of-type(5) > div > div.chat-box > img.name-plate-img {display: none !important;}div.courtroom > div:nth-of-type(5) > div > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div > div.name-plate {position: absolute !important;top: unset !important;left: 0 !important;bottom: 0 !important;width: 86% !important;height: 7% !important;padding: 0 !important;margin: 0 7% 14% 7% !important;background: unset !important;border: unset !important;}div.courtroom > div:nth-of-type(5) > div > div.name-plate > div.name-plate-text {top: 0 !important;left: 0 !important;width: 100% !important;padding: 0 3% !important;}div.courtroom > div:nth-of-type(5) > div > div.name-plate > div.name-plate-text, div.courtroom > div:nth-of-type(5) > div > div.name-plate > div.name-plate-text span {text-align: left;font-size: 1.5rem !important;color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;font-family: \"Determination Sans\", Verdana, sans-serif !important;letter-spacing: unset !important;-webkit-text-stroke: unset !important;text-stroke: unset !important;}div.courtroom > div:nth-of-type(5) > div > div.chat-box > div.chat-box-text {top: unset !important;left: unset !important;width: 100% !important;height: 78% !important;max-height: unset !important;margin: 4.5% 0 0 0 !important;text-align: left;padding: 0 3% !important;}div.courtroom > div:nth-of-type(5) > div > div.chat-box > div.chat-box-text span {color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;font-family: \"Determination Sans\", Verdana, sans-serif !important;line-height: unset !important;}"
            }],
            ["persona2", {
                "name": "Persona 2",
                "optionColor": "#bb0608",
                "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100% !important;width: 100% !important;letter-spacing: normal!important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://z.zz.fo/HXYhd.png\") !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100% !important;top: 0 !important;left: 0 !important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif !important;font-size: 20px!important;left: 6%!important;top: 72.5%!important;text-align: start !important;letter-spacing: unset!important;color: #9cfc04!important;-webkit-text-stroke: unset !important;text-stroke: unset !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif!important;top: 78.5%!important;left: 8%!important;width: 80%!important;height: 20.5%!important;line-height: 26px !important;color: #ff5151!important }"
            }],
            ["wc3human", {
                "name": "WC3 Human",
                "optionColor": "#ebbc3d",
                "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100%;width: 100%;letter-spacing: normal!important;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://z.zz.fo/XSCEi.gif\") }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100%;top: 0;left: 0 }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: Gothic, \"Song Light\", \"Friz Quadrata\", \"Times New Roman\", sans-serif!important;font-size: 1.2em !important;width: auto !important;color: #c49917!important;top: 72% !important;left: 18%!important;text-align: start;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: Gothic, \"Song Light\", \"Friz Quadrata\", \"Times New Roman\", sans-serif!important;font-size: 1.2em !important;top: 77%!important;left: 18%!important;width: 80%!important;height: 19%!important;}"
            }]
        ]),
        changeStyle: function (key) {
            if (this.customStyles.has(key)) {
                this.styleSheet.innerHTML = this.customStyles.get(key).css;
            } else {
                this.styleSheet.innerHTML = "";
            }
        },
        import: function (toImport) {
            if (!toImport[1].name || !toImport[1].css) { return false; }
            this.customStyles.set(toImport[0], toImport[1]);
            return true;
        }
    }
    ui.StylePicker.baseStyles = Array.from(ui.StylePicker.customStyles.keys());
    if (Array.isArray(_CE_.options.custom_styles)) {
        _CE_.options.custom_styles.forEach(customStyle => { ui.StylePicker.import(customStyle) });
    }

    // Add setting options under the Settings tab
    var enhanceSettingsTab = function () {
        const createInputCheckbox = function (options) {
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

        const createInputText = function (options) {
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
                style: { color: "white", backgroundColor: "#1e1e1e", lineHeight: "18px" }
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

            input.addEventListener("focus", function (e) {
                container.classList.add("v-input--is-focused", "primary--text");
                label.classList.add("primary--text");
            });

            input.addEventListener("focusout", function (e) {
                container.classList.remove("v-input--is-focused", "primary--text");
                label.classList.remove("primary--text");
                options.onfocusout.call(this, e);
            });

            return container;
        }

        const createInputSelect = function (options) {
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
                style: { color: "white", backgroundColor: "#1e1e1e" }
            });

            container.appendChild(inputControl);
            inputControl.appendChild(inputSlot);
            inputSlot.appendChild(selectSlot);
            selectSlot.append(label, select);

            if (options.display === false) {
                container.style.display = "none";
            }

            label.textContent = options.label;

            const parseOptions = function (values) {
                if (!values.some(value => { return Array.isArray(value); })) { // If NONE of the values are an array
                    values = [values].map(([key, text, color]) => { var j = {}; j.key = key; j.text = text; j.color = color; return j; })[0];
                    if (!values) { return false; }

                    const option = document.createElement("option");
                    option.setAttributes({
                        value: values.key,
                        textContent: values.text,
                        selected: (values.key === options.selectedValue)
                    });

                    if (values.color) option.style.color = values.color;
                    return option;
                } else {
                    values = [values].map(([label, elements]) => { var j = {}; j.label = label; j.elements = elements; return j; })[0];
                    if (!values) { return false; }

                    const optGroup = document.createElement("optgroup");
                    optGroup.label = values.label;
                    values.elements.forEach(value => {
                        var option = parseOptions(value);
                        optGroup.appendChild(option);
                    });
                    return optGroup;
                }
            }

            options.values.forEach(value => {
                const option = parseOptions(value);
                select.appendChild(option);
            });

            select.addEventListener("change", e => {
                options.onchange.call(this, e);
            });

            return container;
        };

        ui.extraSettings_warnOnExit = new createInputCheckbox({
            checked: _CE_.options.warn_on_exit,
            label: "Confirm on exit",
            onchange: e => {
                setSetting("warn_on_exit", e.target.checked);
            }
        });

        ui.extraSettings_rememberUsername = new createInputCheckbox({
            checked: _CE_.options.remember_username,
            label: "Remember username",
            onchange: e => {
                setSetting("remember_username", e.target.checked);
            }
        });

        ui.extraSettings_showConsole = new createInputCheckbox({
            checked: _CE_.options.show_console,
            label: "Show console",
            onchange: e => {
                const value = e.target.checked;
                setSetting("show_console", value);
                ui.Logger.toggle(value);
            }
        });

        ui.extraSettings_adjustChatTextWithWheel = new createInputCheckbox({
            checked: _CE_.options.adjust_chat_text_with_wheel,
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
            checked: _CE_.options.chat_hover_tooltip,
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
            checked: _CE_.options.disable_keyboard_shortcuts,
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
            checked: _CE_.options.evid_roulette,
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
            checked: _CE_.options.sound_roulette,
            label: "SND roulette",
            onchange: e => {
                const value = e.target.checked;
                setSetting("sound_roulette", value);
                ui.customButtons_soundRouletteButton.style.display = value ? "flex" : "none";
                ui.extraSettings_rouletteSoundMax.style.display = value ? "flex" : "none";
            }
        });

        ui.extraSettings_rouletteMusic = new createInputCheckbox({
            checked: _CE_.options.music_roulette,
            label: "MUS roulette",
            onchange: e => {
                const value = e.target.checked;
                setSetting("music_roulette", value);
                ui.customButtons_musicRouletteButton.style.display = value ? "flex" : "none";
                ui.extraSettings_rouletteMusicMax.style.display = value ? "flex" : "none";
            }
        });

        ui.extraSettings_globalButtons = new createInputCheckbox({
            checked: _CE_.options.global_buttons,
            label: "Global BGM/SFX Control Buttons",
            onchange: e => {
                const value = e.target.checked;
                setSetting("global_buttons", value);
                ui.customButton_stopSounds.style.display = value ? "flex" : "none";
                ui.customButton_stopMusic.style.display = value ? "flex" : "none";
                ui.customButton_stopSoundsMusic.style.display = value ? "flex" : "none";
            }
        });

        ui.extraSettings_muteBGMButtons = new createInputCheckbox({
            checked: _CE_.options.mute_bgm_buttons,
            label: "BGM Control Buttons",
            onchange: e => {
                const value = e.target.checked;
                setSetting("mute_bgm_buttons", value);
                ui.customButton_toggleBGM.style.display = value ? "flex" : "none";
            }
        });

        ui.extraSettings_rouletteEvidAsIcon = new createInputCheckbox({
            checked: _CE_.options.evid_roulette_as_icon,
            label: "Icon",
            title: "Smaller evidence in the corner",
            display: _CE_.options.evid_roulette,
            onchange: e => {
                setSetting("evid_roulette_as_icon", e.target.checked);
            }
        });

        ui.extraSettings_rouletteEvidMax = new createInputText({
            value: _CE_.options.evid_roulette_max,
            label: "max",
            type: "number",
            display: _CE_.options.evid_roulette,
            onfocusout: e => {
                const value = parseInt(e.target.value);
                if (value) {
                    setSetting("evid_roulette_max", value);
                } else {
                    e.target.value = _CE_.options.evid_roulette_max;
                    e.preventDefault();
                    return false;
                }
            }
        });

        ui.extraSettings_rouletteSoundMax = new createInputText({
            value: _CE_.options.sound_roulette_max,
            label: "max",
            type: "number",
            display: _CE_.options.sound_roulette,
            onfocusout: e => {
                const value = parseInt(e.target.value);
                if (value) {
                    setSetting("sound_roulette_max", value);
                } else {
                    e.target.value = _CE_.options.sound_roulette_max;
                    e.preventDefault();
                    return false;
                }
            }
        });

        ui.extraSettings_rouletteMusicMax = new createInputText({
            value: _CE_.options.music_roulette_max,
            label: "max",
            type: "number",
            display: _CE_.options.music_roulette,
            onfocusout: e => {
                const value = parseInt(e.target.value);
                if (value) {
                    setSetting("music_roulette_max", value);
                } else {
                    e.target.value = _CE_.options.music_roulette_max;
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

        ui.extraSettings_rowHeader.append(ui.extraSettings_resetButton);
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

        ui.extraSettings_textboxStyleSelector = new createInputSelect({
            label: "Inject CSS",
            values: [
                ["Styles", [
                    ["none", "None", "lightgrey"]
                ].concat(Array.from(ui.StylePicker.customStyles).map(([k, v]) => [k, v.name, v.optionColor]))
                ],
                ["Manage", [
                    ["import", "Import...", "lightgrey"],
                    ["remove", "Remove style...", "lightgrey"],
                    ["help", "Help", "lightgrey"]
                ]]
            ],
            selectedValue: _CE_.options.textbox_style,
            onchange: e => {
                const selected = e.target.value;
                if (selected === "import") {
                    e.target.value = _CE_.options.textbox_style; //Reset select to original value
                    const input = prompt("Paste your code here");
                    if (!input) { return; }
                    var toImport = JSON.parse(input);
                    if (!Array.isArray(toImport[0])) { toImport = [toImport] };

                    toImport.forEach(thisStyle => {
                        if (["none", "import", "remove"].includes(thisStyle[0])) { return; } // Don't allow reserved names
                        if (ui.StylePicker.import(thisStyle)) {
                            var option;
                            if (Array.from(e.target.options).some(option => { return option.value == thisStyle[0] })) { // Check if we are overwriting an existing option or adding a new one
                                option = Array.from(e.target.options).find(option => { return option.value == thisStyle[0] })
                                option.textContent = thisStyle[1].name;
                                option.style.color = thisStyle[1].optionColor;
                            } else {
                                option = document.createElement("option");
                                e.target.querySelector("optgroup[label='Styles']").appendChild(option);
                            }
                            option.value = thisStyle[0];
                            option.textContent = thisStyle[1].name;
                            option.style.color = thisStyle[1].optionColor;

                            if (thisStyle[0] === _CE_.options.textbox_style) {
                                e.target.dispatchEvent(new Event("change")); // Force change when updating the current active style
                            }
                        };
                    });

                    const toSave = JSON.stringify(
                        Array.from(ui.StylePicker.customStyles).filter(
                            ([k, v]) => { return !ui.StylePicker.baseStyles.includes(k); }
                        )
                    );
                    if (!toSave) { return; }
                    setSetting("custom_styles", toSave);

                    return e.preventDefault();
                } else if (selected === "remove") {
                    e.target.value = _CE_.options.textbox_style; //Reset select to original value
                    const input = prompt("Type a style ID or name to delete");
                    if (!input) { return; }
                    var key;
                    if (ui.StylePicker.customStyles.has(input)) {
                        key = input;
                    } else {
                        key = Array.from(ui.StylePicker.customStyles).find(s => { return s[1].name === input })?.[0];
                    }

                    if (!key || !ui.StylePicker.customStyles.has(key)) { return; }
                    if (["none", "import", "remove"].concat(ui.StylePicker.baseStyles).includes(input)) { return; }

                    ui.StylePicker.customStyles.delete(key);
                    e.target.options.remove(Array.from(e.target.options).indexOf(Array.from(e.target.options).find(option => { return option.value == key })));

                    const toSave = JSON.stringify(
                        Array.from(ui.StylePicker.customStyles).filter(
                            ([k, v]) => { return !ui.StylePicker.baseStyles.includes(k); }
                        )
                    );
                    if (!toSave) { return; }
                    setSetting("custom_styles", toSave);

                    if (key === _CE_.options.textbox_style) {
                        e.target.dispatchEvent(new Event("change")); // Force change when deleting the current style
                    }

                    return e.preventDefault();
                } else if (selected === "help") {
                    e.target.value = _CE_.options.textbox_style; //Reset select to original value
                    window.open("https://rentry.co/n2g92", '_blank');
                    return e.preventDefault();
                } else if (selected === "none" || ui.StylePicker.customStyles.has(selected)) { // Selected a style
                    ui.StylePicker.changeStyle(selected);
                    setSetting("textbox_style", selected);
                }
            }
        });

        ui.extraSettings_fileHostSelector = new createInputSelect({
            label: "File host",
            values: Array.from(ui.Uploader.fileHosts).map(([k, v]) => [k, v.name]),
            selectedValue: _CE_.options.file_host,
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
            ui.extraSettings_textboxStyleSelector,
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
        const musicControlContainer = rouletteEvidContainer.cloneNode();

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

        musicControlContainer.append(
            ui.extraSettings_globalButtons,
            ui.extraSettings_muteBGMButtons
        );

        ui.extraSettings_rowRoulettes.lastChild.append(rouletteEvidContainer, rouletteSoundContainer, rouletteMusicContainer, musicControlContainer);

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
    var addRightFrameExtraButtons = function () {
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

        // Music Control buttons row
        ui.customButtons_musicButtons = document.createElement("div");
        ui.customButtons_musicButtons.setAttributes({
            className: "row mt-2 no-gutters",
            style: {
                gap: "15px 5px"
            }
        });

        function sendFrameMessage(command, icon = "") {
            if (ui.leftFrame_sendButton.disabled || !ui.leftFrame_container.contains(ui.leftFrame_sendButton)) {
                return;
            }
            ui.leftFrame_textEditor.__vue__.$store.state.courtroom.frame.text += command;
            ui.leftFrame_textEditor.__vue__.send();

            if (icon) {
                ui.Logger.log(command, icon);
            }
        }

        ui.customButtons_evidRouletteButton = new createButton({
            label: "EVD",
            title: "Show a random piece of evidence",
            display: _CE_.options.evid_roulette,
            icon: "dice-multiple",
            onclick: () => {
                if (_CE_.vue.$store.state.courtroom.room.restrictEvidence) {
                    ui.Logger.log("Evidence is restricted");
                    _CE_.vue.$store.dispatch("courtroom/appendMessage", {
                        type: "error",
                        text: "Showing evidence is restricted to this courtroom's evidence list."
                    });
                    return;
                }
                sendFrameMessage("[#evd" + (_CE_.options.evid_roulette_as_icon ? "i" : "") + Math.floor(Math.random() * _CE_.options.evid_roulette_max) + "]", "image");
            }
        });

        ui.customButtons_soundRouletteButton = new createButton({
            label: "SFX",
            title: "Play a random sound",
            display: _CE_.options.sound_roulette,
            icon: "dice-multiple",
            onclick: () => {
                sendFrameMessage("[#bgs" + Math.floor(Math.random() * _CE_.options.sound_roulette_max) + "]", "volume-medium");
            }
        });

        ui.customButtons_musicRouletteButton = new createButton({
            label: "BGM",
            title: "Play a random song",
            display: _CE_.options.music_roulette,
            icon: "dice-multiple",
            onclick: () => {
                sendFrameMessage("[#bgm" + Math.floor(Math.random() * _CE_.options.music_roulette_max) + "]", "music-note");
            }
        });

        ui.customButtons_rowButtons.append(ui.customButtons_evidRouletteButton,
            ui.customButtons_soundRouletteButton,
            ui.customButtons_musicRouletteButton);

        // Music buttons
        if (typeof unsafeWindow !== "undefined" && typeof unsafeWindow.Howler === "object") {
            ui.customButton_stopAllSounds = new createButton({
                label: "Shut up BGM/SFX",
                title: "Stop all sounds that are currently playing (only for you)",
                icon: "volume-variant-off",
                backgroundColor: "teal",
                onclick: unsafeWindow.Howler.stop.bind()
            });

            ui.customButton_toggleBGM = new createButton({
                label: "Mute BGM",
                title: "Mutes the song that's currently playing (only for you)",
                display: _CE_.options.mute_bgm_buttons,
                icon: "volume-mute",
                backgroundColor: "teal",
                onclick: e => {
                    if (ui.customButton_toggleBGM.dataset.muted === "true") {
                        ui.customButton_toggleBGM.dataset.muted = "false";
                        ui.customButton_toggleBGM.querySelector("span.v-btn__content").lastChild.textContent = "Mute BGM";
                        ui.customButton_toggleBGM.querySelector(".v-icon").classList.add("mdi-volume-mute");
                        ui.customButton_toggleBGM.querySelector(".v-icon").classList.remove("mdi-volume-variant-off");
                    } else {
                        ui.customButton_toggleBGM.dataset.muted = "true";
                        ui.customButton_toggleBGM.querySelector("span.v-btn__content").lastChild.textContent = "Unmute BGM";
                        ui.customButton_toggleBGM.querySelector(".v-icon").classList.remove("mdi-volume-mute");
                        ui.customButton_toggleBGM.querySelector(".v-icon").classList.add("mdi-volume-variant-off");
                    }

                    for (const howl of unsafeWindow.Howler._howls) {
                        if (howl._loop || howl._src.slice(0, 13) === "/audio/music/") {
                            if (ui.customButton_toggleBGM.dataset.muted === "true") {
                                ui.customButton_toggleBGM.dataset.volume = howl._volume;
                                howl.volume(0.0);
                            } else {
                                howl.volume(Math.min(ui.customButton_toggleBGM.dataset.volume, 1.0));
                            }
                            break;
                        }
                    }
                }
            });

            ui.customButton_toggleBGM.dataset.muted = "false";

            ui.customButton_stopMusic = new createButton({
                label: "Stop BGM",
                title: "Stops the song that is currently playing (for everyone)",
                display: _CE_.options.global_buttons,
                icon: "volume-variant-off",
                backgroundColor: "crimson",
                onclick: () => {
                    sendFrameMessage("[#bgms]");
                }
            });

            ui.customButton_stopSounds = new createButton({
                label: "Stop SFX",
                title: "Stop all SFX that are currently playing (for everyone)",
                display: _CE_.options.global_buttons,
                icon: "volume-variant-off",
                backgroundColor: "crimson",
                onclick: () => {
                    sendFrameMessage("[#bgss]");
                }
            });

            ui.customButton_stopSoundsMusic = new createButton({
                label: "Stop BGM/SFX",
                title: "Stop all sounds that are currently playing (for everyone)",
                display: _CE_.options.global_buttons,
                icon: "volume-variant-off",
                backgroundColor: "crimson",
                onclick: () => {
                    sendFrameMessage("[#bgms][#bgss]");
                }
            });

            ui.customButton_getCurMusicUrl = new createButton({
                label: "BGM URL",
                title: "Get the URL for the song playing now",
                icon: "link-variant",
                backgroundColor: "teal",
                onclick: () => {
                    for (const howl of unsafeWindow.Howler._howls) {
                        if (howl._state == "loaded" && (howl._loop || howl._src.slice(0, 13) === "/audio/music/")) {
                            let bgm_url = howl._src;

                            // Look for a BGM in cache with a matching URL and get that name
                            const bgm_name = Object.values(_CE_.vue.$store.state.assets.music.cache).find(music => music.url === bgm_url);
                            if (typeof bgm_name.name === "string") bgm_url = bgm_name.name + " " + bgm_url;

                            if (!_CE_.options.show_console) {
                                alert(bgm_url);
                            }

                            ui.Logger.log(bgm_url, "link-variant");
                            break;
                        }
                    };
                }
            });

            ui.customButton_getCurSoundUrl = new createButton({
                label: "SFX URL",
                title: "Get the URL for the sfx playing now",
                icon: "link-variant",
                backgroundColor: "teal",
                onclick: e => {
                    for (const howl of unsafeWindow.Howler._howls) {
                        if (howl._state == "loaded" && howl._onend.length != 0) {
                            if (!_CE_.options.show_console) {
                                alert(howl._src);
                            }
                            ui.Logger.log(howl._src, "link-variant");
                        }
                    };
                }
            });

            ui.customButtons_rowButtons.append(ui.customButton_stopAllSounds,
                ui.customButton_getCurMusicUrl,
                ui.customButton_getCurSoundUrl);

            ui.customButtons_musicButtons.append(ui.customButton_toggleBGM,
                ui.customButton_stopMusic,
                ui.customButton_stopSounds,
                ui.customButton_stopSoundsMusic);

            ui.customButtons_rows.push(ui.customButtons_rowButtons, ui.customButtons_musicButtons);
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

                elemShowLogButton.addEventListener("mouseover", e => {
                    e.target.classList.remove("mdi-console");
                    e.target.classList.add("mdi-close-circle");
                });

                elemShowLogButton.addEventListener("mouseout", e => {
                    e.target.classList.remove("mdi-close-circle");
                    e.target.classList.add("mdi-console");
                });

                elemShowLogButton.addEventListener("click", e => {
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
            log: function (text, icon = null) {
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
                        icon.classList.add("mdi", "mr-1", "mdi-" + entry.icon);
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

                    if (_CE_.options.show_console && this.elemContainer.style.display == "none") {
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
    const on_chatBoxTextWheel = function (e) {
        if (ui.courtroom_chatBoxText === null || typeof ui.courtroom_chatBoxText === "undefined") {
            ui.courtroom_chatBoxText = ui.courtroom_container.querySelector("div.chat-box-text");
            ui.courtroom_chatBoxText.style.lineHeight = "1.3";
        }
        ui.courtroom_chatBoxText.style.fontSize = Math.min(100, Math.max(10, parseFloat(parseFloat(getComputedStyle(ui.courtroom_chatBoxText, null).getPropertyValue('font-size')) + e.deltaY * -0.01))) + "px";
    }
    if (_CE_.options.adjust_chat_text_with_wheel) {
        ui.courtroom_chatBoxes.addEventListener("wheel", on_chatBoxTextWheel);
    }

    // Make the "fade" courtroom elements click-through to right-click images underneath directly
    ui.courtroom_container.querySelectorAll("div.fade_everything, div.fade_scene, div.fade_background").forEach(f => {
        f.style.pointerEvents = "none";
    });
    ui.courtroom_container.querySelector("div.scene-container").style.pointerEvents = "auto";

    // Chat log handler
    _CE_.vue.$watch("$store.state.courtroom.messages", () => {
        setTimeout(() => {
            {
                for (let messageNode of ui.chatLog_chatList.children) {
                    const messageIcon = messageNode.querySelector('i');
                    if (!messageIcon.matches('.mdi-account, .mdi-crown, .mdi-account-tie')) continue;

                    const messageTextDiv = messageNode.querySelector('div.chat-text');
                    const html = messageTextDiv.innerHTML;
                    if (html.includes('</a>')) continue;

                    messageTextDiv.innerHTML = html.replaceAll(
                        URL_REGEX,
                        '<a target="_blank" rel="noreferrer" href="$1">$1</a>',
                    );
                }

                if (ui.chatLog_chatList.lastChild.querySelector("div.chat-text").textContent.includes("[Play Music]")) {
                    for (const howl of unsafeWindow.Howler._howls) {
                        if (howl._loop || howl._src.slice(0, 13) === "/audio/music/") {
                            if (ui.customButton_toggleBGM.dataset.muted == "true") {
                                ui.customButton_toggleBGM.dataset.volume = howl._volume;
                                howl.volume(0.0);
                            } else {
                                ui.customButton_toggleBGM.dataset.muted = "false"
                                ui.customButton_toggleBGM.dataset.volume = howl._volume;
                            }
                            break;
                        }
                    };
                }
            }
        }, 0)
    });

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

            if (_CE_.options.chat_hover_tooltip) {
                ui.chatLog_chat.addEventListener("mouseover", this.onChatListMouseOver, false);
            }
            this.tooltipElement.addEventListener("mouseenter", e => { e.target.style.opacity = "1"; });
            this.tooltipElement.addEventListener("mouseleave", this.onChatItemMouseLeave.bind(this), { capture: false });
            this.tooltipElement.addEventListener("transitioncancel", e => {
                if (e.target.style.opacity == "0") {
                    e.target.style.visibility = "hidden";
                }
            });
            this.tooltipElement.addEventListener("transitionend", e => {
                if (e.target.style.opacity == "0") {
                    e.target.style.visibility = "hidden";
                    this.tooltipElement.querySelectorAll("audio, video").forEach(f => { f.pause(); });
                    this.tooltipElement.querySelectorAll("iframe[src^=\"https://www.youtube.com/embed/\"]").forEach(f => { f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); });
                    this.tooltipElement.removeEventListener("mouseleave", this.onChatItemMouseLeave, { capture: false });
                    this.chat.element.removeEventListener("mouseleave", this.onChatItemMouseLeave, { capture: false });
                }
            });

            return this.tooltipElement;
        },

        reposition() {
            let top = 0;
            if (!this.tooltipElement || !this.chat.element) { return; }

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
                    style: { display: "inline-block", fontSize: "14px" }
                });
                const i = document.createElement("i");
                i.setAttributes({
                    className: "mdi mdi-open-in-new",
                    style: { marginLeft: "2px", fontSize: "12px" }
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
                    style: { maxWidth: "280px", maxHeight: "300px" }
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
                    style: { display: "inline-block" }
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
                    style: { maxWidth: "280px", maxHeight: "300px", display: "none" }
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
                if (!key) { return; }
                var timeStart = url.searchParams.get("t") || url.searchParams.get("start") || 0;
                if (timeStart && !/^\d+$/.test(timeStart)) { // convert 2m5s to 125
                    timeStart = timeStart.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
                    timeStart = 3600 * (timeStart[1] || 0) + 60 * (timeStart[2] || 0) + 1 * (timeStart[3] || 0);
                }
                youtubeEmbed.setAttributes({
                    src: "https://www.youtube.com/embed/" + key + "?enablejsapi=1&start=" + timeStart,
                    loop: "true",
                    width: "320",
                    height: "180",
                    frameborder: "0",
                    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                    allowFullscreen: "true",
                    style: { maxWidth: "320px", maxHeight: "180px", display: "inline-block" }
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
                    style: { maxWidth: "280px", maxHeight: "300px", height: "30px", display: "none" }
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
            return text.match(URL_REGEX).map(word => {
                try {
                    return new URL(word);
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);
        },

        chatItemPopulate(chat) {
            const matchedElements = [];

            this.extractUrls(chat.text).forEach(url => {
                matchedElements.push(this.embedFiles.link.call(this, url));
                const extension = url.pathname.substring(url.pathname.lastIndexOf('.') + 1);

                if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension) || url.host == "pbs.twimg.com") {
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
            matchedElements.forEach(f => { this.tooltipElement.appendChild(f) });
            this.reposition();
            this.tooltipElement.setAttributes({
                style: {
                    visibility: "visible",
                    opacity: "1"
                }
            });
            this.chat.element.addEventListener("mouseleave", this.onChatItemMouseLeave, { capture: false });
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
                        this.chat.element.addEventListener("mouseleave", this.onChatItemMouseLeave, { capture: false });
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
    const disableKeyboardShortcuts = function (e) {
        if ("wasd".includes(e.srcKey)) {
            e.stopImmediatePropagation()
        }
    };

    if (_CE_.options.disable_keyboard_shortcuts) {
        ui.main.addEventListener("shortkey", disableKeyboardShortcuts, true);
        ui.settings_keyboardShortcutsWS.style.display = "none";
        ui.settings_keyboardShortcutsAD.style.display = "none";
    }

    ui.StylePicker.changeStyle(_CE_.options.textbox_style);

}

function on_beforeUnload(e) {
    if (_CE_.options.warn_on_exit) {
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
    _CE_.options[setting_name] = value;
    return storeSet("setting_" + setting_name, value);
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
    _CE_.options.warn_on_exit = false;
    window.location.reload();
};

const CrossOrigin = (function () {
    try {
        return (typeof GM !== "undefined" && GM !== null ? GM.xmlHttpRequest : void 0) || GM_xmlhttpRequest;
    } catch (e) {
        return console.error(e);
    }
})();

// Helper function to set multiple element attributes at once
Element.prototype.setAttributes = function (attr) { var recursiveSet = function (at, set) { for (var prop in at) { if (typeof at[prop] == 'object' && at[prop].dataset == null && at[prop][0] == null) { recursiveSet(at[prop], set[prop]); } else { set[prop] = at[prop]; } } }; recursiveSet(attr, this); }
