// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://github.com/w452tr4w5etgre/
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.709
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

var initSettings = function() {
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
        "evid_roulette_max": Math.max(getSetting("evid_roulette_max", 0), 485000),
        "sound_roulette_max": Math.max(getSetting("sound_roulette_max", 0), 41700),
        "music_roulette_max": Math.max(getSetting("music_roulette_max", 0), 137000)
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
            if (node instanceof HTMLDivElement && node.classList.contains("v-dialog__content--active") && node.querySelector("div.v-card__title > span.headline").textContent.trim() === "Join Courtroom") {
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
                switch (toolbarTab.textContent.trim()) {
                    case "Chat Log":
                        ui.rightFrame_toolbarTabChatLog = toolbarTab;
                        break;
                    case "Evidence":
                        ui.rightFrame_toolbarTabEvidence = toolbarTab;
                        break;
                    case "Backgrounds":
                        ui.rightFrame_toolbarTabBackgrounds = toolbarTab;
                        break;
                    case "Settings":
                        ui.rightFrame_toolbarTabSettings = toolbarTab;
                        break;
                    case "Admin":
                        ui.rightFrame_toolbarTabAdmin = toolbarTab;
                        break;
                    default:
                        console.error("Tab not found: " + toolbarTab.textContent);
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
        on_myAssetsAdded: function(node) {
            const tabsContainer = node.querySelector("div.v-dialog > div.v-card > div.v-window > div.v-window__container");
            this.element = node;
            this.observer = new MutationObserver(this.on_myAssetsListChange.bind(this))
            this.observer.observe(tabsContainer, {childList: true});
        },
        on_myAssetsListChange: function(changes, observer) {
            const node = this.element;
            for (const change of changes) {
                var musicFilePicker, soundFilePicker;
                for (const addedNode of change.addedNodes) {
                    const activeTab = node.querySelector("div.v-dialog > div.v-card > div.v-tabs > div.v-tabs-bar > div > div.v-tabs-bar__content > div.v-tab.v-tab--active");
                    const activeWindow = addedNode.parentNode.childNodes[Array.from(activeTab.parentNode.children).indexOf(activeTab)-1];
                    switch (activeTab.firstChild.firstChild.textContent.trim()) {
                        case "Backgrounds":
                            break;
                        case "Characters":
                            break;
                        case "Popups":
                            break;
                        case "Music":
                            musicFilePicker = ui.Uploader.filePicker(uploaderResponse => {
                                const inputName = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(1) div.v-text-field__slot > input[type=text]");
                                const inputURL = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(2) div.v-text-field__slot > input[type=text]");
                                inputName.value = uploaderResponse.filename;
                                inputName.dispatchEvent(new Event("input"));
                                inputURL.value = uploaderResponse.url;
                                inputURL.dispatchEvent(new Event("input"));
                            }, {label: "music", acceptedhtml:"audio/*", acceptedregex:"^audio/", maxsize: 25e6});
                            activeWindow.querySelector("div.v-card__actions").prepend(musicFilePicker);
                            break;
                        case "Sounds":
                            soundFilePicker = ui.Uploader.filePicker(uploaderResponse => {
                                const inputName = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(1) div.v-text-field__slot > input[type=text]");
                                const inputURL = activeWindow.querySelector("div.v-card__text > div.v-input:nth-of-type(2) div.v-text-field__slot > input[type=text]");
                                inputName.value = uploaderResponse.filename;
                                inputName.dispatchEvent(new Event("input"));
                                inputURL.value = uploaderResponse.url;
                                inputURL.dispatchEvent(new Event("input"));
                            }, {label: "sound", acceptedhtml:"audio/*", acceptedregex:"^audio/", maxsize: 25e6});
                            activeWindow.querySelector("div.v-card__actions").prepend(soundFilePicker);
                            break;
                    }
                }
            }
        },
        on_myAssetsRemoved: function(node) {
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
                        img.style.cursor = "pointer";
                        img.addEventListener("click", e => {closeButton.click();});
                    } else {
                        const dialogTitle = node.querySelector("header.v-sheet > div.v-toolbar__content > div.v-toolbar__title").textContent.trim();
                        switch (dialogTitle) {
                            case "Pairing":
                                break;
                            case "Change Character":
                                break;
                            case "Manage Character":
                                break;
                            case "My Assets":
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

    // Function to create a button
    const createButton = function(id, label, icon = null, callback) {
        let elem_div = document.createElement("div");
        elem_div.setAttributes({
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

        ui.evidence_formBottomRow_container = document.createElement("div");
        ui.evidence_formBottomRow_container.className = "d-flex justify-space-between";
        ui.evidence_formBottomRow_container.style.width = "100%";
        ui.evidence_formBottomRow_container.style.alignItems = "center";
        ui.evidence_formBottomRow_buttonsColumn.className = "d-flex";
        ui.evidence_formBottomRow_container.append(ui.evidence_formBottomRow_buttonsColumn);
        ui.evidence_formBottomRow.append(ui.evidence_formBottomRow_container);

        // Add evidence sources

        ui.Uploader = {
            parseForm: function(data) {
                const form = new FormData();
                Object.entries(data).filter(([key, value]) => value !== null).map(([key, value]) => form.append(key, value));
                return form;
            },

            upload: function (data, callbackSuccess, callbackError) {
                var reqtype, file, filename;
                if (typeof data === "string") { // Argument passed is an URL
                    try {
                        let url = new URL(data);
                        switch (url.host) {
                            case "pbs.twimg.com":
                                url.href = url.origin + url.pathname + "." + (url.searchParams.get("format") || "jpg") + "?name=" + (url.searchParams.get("name") || "orig");
                                break;
                        }
                        reqtype = "urlupload";
                        filename = (url.pathname.substring(0, url.pathname.lastIndexOf('.')) || url.pathname.name).replace(/^.*[\\\/]/, '');
                        file = url.href;
                    } catch(e) {
                        throw e;
                    }
                } else if (typeof data === "object" && data instanceof File) { // Argument is a file
                    file = data;
                    reqtype = "fileupload";
                    filename = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
                } else {
                    throw new Error("Invalid data");
                }

                CrossOrigin({
                    url: "https://catbox.moe/user/api.php",
                    method: "POST",
                    data: this.parseForm({
                        reqtype: reqtype,
                        fileToUpload: file,
                        url: file
                    }),
                    onload: response => {
                        if (response.readyState == 4 && response.status == 200) {
                            callbackSuccess({url: response.responseText, filename: filename});
                        } else {
                            callbackError("Err " + response.status + ":" + response.responseText);
                        }
                    },
                    onabort: response => {
                        callbackError("Aborted");
                    },
                    onerror: response => {
                        callbackError(response.error);
                    },
                    ontimeout: response => {
                        callbackError("Timeout");
                    }
                });
            },

            filePicker: function(callback, options) {
                const label = options.label || "image";
                const acceptedhtml = options.acceptedhtml || "image/*";
                const acceptedregex = options.acceptedregex || "^image/";
                const maxsize = options.maxsize || 2e6;

                const resetElem = function() {
                    elemContainer.setAttributes({
                        title: "",
                        firstChild: {className: "v-icon v-icon--left mdi mdi-image-size-select-large"},
                        lastChild: {textContent: "Upload " + label},
                        style: {
                            borderColor: "teal",
                            pointerEvents: "auto",
                            cursor: "pointer"
                        }
                    });
                };

                const uploadError = function(errorText) {
                    elemContainer.setAttributes({
                        title: errorText,
                        firstChild: {className: "v-icon v-icon--left mdi mdi-alert"},
                        lastChild: {textContent: errorText.substr(0, 20)},
                        style: {
                            borderColor: "red",
                            pointerEvents: "auto",
                            cursor: "not-allowed"
                        }
                    });
                    setTimeout(resetElem, 3000);
                    ui.Logger.log("Upload error: " + errorText);
                }

                const uploadCallbackSuccess = function() {
                    resetElem();
                    callback.apply(this, arguments);
                };

                const elemContainer = document.createElement("div");
                elemContainer.setAttributes({
                    className: "d-flex justify-center",
                    style: {
                        alignItems: "center",
                        minWidth: "140px",
                        border: "2px dashed teal",
                        padding: "0px 10px",
                        userSelect: "none",
                        cursor: "pointer"
                    }
                });

                const elemIcon = document.createElement("i");
                elemIcon.className = "v-icon v-icon--left mdi mdi-image-size-select-large";
                elemContainer.append(elemIcon);
                elemIcon.after(document.createTextNode("Upload " + label));

                const elemFile = document.createElement("input");
                elemFile.setAttributes({
                    type: "file",
                    accept: acceptedhtml,
                    style: {opacity: 0}
                });

                elemContainer.addEventListener("click", e => {
                    elemFile.click();
                });

                const uploaderElementEvent = function(e) {
                    e.preventDefault();
                    try {
                        var dataList, file;
                        if (e.target.files && e.target.files.length > 0) { // File picked
                            dataList = e.target.files;
                        } else if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) { // File dragged
                            dataList = e.dataTransfer.files;
                        } else if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) { // URL dragged
                            dataList = e.dataTransfer.items;
                        } else {
                            return;
                        }

                        if (dataList instanceof FileList) {
                            for (const data of dataList) {
                                if (!data.type.match(acceptedregex)) {
                                    throw new Error("File type");
                                }
                                if (data.size >= maxsize) {
                                    throw new Error("Max size: " + maxsize / 1e6 + "MB");
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
                            this.upload(file, uploadCallbackSuccess, uploadError);
                        } else if (file instanceof DataTransferItem && file.kind == "string") {
                            file.getAsString(url => {
                                this.upload(url, uploadCallbackSuccess, uploadError);
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

                return elemContainer;
            }
        };

        const evidenceUploaders = function() {
            ui.evidence_formBottomRow_uploaderColumn = document.createElement("div");
            ui.evidence_formBottomRow_uploaderColumn.setAttributes({
                className: "d-flex justify-center",
                style: {
                    gap: "8px",
                    flex: "2 1 auto",
                }
            });

            const evidenceImageUploader = ui.Uploader.filePicker(res => {
                ui.evidence_formFields[0].value = res.filename.substr(0, 20);
                ui.evidence_formFields[0].dispatchEvent(new Event("input"));
                ui.evidence_formFields[1].value = res.url;
                ui.evidence_formFields[1].dispatchEvent(new Event("input"));
            }, {label: "image", acceptedhtml:"image/*", acceptedregex:"^image/", maxsize: 2e6});

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
                        if (getterResponse.readyState == 4 && getterResponse.status == 200) {
                            var responseJSON = JSON.parse(getterResponse.responseText);
                            if (!responseJSON.post) {
                                gelbooruInputTags.value = "No results";
                                gelbooruInputTags.style.color = "white";
                                gelbooruInputTags.disabled = false;
                                gelbooruInputTags.addEventListener("focus", e => {
                                    e.target.value = "";
                                }, {once: true});

                                return;
                            }
                            ui.Uploader.upload(responseJSON.post[0].file_url, uploaderResponse => {
                                ui.evidence_formFields[0].value = responseJSON.post[0].id;
                                ui.evidence_formFields[0].dispatchEvent(new Event("input"));
                                ui.evidence_formFields[1].value = uploaderResponse.url;
                                ui.evidence_formFields[1].dispatchEvent(new Event("input"));
                                gelbooruInputTags.value = "";
                                gelbooruInputTags.style.color = "white";
                                gelbooruInputTags.disabled = false;
                                gelbooruIcon.click();
                                setTimeout(f => {ui.evidence_addButton.click()}, 500);
                            });
                        }
                    }
                });
            });

            ui.evidence_formBottomRow_uploaderColumn.append(evidenceImageUploader, gelbooruUploader);

            ui.evidence_formBottomRow_container.append(ui.evidence_formBottomRow_uploaderColumn);
        }();

        // Show evidence count
        const evidenceCounter = function() {
            ui.evidence_formBottomRow_counterColumn = document.createElement("div");
            ui.evidence_formBottomRow_counterColumn.className = "d-flex";
            ui.evidence_formBottomRow_counterText = document.createElement("div");

            ui.evidence_formBottomRow_counterText.updateCount = function() {
                const evidMax = 75, evidCount = Math.max(ui.evidence_list.childElementCount, 0);
                if (evidCount == evidMax) {
                    this.className = "mdi mdi-alert error--text";
                } else if (evidCount / evidMax > 0.9) {
                    this.className = "warning--text";
                } else {
                    this.className = "success--text";
                }
                this.textContent = evidCount + " / " + evidMax;
            };

            ui.evidence_formBottomRow_counterColumn.append(ui.evidence_formBottomRow_counterText);
            ui.evidence_formBottomRow_container.append(ui.evidence_formBottomRow_counterColumn);
            ui.evidence_formBottomRow_counterText.updateCount();
        }();


        // Adjust evidence items
        ui.evidence_list.fixEvidenceItem = function(node) {
            const divCard = node.firstChild;
            const divImage = divCard.querySelector("div.v-image");
            const divTitle = divCard.querySelector("div.v-card__title");
            const divSubtitle = divCard.querySelector("div.v-card__subtitle");
            const divActions = divCard.querySelector("div.v-card__actions");
            const buttonEye = divActions.querySelector("button > span.v-btn__content > i.mdi-eye").parentNode.parentNode;

            divSubtitle.style.padding = "8px";
            buttonEye.style.display = "none";

            divActions.setAttributes({
                style: {
                    backgroundColor: "rgb(40, 40, 40)",
                    boxShadow: "black 0px 3px 10px 0px",
                    opacity: "0",
                    visibility: "hidden",
                    position: "absolute",
                    width: "100%",
                    height: "38px",
                    transition: "opacity 0.1s ease-in-out 0s"
                }
            });

            divSubtitle.insertAdjacentElement("beforebegin", divActions);

            divImage.style.cursor = "pointer";
            divImage.addEventListener("click", e => {
                if (divActions.contains(e.target)) {
                    return;
                }
                buttonEye.click();
            }, true);

            divCard.addEventListener("mouseenter", e => {
                divActions.style.visibility = "visible";
                divActions.style.opacity = "1";
            });

            divCard.addEventListener("mouseleave", e => {
                divActions.style.visibility = "hidden";
                divActions.style.opacity = "0";
            });
        };

        (new MutationObserver(on_evidenceListChange)).observe(ui.evidence_list, {childList: true});
        function on_evidenceListChange(changes, observer) {
            ui.evidence_formBottomRow_counterText.updateCount();
            for (const change of changes) {
                for (const node of change.addedNodes) {
                    ui.evidence_list.fixEvidenceItem(node);
                }
            }
        }
    }();

    // Add setting options under the Settings tab
    var enhanceSettingsTab = function() {
        var createExtraSettingElemCheckbox = function(id, text, callback) {
            const div = document.createElement("div");
            div.setAttributes({
                className: "v-input d-inline-block mr-2"
            });

            const div_input_control = document.createElement("div");
            div_input_control.setAttributes({
                className: "v-input__control"
            });
            div.appendChild(div_input_control);

            const div_input_slot = document.createElement("div");
            div_input_slot.setAttributes({
                className: "v-input__slot"
            });
            div_input_control.appendChild(div_input_slot);

            const div_input_selection = document.createElement("div");
            div_input_selection.setAttributes({
                className: "v-input--selection-controls__input mr-0"
            });
            div_input_slot.appendChild(div_input_selection);

            const input = document.createElement("input");
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

            const label = document.createElement("label");
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

        var createExtraSettingElemText = function(id, text, callback, input_type="text") {
            const div_column = document.createElement("div");
            div_column.setAttributes({
                className: "d-inline-block"
            });

            const div = document.createElement("div");
            div.setAttributes({
                className: "v-input v-text-field",
                style: {
                    padding: "0px"
                }
            });
            div_column.appendChild(div);

            const div_input_control = document.createElement("div");
            div_input_control.setAttributes({
                className: "v-input__control"
            });
            div.appendChild(div_input_control);

            const div_input_slot = document.createElement("div");
            div_input_slot.setAttributes({
                className: "v-input__slot",
                style: {
                    margin: "0"
                }
            });
            div_input_control.appendChild(div_input_slot);

            const div_input_selection = document.createElement("div");
            div_input_selection.setAttributes({
                className: "v-text-field__slot"
            });
            div_input_slot.appendChild(div_input_selection);

            const label = document.createElement("label");
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

            const input = document.createElement("input");
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

        ui.extraSettings_warnOnExit = createExtraSettingElemCheckbox("warn_on_exit", "Confirm on exit", e => {
            const value = e.target.checked;
            setSetting("warn_on_exit", value);
        });

        ui.extraSettings_rememberUsername = createExtraSettingElemCheckbox("remember_username", "Remember username", e => {
            const value = e.target.checked;
            setSetting("remember_username", value);
        });

        ui.extraSettings_showConsole = createExtraSettingElemCheckbox("show_console", "Show log console", e => {
            const value = e.target.checked;
            setSetting("show_console", value);
            ui.customButtons_rowLogLogger.style.display = value ? "flex" : "none";
        });

        ui.extraSettings_adjustChatTextWithWheel = createExtraSettingElemCheckbox("adjust_chat_text_with_wheel", "Scroll to adjust text", e => {
            const value = e.target.checked;
            setSetting("adjust_chat_text_with_wheel", value);
            if (value) {
                ui.courtroom_chatBoxes.addEventListener("wheel", on_chatBoxTextWheel);
            } else {
                ui.courtroom_chatBoxes.removeEventListener("wheel", on_chatBoxTextWheel);
            }
        });

        ui.extraSettings_chatHoverTooltip = createExtraSettingElemCheckbox("chat_hover_tooltip", "Link tooltips", e => {
            const value = e.target.checked;
            setSetting("chat_hover_tooltip", value);
            if (value) {
                ui.chatLog_chat.addEventListener("mouseover", onChatListMouseOver, false);
            } else {
                ui.chatLog_chat.removeEventListener("mouseover", onChatListMouseOver, false);
            }
        });

        ui.extraSettings_disableKeyboardShortcuts = createExtraSettingElemCheckbox("disable_keyboard_shortcuts", "Disable WASD shortcuts", e => {
            const value = e.target.checked;
            setSetting("disable_keyboard_shortcuts", value);
            if (value) {
                ui.main.addEventListener("shortkey", disableKeyboardShortcuts, true);
            } else {
                ui.main.removeEventListener("shortkey", disableKeyboardShortcuts, true);
            }
            ui.settings_keyboardShortcutsWS.style.display = value ? "none" : "flex";
            ui.settings_keyboardShortcutsAD.style.display = value ? "none" : "flex";
        });

        ui.extraSettings_rouletteEvid = createExtraSettingElemCheckbox("evid_roulette", "Evidence roulette", e => {
            const value = e.target.checked;
            setSetting("evid_roulette", value);
            ui.customButtons_evidRouletteButton.style.display = value ? "inline" : "none";
            ui.extraSettings_rouletteEvidAsIcon.style.display = value ? "inline-block" : "none";
            ui.extraSettings_rouletteEvidMax.style.display = value ? "inline-block" : "none";
        });

        ui.extraSettings_rouletteSound = createExtraSettingElemCheckbox("sound_roulette", "Sound roulette", e => {
            const value = e.target.checked;
            setSetting("sound_roulette", value);
            ui.customButtons_soundRouletteButton.style.display = value ? "inline" : "none"
            ui.extraSettings_rouletteSoundMax.style.display = value ? "inline-block" : "none";
        });

        ui.extraSettings_rouletteMusic = createExtraSettingElemCheckbox("music_roulette", "Music roulette", e => {
            const value = e.target.checked;
            setSetting("music_roulette", value);
            ui.customButtons_musicRouletteButton.style.display = value ? "inline" : "none"
            ui.extraSettings_rouletteMusicMax.style.display = value ? "inline-block" : "none";
        });

        ui.extraSettings_rouletteEvidAsIcon = createExtraSettingElemCheckbox("evid_roulette_as_icon", "icon", e => {
            const value = e.target.checked;
            setSetting("evid_roulette_as_icon", value);
        });

        ui.extraSettings_rouletteEvidMax = createExtraSettingElemText("evid_roulette_max", "max", e => {
            const value = parseInt(e.target.value);
            if (value) {
                setSetting("evid_roulette_max", value);
            } else {
                e.target.value = scriptSetting.evid_roulette_max;
                e.preventDefault();
                return false;
            }
        }, "number");

        ui.extraSettings_rouletteSoundMax = createExtraSettingElemText("sound_roulette_max", "max", e => {
            const value = parseInt(e.target.value);
            if (value) {
                setSetting("sound_roulette_max", value);
            } else {
                e.target.value = scriptSetting.sound_roulette_max;
                e.preventDefault();
                return false;
            }
        }, "number");

        ui.extraSettings_rouletteMusicMax = createExtraSettingElemText("music_roulette_max", "max", e => {
            const value = parseInt(e.target.value);
            if (value) {
                setSetting("music_roulette_max", value);
            } else {
                e.target.value = scriptSetting.music_roulette_max;
                e.preventDefault();
                return false;
            }
        }, "number")

        // Get the <hr> separator on the Settings page
        const settings_separator = ui.settings_separator;

        // Row 1 - Header
        const extraSettings_rows = [];
        ui.extraSettings_rowHeader = document.createElement("h3");
        ui.extraSettings_rowHeader.textContent = "Courtroom Enhancer";

        ui.extraSettings_resetButton = createButton("extraSettings_reset", "Reset and reload", "refresh", e => {
            if (!confirm("Reset Courtroom Enhancer settings and refresh the page?")) {
                return;
            }
            storeClear();
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
        ui.extraSettings_rowButtons = ui.settings_switchDiv.cloneNode();
        ui.extraSettings_rowButtons.appendChild(ui.settings_switchDiv.firstChild.cloneNode());
        ui.extraSettings_rowButtons.lastChild.append(ui.extraSettings_warnOnExit,
                                                     ui.extraSettings_rememberUsername,
                                                     ui.extraSettings_showConsole,
                                                     ui.extraSettings_adjustChatTextWithWheel,
                                                     ui.extraSettings_chatHoverTooltip,
                                                     ui.extraSettings_disableKeyboardShortcuts);
        extraSettings_rows.push(ui.extraSettings_rowButtons);

        // Row 3 - Roulettes
        ui.extraSettings_rowRoulettes = ui.settings_switchDiv.cloneNode();

        ui.extraSettings_rowRoulettes.appendChild(ui.settings_switchDiv.firstChild.cloneNode());

        ui.extraSettings_rouletteEvidMax.classList.remove("d-inline-block");
        ui.extraSettings_rouletteEvidMax.setAttributes({
            style: {
                display: scriptSetting.evid_roulette ? "inline-block" : "none",
                padding: "0px",
                marginRight: "8px"
            }
        });
        ui.extraSettings_rouletteEvidMax.querySelector("input").setAttributes({
            maxLength: "7",
            min: "0",
            max: "9999999",
            style: {
                width:"55px"
            }
        });

        ui.extraSettings_rouletteSoundMax.classList.remove("d-inline-block");
        ui.extraSettings_rouletteSoundMax.setAttributes({
            style: {
                display: scriptSetting.sound_roulette ? "inline-block" : "none",
                padding: "0px",
                marginRight: "8px"
            }
        });
        ui.extraSettings_rouletteSoundMax.querySelector("input").setAttributes({
            maxLength: "7",
            min: "0",
            max: "9999999",
            style: {
                width:"45px"
            }
        });

        ui.extraSettings_rouletteMusicMax.classList.remove("d-inline-block");
        ui.extraSettings_rouletteMusicMax.setAttributes({
            style: {
                display: scriptSetting.music_roulette ? "inline-block" : "none",
                padding: "0px",
                marginRight: "8px"
            }
        });
        ui.extraSettings_rouletteMusicMax.querySelector("input").setAttributes({
            maxLength: "7",
            min: "0",
            max: "9999999",
            style: {
                width:"55px"
            }
        });

        ui.extraSettings_rowRoulettes.lastChild.append(
            ui.extraSettings_rouletteEvid,
            ui.extraSettings_rouletteEvidAsIcon,
            ui.extraSettings_rouletteEvidMax,
            ui.extraSettings_rouletteSound,
            ui.extraSettings_rouletteSoundMax,
            ui.extraSettings_rouletteMusic,
            ui.extraSettings_rouletteMusicMax);
        extraSettings_rows.push(ui.extraSettings_rowRoulettes);

        // Find the element after the last <hr> and attach the extra settings before it
        ui.settings_afterSeparator = settings_separator.nextElementSibling;
        extraSettings_rows.forEach(row => {
            ui.settings_afterSeparator.insertAdjacentElement("beforebegin", row);
        });

        // Add the <hr> separator after the last row
        ui.settings_afterSeparator.insertAdjacentElement("beforebegin",settings_separator.cloneNode());
    }();

    // Create additional buttons container below the right panels
    var addRightFrameExtraButtons = function() {
        ui.customButtonsContainer = ui.rightFrame_container.insertAdjacentElement("afterend", document.createElement("div"));
        ui.customButtonsContainer.className = "mx-0 mx-md-4 mt-4 rounded-0";

        ui.customButtons_rows = []

        // Roulette buttons row
        ui.customButtons_rowButtons = document.createElement("div");
        ui.customButtons_rowButtons.setAttributes({
            className: "row no-gutters",
            style: {
                gap: "10px"
            }
        });

        ui.customButtons_evidRouletteButton = createButton("customButtons_evidRoulette", "EVD", "dice-multiple", e => {
            // Check if the send button is not on cooldown
            if (ui.leftFrame_sendButton.disabled || !ui.leftFrame_container.contains(ui.leftFrame_sendButton)) {
                return;
            }

            const random = Math.floor(Math.random() * scriptSetting.evid_roulette_max);

            ui.leftFrame_textarea.value = "[#evd" + (scriptSetting.evid_roulette_as_icon ? "i" : "") + random + "]";
            ui.leftFrame_textarea.dispatchEvent(new Event("input"));

            // Click Send button
            ui.leftFrame_sendButton.click()
            ui.Logger.log("[#evd" + (scriptSetting.evid_roulette_as_icon ? "i" : "") + random + "]", "image");
        });
        ui.customButtons_evidRouletteButton.setAttributes({
            title: "Show a random piece of evidence",
            style: {
                display: scriptSetting.evid_roulette ? "inline" : "none"
            }
        });

        ui.customButtons_soundRouletteButton = createButton("customButtons_soundRoulette", "SFX", "dice-multiple", e => {
            // Check if the send button is not on cooldown
            if (ui.leftFrame_sendButton.disabled || !ui.leftFrame_container.contains(ui.leftFrame_sendButton)) {
                return;
            }

            const random = Math.floor(Math.random() * scriptSetting.sound_roulette_max);

            ui.leftFrame_textarea.value = "[#bgs" + random + "]";
            ui.leftFrame_textarea.dispatchEvent(new Event("input"));

            // Click Send button
            ui.leftFrame_sendButton.click();
            ui.Logger.log("[#bgs" + random + "]", "volume-medium");
        });
        ui.customButtons_soundRouletteButton.setAttributes({
            title: "Play a random sound effect",
            style: {
                display: scriptSetting.sound_roulette ? "inline" : "none"
            }
        });

        ui.customButtons_musicRouletteButton = createButton("customButtons_musicRoulette", "BGM", "dice-multiple", e => {
            // Check if the send button is not on cooldown
            if (ui.leftFrame_sendButton.disabled || !ui.leftFrame_container.contains(ui.leftFrame_sendButton)) {
                return;
            }

            const random = Math.floor(Math.random() * scriptSetting.music_roulette_max);

            ui.leftFrame_textarea.value = "[#bgm" + random + "]";
            ui.leftFrame_textarea.dispatchEvent(new Event("input"));

            // Click Send button
            ui.leftFrame_sendButton.click();
            ui.Logger.log("[#bgm" + random + "]", "music-note");
        });
        ui.customButtons_musicRouletteButton.setAttributes({
            title: "Play a random Music",
            style: {
                display: scriptSetting.music_roulette ? "inline" : "none"
            }
        });

        ui.customButtons_rowButtons.append(ui.customButtons_evidRouletteButton,
                                           ui.customButtons_soundRouletteButton,
                                           ui.customButtons_musicRouletteButton);

        // Music buttons
        if (typeof unsafeWindow !== "undefined" && typeof unsafeWindow.Howler === "object") {
            ui.customButton_stopAllSounds = createButton("stop_all_sounds", "Shut up SFX and BGM", "volume-variant-off", e => {
                unsafeWindow.Howler.stop();
            });

            ui.customButton_stopAllSounds.firstChild.setAttributes({
                title: "Stop all currently playing sounds and music (just for me)",
                style: {
                    backgroundColor: "teal"
                }
            });

            ui.customButton_getCurMusicUrl = createButton("get_cur_music_url", "BGM URL", "link-variant", e => {
                for (const howl of unsafeWindow.Howler._howls) {
                    if (howl._state == "loaded" && howl._loop) {
                        if (!scriptSetting.show_console) {
                            alert(howl._src);
                        }
                        ui.Logger.log(howl._src, "link-variant");
                        break;
                    }
                };
            });

            ui.customButton_getCurMusicUrl.firstChild.setAttributes({
                title: "Get the URL for the currently playing Music",
                style: {
                    backgroundColor: "teal"
                }
            });

            ui.customButtons_rowButtons.append(ui.customButton_stopAllSounds,
                                               ui.customButton_getCurMusicUrl);

            ui.customButtons_rows.push(ui.customButtons_rowButtons);
        }

        // Log row
        ui.Logger = {
            entries: [],
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
                        item.append(icon);
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
                    item.append(document.createTextNode(entry.text));

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
            clear: function() {
                this.entries = [];
                while (this.elemItems.firstChild) {
                    this.elemItems.firstChild.remove()
                }
                this.elemContainer.style.display = "none";
            },
            init: function() {
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

                elemContainer.append(elemShowLogButton);

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

                elemContainer.append(elemItems);

                this.elemContainer = elemContainer;
                this.elemItems = elemItems;
                return elemContainer;
            }
        }

        ui.customButtons_rowLog = document.createElement("div");
        ui.customButtons_rowLog.setAttributes({
            className: "row mt-4 no-gutters",
            style: {
                display: "flex"
            }
        });
        ui.customButtons_rowLogLogger = ui.Logger.init();
        ui.customButtons_rowLog.append(ui.customButtons_rowLogLogger);

        ui.customButtons_rows.push(ui.customButtons_rowLog);

        // Attach each rows to the custom buttons container
        ui.customButtons_rows.forEach(row => {
            ui.customButtonsContainer.append(row);
        });
    }();

    // Adjust chatbox text size with mouse wheel
    var on_chatBoxTextWheel = function(e) {
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
    var onChatListMouseOver, onChatItemMouseLeave;
    const chatLogHoverTooltips = function() {
        let chatLog_lastItem;
        ui.chatLog_customTooltip = document.createElement("div");
        ui.chatLog_customTooltip.setAttributes({
            id: "customTooltip",
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
                maxHeight: "360px",
                overflow: "auto",
                background: "rgba(24, 24, 24, 0.95)",
                boxShadow: "2px 2px 6px #121212",
                border: "1px solid rgb(62, 67, 70)",
                borderRadius: "3px",
                wordBreak: "break-all",
                fontSize: "13px",
                lineHeight: "14px",
                color: "rgb(211, 207, 201)",
                transition: "opacity 0.15s ease-in-out 0.25s"
            }
        });

        ui.chatLog_chat.append(ui.chatLog_customTooltip);

        ui.chatLog_customTooltip.reposition = function(node) {
            let top = 0;
            top = node.parentNode.offsetTop;
            if (top + this.offsetHeight > Math.min(ui.chatLog_chatList.lastChild.offsetTop + ui.chatLog_chatList.lastChild.offsetHeight, Math.max(ui.chatLog_chat.offsetHeight, ui.chatLog_chat.scrollHeight))) {
                top = Math.min(ui.chatLog_chatList.lastChild.offsetTop + ui.chatLog_chatList.lastChild.offsetHeight, Math.max(ui.chatLog_chat.offsetHeight, ui.chatLog_chat.scrollHeight)) - this.offsetHeight;
            }
            if (top < 0) {
                top = Math.max(0, ui.chatLog_chatList.firstChild.offsetTop);
            }
            this.style.top = top + "px"
        }

        onChatListMouseOver = function(e) {
            // Find the item element
            const chatItem = e.target.closest("div.v-list-item__content");
            let chatName, chatText;

            if (chatItem === null || chatLog_lastItem == chatItem) {
                return;
            }
            chatLog_lastItem = chatItem;

            const chatItemPopulate = function() {
                // Make sure the chat element is not a system message
                const chatItemIcon = chatItem.previousSibling.firstChild.firstChild;
                if (!chatItemIcon.classList.contains("mdi-account-tie") &&
                    !chatItemIcon.classList.contains("mdi-crown") &&
                    !chatItemIcon.classList.contains("mdi-account")) {
                    return;
                }

                chatName = chatItem.querySelector("div.v-list-item__title").textContent;
                chatText = chatItem.querySelector("div.v-list-item__subtitle.chat-text").textContent;

                ui.chatLog_customTooltip.innerHTML = chatName + ":&nbsp;";

                const matchedElements = [];

                const urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                const urlMatches = chatText.match(urlRegex);
                if (urlMatches) {
                    urlMatches.forEach(f => {
                        const a = document.createElement("a");
                        a.setAttributes({
                            href: f,
                            textContent: f,
                            target: "_blank",
                            rel: "noreferrer",
                            style: {display: "inline-block", fontSize: "14px"}
                        });
                        const i = document.createElement("i");
                        i.setAttributes({
                            className: "mdi mdi-open-in-new",
                            style: {marginLeft: "2px", fontSize: "12px"}
                        });
                        a.append(i);
                        matchedElements.push(a);
                    });
                }

                const imgRegex = /(https?:\/\/\S+(?:png|jpe?g|gif|webp)\S*)/ig;
                const imgMatches = chatText.match(imgRegex);
                if (imgMatches) {
                    imgMatches.forEach(f => {
                        const img = document.createElement("img");
                        img.setAttributes({
                            src: f,
                            alt: f,
                            referrerPolicy: "no-referrer",
                            style: {maxWidth: "280px", maxHeight: "300px", display: "none"}
                        });


                        img.addEventListener("load", e => {
                            img.style.display = "inline";
                            ui.chatLog_customTooltip.reposition(chatItem); // Move the custom tooltip to fit the loaded image
                        });

                        img.addEventListener("error", e => {
                            img.style.display = "none";
                            ui.chatLog_customTooltip.reposition(chatItem); // Move the custom tooltip to fit the loaded image
                        });

                        const a = document.createElement("a");
                        a.setAttributes({
                            href: f,
                            target: "_blank",
                            rel: "noreferrer",
                            style: {display: "inline-block"}
                        });
                        a.append(img);
                        matchedElements.push(a);
                    });
                }

                const videoRegex = /(https?:\/\/\S+(?:webm|mp4)\S*)/ig;
                const videoMatches = chatText.match(videoRegex);
                if (videoMatches) {
                    videoMatches.forEach(f => {
                        const video = document.createElement("video");
                        video.setAttributes({
                            src: f,
                            loop: "true",
                            controls: "true",
                            style: {maxWidth: "280px", maxHeight: "300px"}
                        });

                        // Move the custom tooltip to fit the loaded video
                        video.addEventListener("loadeddata", e => {
                            ui.chatLog_customTooltip.reposition(chatItem);
                        });

                        video.addEventListener("error", e => {
                            video.style.display = "none";
                            ui.chatLog_customTooltip.reposition(chatItem);
                        });

                        matchedElements.push(video);
                    });
                }

                const youtubeRegex = /https?:\/\/(?:www\.)?youtu(?:\.be\/|be\.com\/watch\?v=)([\w_-]+)\S*/g;
                const youtubeMatches = chatText.matchAll(youtubeRegex);
                if (youtubeMatches) {
                    for (const match of youtubeMatches) {
                        const youtubeEmbed = document.createElement("iframe");
                        youtubeEmbed.setAttributes({
                            src: "https://www.youtube.com/embed/" + match[1] + "?enablejsapi=1",
                            loop: "true",
                            width: "320",
                            height: "180",
                            frameborder: "0",
                            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                            allowfullscreen: "true",
                            style: {maxWidth: "320px", maxHeight: "180px"}
                        });

                        // Move the custom tooltip to fit the loaded video
                        youtubeEmbed.addEventListener("loadeddata", e => {
                            ui.chatLog_customTooltip.reposition(chatItem);
                        });

                        youtubeEmbed.addEventListener("error", e => {
                            youtubeEmbed.style.display = "none";
                            ui.chatLog_customTooltip.reposition(chatItem);
                        });

                        matchedElements.push(youtubeEmbed);
                    }
                }

                const audioRegex = /(https?:\/\/\S+(?:mp3|ogg|m4a)\S*)/ig;
                const audioMatches = chatText.match(audioRegex);
                if (audioMatches) {
                    audioMatches.forEach(f => {
                        const audio = document.createElement("audio");
                        audio.setAttributes({
                            src: f,
                            controls: "true",
                            style: {maxWidth: "280px", maxHeight: "300px", height: "30px"}
                        });

                        // Move the custom tooltip to fit the loaded video
                        audio.addEventListener("loadedmetadata", e => {
                            audio.style.width = "100%";
                            ui.chatLog_customTooltip.reposition(chatItem);
                        });

                        audio.addEventListener("error", e => {
                            audio.style.display = "none";
                            ui.chatLog_customTooltip.reposition(chatItem);
                        });

                        matchedElements.push(audio);
                    });
                }

                if (matchedElements.length == 0) {
                    ui.chatLog_customTooltip.setAttributes({
                        style: {
                            visibility: "hidden",
                            opacity: "0"
                        }
                    });
                } else {
                    matchedElements.forEach(f => {ui.chatLog_customTooltip.append(f)});
                    ui.chatLog_customTooltip.reposition(chatItem);
                    ui.chatLog_customTooltip.setAttributes({
                        style: {
                            visibility: "visible",
                            opacity: "1"
                        }
                    });

                    ui.chatLog_customTooltip.addEventListener("mouseenter", e => {e.target.style.opacity = "1";});
                    ui.chatLog_customTooltip.addEventListener("mouseleave", onChatItemMouseLeave, {capture:false});
                    chatItem.addEventListener("mouseleave", onChatItemMouseLeave, {capture:false});
                }
            }();
        }

        onChatItemMouseLeave = function(e) {
            if (ui.chatLog_customTooltip.contains(e.toElement)) {
                return;
            }
            chatLog_lastItem = null;

            ui.chatLog_customTooltip.addEventListener("transitionend", e => {
                if (e.target.style.opacity == 0) {
                    e.target.style.visibility = "hidden";
                }
            });
            ui.chatLog_customTooltip.style.opacity = "0";
            ui.chatLog_customTooltip.querySelectorAll("audio, video").forEach(f => {f.pause();});
            ui.chatLog_customTooltip.querySelectorAll("iframe[src^=\"https://www.youtube.com/embed/\"]").forEach(f => {f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');});

            e.target.removeEventListener("mouseleave", onChatItemMouseLeave, {capture:false});
        }

        if (scriptSetting.chat_hover_tooltip) {
            ui.chatLog_chat.addEventListener("mouseover", onChatListMouseOver, false);
        }
    }();

    // Restore right click functionality to courtroom container
    ui.courtroom_container.addEventListener("contextmenu", e => {
        e.stopImmediatePropagation();
    }, true);

    // Disable WASD shortcuts
    var disableKeyboardShortcuts = function(e) {
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
