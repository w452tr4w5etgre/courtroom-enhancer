// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://github.com/w452tr4w5etgre/
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.850
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
// @run-at       document-idle
// ==/UserScript==

(function () {

    'use strict';

    const _CE_ = {};

    _CE_.options = {
        "warn_on_exit": getSetting("warn_on_exit", true),
        "remember_username": getSetting("remember_username", true),
        "chat_hover_tooltip": getSetting("chat_hover_tooltip", true),
        "disable_keyboard_shortcuts": getSetting("disable_keyboard_shortcuts", true),
        "show_roulettes": getSetting("show_roulettes", true),
        "global_audio_control_buttons": getSetting("global_audio_control_buttons", false),
        "mute_bgm_button": getSetting("mute_bgm_button", false),
        "roulette_max_evidence": Math.max(getSetting("roulette_max_evidence", 0), 632000),
        "roulette_max_music": Math.max(getSetting("roulette_max_music", 0), 196500),
        "roulette_max_sound": Math.max(getSetting("roulette_max_sound", 0), 62100),
        "file_host": getSetting("file_host", "catboxmoe"),
        "textbox_style": getSetting("textbox_style", "none"),
        "custom_styles": getSetting("custom_styles"),
        "chatlog_highlights": getSetting("chatlog_highlights", false),
        "chatlog_highlights_playsound": getSetting("chatlog_highlights_playsound", false),
        "chatlog_highlights_sound_url": getSetting("chatlog_highlights_sound_url", "default"),
        "chatlog_highlights_sound_volume": getSetting("chatlog_highlights_sound_volume", 0.5),
        "chatlog_highlights_wordlist": getSetting("chatlog_highlights_wordlist", ["$me", "example", "change this"]),
        "evidence_compact": getSetting("evidence_compact", false)
    };

    const URL_REGEX = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9]{1,8}(?:\:\d{1,5})?\b(?:\/\S*)*)/gi;

    const ui = {};

    (new MutationObserver(checkVueLoaded)).observe(document.body, { childList: true, subtree: true });

    function checkVueLoaded(changes, observer) {
        if (document.body.contains(ui.app) !== true || !ui.app.__vue__) {
            ui.app = document.querySelector("body > div#app[data-app]");
            return;
        }
        if (!ui.main) ui.main = ui.app.__vue__.$children.find(child => { return child.$vnode.componentOptions.tag === "v-main"; });
        if (!ui.main || !ui.main.$children) return;
        ui.main = ui.main.$children[0].$el;
        if (!ui.main) return;
        observer.disconnect();
        onVueLoaded();
    }

    function onVueLoaded() {
        _CE_.$vue = ui.main.__vue__;
        _CE_.$snotify = _CE_.$vue.$snotify;
        _CE_.$store = _CE_.$vue.$store;

        _CE_.$vue.sockets.subscribe("join_success", () => { setTimeout(onCourtroomJoin, 0); });

        // When the Join Courtroom dialog is shown
        if (_CE_.options.remember_username) {
            _CE_.$store.state.courtroom.user.username = storeGet("courtroom_username");
        }
        if (storeGet("courtroom_last_room_password")) {
            _CE_.$store.state.courtroom.room.password = storeGet("courtroom_last_room_password");
        }
    }

    function onCourtroomJoin() {
        ui.CourtLeftPanel = _CE_.$vue.$children.find(child => { return child.$vnode.componentOptions.tag === "CourtLeftPanel"; });
        ui.courtTextEditor = ui.CourtLeftPanel.$children.find(child => { return child.$vnode.componentOptions.tag === "courtTextEditor"; });
        ui.courtPlayer = ui.CourtLeftPanel.$children.find(child => { return child.$vnode.componentOptions.tag === "courtPlayer"; });

        _CE_.musicPlayer = ui.courtPlayer.$refs.player.musicPlayer;

        ui.courtroom_container = ui.courtPlayer.$refs.player.$refs.sceneDiv;

        ui.CourtRightPanel = _CE_.$vue.$children.find(child => { return child.$vnode.componentOptions.tag === "CourtRightPanel"; });

        ui.rightFrame_tabs = ui.CourtRightPanel.$children[0].$children.find(child => { return child.$vnode.componentOptions.tag === "v-tabs-items"; });
        ui.courtChatLog = ui.rightFrame_tabs.$children[0].$children.find(child => { return child.$vnode.componentOptions.tag === "courtChatLog"; });
        ui.courtEvidence = ui.rightFrame_tabs.$children[1].$children.find(child => { return child.$vnode.componentOptions.tag === "courtEvidence"; });
        ui.courtBackground = ui.rightFrame_tabs.$children[2].$children.find(child => { return child.$vnode.componentOptions.tag === "courtBackground"; });
        ui.courtSettings = ui.rightFrame_tabs.$children[3].$children.find(child => { return child.$vnode.componentOptions.tag === "courtSettings"; });
        ui.courtAdmin = ui.rightFrame_tabs.$children[4].$children.find(child => { return child.$vnode.componentOptions.tag === "courtAdmin"; });

        ui.chatLog_chatList = ui.courtChatLog.$children.find(child => { return child.$vnode.componentOptions.tag === "v-list"; }).$el;

        ui.evidence_list = ui.courtEvidence.$el.querySelector("div > div.row:last-of-type");

        ui.divider = ui.courtSettings.$children.find(child => { return child.$vnode.componentOptions.tag === "v-divider"; }).$el;

        ui.settings_keyboardShortcutsHeader = ui.courtSettings.$el.querySelector("div > h3:first-of-type");
        ui.settings_keyboardShortcutsWS = ui.settings_keyboardShortcutsHeader.nextSibling.nextSibling.nextSibling;
        ui.settings_keyboardShortcutsAD = ui.settings_keyboardShortcutsWS.nextSibling;
        ui.settings_keyboardShortcutsT = ui.settings_keyboardShortcutsAD.nextSibling.nextSibling;

        ui.presentDialog = _CE_.$vue.$children.find(child => { return child.$vnode.componentOptions.tag === "PresentDialog"; });

        window.addEventListener("beforeunload", on_beforeUnload, false);

        var windowResizerTimeout;
        window.addEventListener("resize", (ev) => {
            clearTimeout(windowResizerTimeout);
            windowResizerTimeout = setTimeout(on_windowResize, 250);
        });

        // Remember username
        storeSet("courtroom_username", _CE_.$store.state.courtroom.user.username);
        if (_CE_.$store.state.courtroom.room.passwordRequired === true) {
            storeSet("courtroom_last_room_password", _CE_.$store.state.courtroom.room.password);
        }

        // Remember last used character/pose and text color
        let last_poseId = storeGet("last_poseId");
        let last_characterId = storeGet("last_characterId");
        let courtroom_chat_color = storeGet("courtroom_chat_color");

        // Check if the stored character and pose are loaded in the custom list
        if (!last_characterId && _CE_.$store.state.assets.character.list.some(char => char.poses.some(pose => pose.id === last_poseId))) {
            _CE_.$store.state.courtroom.frame.poseId = last_poseId;
        } else if (_CE_.$store.state.assets.character.customList.some(char => char.id === last_characterId && char.poses.some(pose => pose.id === last_poseId))) {
            _CE_.$store.state.courtroom.frame.poseId = last_poseId;
            _CE_.$store.state.courtroom.frame.characterId = last_characterId;
        }

        // Check if the stored color is valid
        if (courtroom_chat_color && /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(courtroom_chat_color)) {
            _CE_.$store.state.courtroom.color = storeGet("courtroom_chat_color");
        }

        // Set up watchers
        _CE_.$vue.$socket.addEventListener("disconnect", socketError => {
            const errorWatcher = _CE_.$vue.$watch("$store.state.courtroom.error.title", errorText => {
                if (errorText !== "Disconnected") return;
                _CE_.$vue.$store.state.courtroom.error.text += "\nReason: " + socketError;
                errorWatcher(); //Unwatch 
            }, { once: true });
        }, { once: true });

        _CE_.$vue.$watch("$store.state.courtroom.frame.poseId", poseId => {
            storeSet("last_poseId", poseId);
        });
        _CE_.$vue.$watch("$store.state.courtroom.frame.characterId", characterId => {
            storeSet("last_characterId", characterId);
        });
        _CE_.$vue.$watch("$store.state.courtroom.color", color => {
            storeSet("courtroom_chat_color", color);
        });
        _CE_.$vue.$watch("$store.state.courtroom.user.username", name => {
            if (!name || !_CE_.options.remember_username) return;
            storeSet("courtroom_username", String(name));
            _CE_.notificationWords = _CE_.options.chatlog_highlights_wordlist.map(word => word.replace("$me", escapeRegExp(_CE_.$store.state.courtroom.user.username)));
            _CE_.notificationRegex = new RegExp(`\\b(?:${_CE_.notificationWords.join("|")})\\b`, "gmi");
        });

        // Watch My Assets dialog
        _CE_.$vue.$watch("$store.state.assetsDialog", (newValue, oldValue) => {
            if (newValue !== true) return;
            const assetsManager = ui.app.__vue__.$children.find(child => { return child.$vnode.componentOptions.tag === "assetsManager"; });
            const assetsManager__dialog = assetsManager.$children.find(child => { return child.$vnode.componentOptions.tag === "v-dialog"; });
            const assetsManager__tabs = assetsManager__dialog.$refs.dialog.querySelector("div.v-tabs-items").__vue__.$children;

            const assetsManager__background = assetsManager__tabs[0];
            if (assetsManager__background.hasContent === true) {
                assetsManager__background.$el.querySelector("div.v-card__actions").prepend(
                    new _CE_.Uploader.filePicker(uploaderResponse => {
                        assetsManager__background.$children[0].name = uploaderResponse.filename;
                        assetsManager__background.$children[0].url = uploaderResponse.url;
                    }, { label: "BG", icon: "image", acceptedhtml: "image/*", acceptedregex: "^image/", maxsize: 4e6, pastetargets: assetsManager__background.$el.querySelectorAll("div.v-text-field__slot > input[type=text]") })
                );
            }

            const assetsManager__music = assetsManager__tabs[3];
            assetsManager__music.$watch("hasContent", hasContent => {
                if (hasContent !== true) return;
                assetsManager__music.$el.querySelector("div.v-card__actions").prepend(
                    new _CE_.Uploader.filePicker(uploaderResponse => {
                        assetsManager__music.$children[0].name = uploaderResponse.filename;
                        assetsManager__music.$children[0].url = uploaderResponse.url;
                    }, { label: "music", icon: "file-music", acceptedhtml: "audio/*", acceptedregex: "^audio/", maxsize: 50e6, pastetargets: assetsManager__music.$el.querySelectorAll("input[type=text]") })
                );
            });

            const assetsManager__sounds = assetsManager__tabs[4];
            assetsManager__sounds.$watch("hasContent", hasContent => {
                if (hasContent !== true) return;
                assetsManager__sounds.$el.querySelector("div.v-card__actions").prepend(
                    new _CE_.Uploader.filePicker(uploaderResponse => {
                        assetsManager__sounds.$children[0].name = uploaderResponse.filename;
                        assetsManager__sounds.$children[0].url = uploaderResponse.url;
                    }, { label: "sound", icon: "file-music", acceptedhtml: "audio/*", acceptedregex: "^audio/", maxsize: 4e6, pastetargets: assetsManager__sounds.$el.querySelectorAll("input[type=text]") })
                );
            });

        }, { flush: "post" });

        // Watch Manage Character dialog
        _CE_.$vue.$watch("$store.state.manageCharacterDialog", (newValue, oldValue) => {
            if (newValue !== true) return;
            const manageCharacterDialog = ui.app.__vue__.$children.find(child => { return child.$vnode.componentOptions.tag === "manageCharacterDialog"; });
            const manageCharacterDialog__dialog = manageCharacterDialog.$children.find(child => { return child.$vnode.componentOptions.tag === "v-dialog"; }).$refs.dialog;

            var characterHelperURL = document.createElement("input");
            characterHelperURL.setAttributes({
                type: "text",
                maxLength: "255",
                title: "URL",
                readonly: true,
                style: {
                    backgroundColor: "white",
                    color: "black",
                    height: "1vw",
                    fontSize: "8px",
                    border: "1px solid black",
                    minWidth: "140px",
                    maxWidth: "100%",
                    display: "none",
                    flexBasis: "100"
                }
            });
            characterHelperURL.addEventListener("click", ev => { ev.target.select(); });

            var characterHelper_Uploader = new _CE_.Uploader.filePicker(res => {
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
            manageCharacterDialog__dialog.querySelector("div.spacer").after(characterHelper, spacer);
        }, { flush: "post" });

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

            if (options.width) button.style.width = options.width;

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
        };

        // Add evidence sources

        _CE_.Uploader = {
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
                            data: _CE_.Uploader.parseForm({ reqtype: "fileupload", fileToUpload: data })
                        };
                    },
                    formatDataUrl(data) {
                        return {
                            headers: {},
                            data: _CE_.Uploader.parseForm({ reqtype: "urlupload", url: data })
                        };
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
                            data: _CE_.Uploader.parseForm({ "files[]": data })
                        };
                    },
                    formatDataUrl(data) {
                        return {
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            data: _CE_.Uploader.parseParams({ "urls[]": data })
                        };
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
                }],
                ["h4g", {
                    method: "POST",
                    formatDataFile(data) {
                        return {
                            headers: {},
                            data: _CE_.Uploader.parseForm({ file: data })
                        };
                    },
                    formatDataUrl(data) {
                        return {
                            headers: {},
                            data: _CE_.Uploader.parseForm({ url: data })
                        };
                    },
                    urlFromResponse(response) {
                        return response.toString();
                    }
                }]
            ]),
            fileHosts: new Map([
                ["catboxmoe", {
                    name: "catbox.moe",
                    url: "https://catbox.moe/user/api.php",
                    api: "catbox",
                    maxsize: 200e6,
                    supported: new Map([["audio", true], ["urls", true], ["m4a", true]])
                }],
                ["uguuse", {
                    name: "uguu.se",
                    url: "https://uguu.se/upload.php",
                    api: "lolisafe",
                    maxsize: 128e6,
                    supported: new Map([["audio", true], ["urls", false], ["m4a", true]])
                }],
                ["pomflainla", {
                    name: "pomf.lain.la",
                    url: "https://pomf.lain.la/upload.php",
                    api: "lolisafe",
                    maxsize: 512e6,
                    supported: new Map([["audio", true], ["urls", false], ["m4a", true]])
                }],
                ["imoutokawaii", {
                    name: "imouto.kawaii.su (30d expire)",
                    url: "https://imouto.kawaii.su/api/upload",
                    api: "lolisafe",
                    maxsize: 20e6,
                    supported: new Map([["audio", false], ["urls", false], ["m4a", false]])
                }],
                ["takemetospace", {
                    name: "take-me-to.space",
                    url: "https://take-me-to.space/api/upload",
                    api: "lolisafe",
                    maxsize: 50e6,
                    supported: new Map([["audio", true], ["urls", false], ["m4a", false]])
                }],
                ["cockfile", {
                    name: "cockfile (24h expire)",
                    url: "https://cockfile.com/upload.php",
                    api: "lolisafe",
                    maxsize: 128e6,
                    supported: new Map([["audio", true], ["urls", false], ["m4a", false]])
                }],
                ["h4g", {
                    name: "h4g (30d expire)",
                    url: "https://files.h4g.co/api.php?d=upload-tool",
                    api: "h4g",
                    maxsize: 100e6,
                    supported: new Map([["audio", true], ["urls", false], ["m4a", false]])
                }]
            ]),

            upload: function (file, callbackSuccess, callbackError, callbackProgress) {
                const hostFallback = new Map([["base", "catboxmoe"], ["audio", "catboxmoe"], ["urls", "catboxmoe"], ["m4a", "uguuse"]]);
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

                if (file.size > this.fileHosts.get(fileHost).maxsize) {
                    fileHost = hostFallback.get("base");
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
                            } catch (err) {
                                callbackError(err.toString());
                            }
                        } else {
                            callbackError("Error " + response.status + ": " + response.responseText);
                        }
                    },
                    onabort: response => {
                        callbackError("Aborted: " + response.responseText);
                    },
                    onerror: response => {
                        callbackError("Error: " + response.responseText);
                    },
                    ontimeout: response => {
                        callbackError("Timeout: " + response.responseText);
                    },
                    upload: {
                        onprogress: response => {
                            if (callbackProgress !== undefined && response.lengthComputable === true) {
                                callbackProgress(response.loaded, response.total);
                            }
                        }
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
                    _CE_.$snotify.error(errorText, "File Uploader");
                };

                const uploadCallbackSuccess = function () {
                    resetElem();
                    callback.apply(this, arguments);
                };

                const uploadCallbackProgress = function (current, total) {
                    elemContainer.setAttributes({
                        lastChild: { textContent: String(Math.round(current / total * 100)) + " %" }
                    });
                }

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

                elemContainer.addEventListener("click", () => {
                    elemFile.click();
                });

                const uploaderElementEvent = function (ev) {
                    try {
                        var dataList, file;
                        if (ev instanceof Event && ev.type === "change" && ev.target.files instanceof FileList && ev.target.files.length > 0) {
                            dataList = ev.target.files;
                        } else if (ev instanceof DragEvent && ev.type === "drop" && ev.dataTransfer instanceof DataTransfer) {
                            if (ev.dataTransfer.files instanceof FileList && ev.dataTransfer.files.length > 0) { // File dropped
                                dataList = ev.dataTransfer.files;
                            } else if (ev.dataTransfer.items instanceof DataTransferItemList && ev.dataTransfer.items.length > 0) { // URL dropped
                                dataList = ev.dataTransfer.items;
                            }
                        } else if (ev instanceof ClipboardEvent && ev.type === "paste") {
                            if (ev.clipboardData instanceof DataTransfer && ev.clipboardData.files instanceof FileList && ev.clipboardData.files.length > 0) { // File pasted
                                dataList = ev.clipboardData.files;
                            }
                        }

                        if (!dataList) return;

                        ev.preventDefault();

                        if (dataList instanceof FileList) {
                            for (const data of dataList) {
                                if (!data.type.match(this.acceptedregex)) {
                                    throw new Error("Invalid file type.");
                                }
                                if (data.size >= this.maxsize) {
                                    throw new Error("File too big. Max size: " + this.maxsize / 1e6 + "MB");
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
                                    throw new Error("Invalid data kind.");
                                }
                            }
                        } else {
                            throw new Error("Invalid dataList.");
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
                            _CE_.Uploader.upload(file, uploadCallbackSuccess, uploadError, uploadCallbackProgress);
                        } else if (file instanceof DataTransferItem && file.kind == "string") {
                            file.getAsString(url => {
                                _CE_.Uploader.upload(url, uploadCallbackSuccess.bind(this), uploadError.bind(this), uploadCallbackProgress.bind(this));
                            });
                        } else {
                            throw new Error("Invalid file.");
                        }
                    } catch (err) {
                        uploadError(err.toString());
                    }
                };

                // Reset the value of the file input to allow the change event to be fired even when selecting the same file more than once
                elemFile.addEventListener("click", ev => { ev.target.value = ""; });

                elemFile.addEventListener("change", uploaderElementEvent.bind(this));
                elemContainer.addEventListener("drop", uploaderElementEvent.bind(this));

                elemContainer.addEventListener("dragover", ev => {
                    ev.preventDefault();
                    ev.currentTarget.style.borderColor = "red";
                });

                elemContainer.addEventListener("dragleave", ev => {
                    ev.preventDefault();
                    ev.currentTarget.style.borderColor = "teal";
                });

                if (options.pastetargets) {
                    if (options.pastetargets instanceof Node) {
                        options.pastetargets.addEventListener("paste", element => { uploaderElementEvent.bind(this, element); });
                    } else if (options.pastetargets instanceof NodeList) {
                        options.pastetargets.forEach(node => { node.addEventListener("paste", element => { uploaderElementEvent.call(this, element); }); });
                    }
                }

                return elemContainer;
            }
        };

        // Evidence tab enhancements
        ui.enhanceEvidenceForm = function () {
            ui.evidence_form = ui.courtEvidence.$children.find(child => { return child.$vnode.componentOptions.tag === "v-form"; });
            ui.evidence_formDivs = ui.evidence_form.$el.firstChild;
            ui.evidence_formFields = ui.evidence_formDivs.querySelectorAll("input");
            ui.evidence_formFieldDescription = ui.evidence_formDivs.querySelector("textarea");

            ui.evidence_formBottomRow = ui.evidence_form.$el.querySelector("form > div:nth-child(2)");
            ui.evidence_formBottomRow_buttonsColumn = ui.evidence_formBottomRow.firstChild;

            // Pressing the Enter key on the form fields adds the evidence
            ui.evidence_formFields.forEach(formField => {
                formField.addEventListener("keydown", ev => {
                    if (ev.key == "Enter") {
                        ev.target.blur();
                        ui.courtEvidence.addEvidence();
                    }
                });
            });

            // Override the validation function to allow anonymous evidence
            ui.courtEvidence.$refs.form.validate = () => {
                if (!ui.courtEvidence.url && ui.courtEvidence.iconUrl) ui.courtEvidence.url = ui.courtEvidence.iconUrl;
                if (!ui.courtEvidence.iconUrl && ui.courtEvidence.url) ui.courtEvidence.iconUrl = ui.courtEvidence.url;
                if (!ui.courtEvidence.name) ui.courtEvidence.name = " ";
                ui.courtEvidence.valid = true;
                return true;
            };

            // Fix evidence form layout

            // Name
            ui.courtEvidence.$refs.form.$children[0].$el.parentNode.classList.remove("mb-sm-2", "col-12", "col-sm-6", "pr-sm-1", "mb-2");
            ui.courtEvidence.$refs.form.$children[0].$el.parentNode.classList.add("col-4", "pr-1");
            // Icon URL
            ui.courtEvidence.$refs.form.$children[1].$el.parentNode.classList.remove("mb-sm-2", "col-12", "col-sm-6", "pl-sm-1", "mb-2");
            ui.courtEvidence.$refs.form.$children[1].$el.parentNode.classList.add("col-4", "pl-1", "pr-1");
            // Check URL
            ui.courtEvidence.$refs.form.$children[2].$el.parentNode.classList.remove("mb-sm-2", "col-12", "col-sm-6", "mb-2");
            ui.courtEvidence.$refs.form.$children[2].$el.parentNode.classList.add("col-4", "pl-1");
            // Description
            ui.courtEvidence.$refs.form.$children[3].$el.parentNode.previousSibling.classList.add("d-none"); // Hide invisible element
            ui.courtEvidence.$refs.form.$children[3].$el.parentNode.classList.remove("col-12", "col-sm-6", "my-3");
            ui.courtEvidence.$refs.form.$children[3].$el.parentNode.classList.add("col-6", "pr-1");
            ui.courtEvidence.$refs.form.$children[3].$refs.input.style.height = "50px";
            ui.courtEvidence.$refs.form.$children[3].$refs.input.style.lineHeight = "normal";
            // Type
            ui.courtEvidence.$refs.form.$children[4].$el.parentNode.classList.remove("col-12");
            ui.courtEvidence.$refs.form.$children[4].$el.parentNode.classList.add("col-6", "pl-1");

            // Add evidence uploaders
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

                    const evidenceImageUploader = new _CE_.Uploader.filePicker(res => {
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

                    gelbooruIcon.addEventListener("click", () => {
                        var state = gelbooruTagsContainer.classList.toggle("d-flex");
                        gelbooruTagsContainer.classList.toggle("d-none");
                        evidenceImageUploader.classList.toggle("d-flex");
                        evidenceImageUploader.classList.toggle("d-none");
                        if (state) {
                            gelbooruInputTags.focus();
                        }
                    });

                    gelbooruInputTags.addEventListener("keydown", ev => {
                        if (ev.target.value && ev.key === "Enter") {
                            gelbooruBtnSend.click();
                        }
                    });

                    const gelbooruUploaderError = function (error = "Error") {
                        const errorText = (error instanceof Error || typeof error === "string") ? error.toString() : (error.responseText || "Error");
                        gelbooruInputTags.value = errorText;
                        gelbooruInputTags.style.color = "white";
                        gelbooruInputTags.disabled = false;
                        gelbooruInputTags.addEventListener("focus", ev => {
                            ev.target.value = "";
                        }, { once: true });
                        _CE_.$snotify.error(errorText, "Gelbooru");
                    };

                    gelbooruBtnSend.addEventListener("click", () => {
                        var tags = gelbooruInputTags.value;
                        if (!tags || tags.length === 0) { gelbooruInputTags.focus(); return; }
                        gelbooruInputTags.value = "Uploading...";
                        gelbooruInputTags.style.color = "grey";
                        gelbooruInputTags.disabled = true;
                        CrossOrigin({
                            url: "https://gelbooru.com/index.php?page=dapi&json=1&s=post&q=index&limit=1&tags=" + encodeURIComponent(tags + " -video -huge_filesize -absurdres -incredibly_absurdres sort:random"),
                            method: "GET",
                            headers: {
                                "Accept": "application/json"
                            },
                            onload: getterResponse => {
                                try {
                                    if (getterResponse.readyState == 4 && getterResponse.status == 200) {
                                        var responseJSON = JSON.parse(getterResponse.responseText);
                                        if (!responseJSON.post) {
                                            throw new Error("No results");
                                        }
                                        _CE_.Uploader.upload(responseJSON.post[0].file_url, uploaderResponse => {
                                            try {
                                                ui.courtEvidence.name = responseJSON.post[0].id;
                                                ui.courtEvidence.iconUrl = uploaderResponse.url;
                                                ui.courtEvidence.url = uploaderResponse.url;
                                                gelbooruInputTags.value = "";
                                                gelbooruInputTags.style.color = "white";
                                                gelbooruInputTags.disabled = false;
                                                gelbooruIcon.click();
                                                setTimeout(ui.courtEvidence.addEvidence, 100);
                                            } catch (err) {
                                                throw (err);
                                            }
                                        }, gelbooruUploaderError, (current, total) => {
                                            gelbooruInputTags.value = "Uploading... " + Math.round(current / total * 100) + " %";
                                        });
                                    }
                                } catch (err) {
                                    gelbooruUploaderError(err);
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

            ui.evidence_formBottomRow.classList.remove("pb-1", "mt-4");
            ui.evidence_formBottomRow.classList.add("pb-2", "mt-0");
            ui.evidence_formBottomRow_buttonsColumn.classList.remove("col");

            // Add buttons to adjust evidence list sizes
            ui.evidence_scaleContainer = document.createElement("div");

            ui.evidence_scaleButtonLarge = document.createElement("button");
            ui.evidence_scaleButtonLarge.setAttributes({
                type: "button",
                className: "v-btn v-size--default v-btn--round v-btn--icon theme--dark",
                title: "Make the evidence list more compact"
            });
            ui.evidence_scaleButtonLarge_icon = document.createElement("i");
            ui.evidence_scaleButtonLarge_icon.className = "v-btn__content v-icon mdi mdi-grid";
            ui.evidence_scaleButtonLarge.append(ui.evidence_scaleButtonLarge_icon);

            ui.evidence_scaleButtonSmall = document.createElement("button");
            ui.evidence_scaleButtonSmall.setAttributes({
                type: "button",
                className: "v-btn v-size--default v-btn--round v-btn--icon theme--dark",
                title: "Make the evidence list less compact"
            });
            ui.evidence_scaleButtonSmall_icon = document.createElement("i");
            ui.evidence_scaleButtonSmall_icon.className = "v-btn__content v-icon mdi mdi-grid-large";
            ui.evidence_scaleButtonSmall.append(ui.evidence_scaleButtonSmall_icon);

            ui.evidence_scaleButtonLarge.addEventListener("click", ev => {
                setSetting("evidence_compact", true);
                ui.evidence_list.querySelectorAll("div.v-image").forEach(img => { img.style.height = "100px" });
                ui.evidence_list.childNodes.forEach(el => {
                    el.classList.remove("col-lg-3"); el.classList.add("col-lg-2");
                    el.querySelector("div.v-card__title").style.fontSize = "small";
                    el.querySelector("div.v-card__subtitle").style.textIndent = "-66px";
                });
            });

            ui.evidence_scaleButtonSmall.addEventListener("click", ev => {
                setSetting("evidence_compact", false);
                ui.evidence_list.querySelectorAll("div.v-image").forEach(img => { img.style.height = "160px" });
                ui.evidence_list.childNodes.forEach(el => {
                    el.classList.remove("col-lg-2"); el.classList.add("col-lg-3");
                    el.querySelector("div.v-card__title").style.fontSize = "large";
                    el.querySelector("div.v-card__subtitle").style.textIndent = "";
                });
            });

            ui.evidence_scaleContainer.append(ui.evidence_scaleButtonLarge, ui.evidence_scaleButtonSmall);

            ui.evidence_form.$children.find(child => { return child.$vnode.componentOptions.tag === "v-divider"; }).$el.nextElementSibling.firstChild.insertAdjacentElement("afterend", ui.evidence_scaleContainer);
        };

        ui.enhanceEvidenceItems = function () {
            ui.evidence_list.style.maxHeight = "70vh";
            ui.evidence_list.style.scrollBehavior = "smooth";

            // Adjust evidence items
            ui.evidence_list.fixEvidenceItem = function (node) {
                node.classList.remove("col-lg-3", "col-md-6", "col-sm-4", "col-6");
                node.classList.add(_CE_.options.evidence_compact ? "col-lg-2" : "col-lg-3", "col-md-3", "col-sm-2");
                const divCard = node.firstChild;
                const divImage = divCard.__vue__.$children.find(child => { return child.$vnode.componentOptions.tag === "v-img"; });
                const divTitle = divCard.querySelector("div.v-card__title");
                const divSubtitle = divCard.querySelector("div.v-card__subtitle");
                const divActions = divCard.querySelector("div.v-card__actions");

                const buttonEye = divCard.__vue__.$children.find(child => { return child.$vnode.componentOptions.tag === "v-btn" && child.$el.firstChild.firstChild.classList.contains("mdi-eye"); }).$el;
                const buttonMention = divCard.__vue__.$children.find(child => { return child.$vnode.componentOptions.tag === "v-menu"; }).$children[0].$el;

                divCard.addEventListener("mouseenter", ev => {
                    const image = ev.target.querySelector("div.v-image__image");
                    image.classList.add("v-image__image--contain");
                    image.classList.remove("v-image__image--cover");

                    divActions.style.visibility = "visible";
                    divActions.style.opacity = "1";

                    if (_CE_.options.evidence_compact) divTitle.style.visibility = "hidden";
                });
                divCard.addEventListener("mouseleave", ev => {
                    const image = ev.target.querySelector("div.v-image__image");
                    image.classList.remove("v-image__image--contain");
                    image.classList.add("v-image__image--cover");

                    divActions.style.visibility = "hidden";
                    divActions.style.opacity = "0";
                    divActions.style.padding = "0";

                    divTitle.style.visibility = "visible";
                });

                divImage.$el.style.cursor = "pointer";
                divImage.$el.style.height = _CE_.options.evidence_compact ? "100px" : "160px";
                divImage.$el.addEventListener("click", ev => {
                    if (divActions.contains(ev.target)) {
                        return;
                    }

                    // Delay to fix switching from one image to another
                    setTimeout(() => {
                        buttonEye.click();
                        // Immediately show image
                        ui.presentDialog.checkImageUrl = divImage.src;
                    }, 0);

                }, true);

                divTitle.setAttributes({
                    style: {
                        textShadow: "2px 1px #000000",
                        padding: "4px",
                        lineHeight: "normal",
                        fontSize: _CE_.options.evidence_compact ? "small" : "large"
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

                if (_CE_.options.evidence_compact) divSubtitle.style.textIndent = "-66px";

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

                divActions.querySelectorAll("button.v-btn").forEach(btn => { btn.classList.add("mx-0", "px-0"); });

                // Add "link" button
                const buttonLink = document.createElement("button");
                buttonLink.type = "button";
                buttonLink.className = "v-btn v-btn--icon v-btn--round theme--dark v-size--default mx-0";

                const buttonLinkSpan = document.createElement("span");
                buttonLinkSpan.className = "v-btn__content";
                buttonLink.append(buttonLinkSpan);

                const buttonLinkSpanIcon = document.createElement("i");
                buttonLinkSpanIcon.className = "v-icon notranslate mdi mdi-link theme--dark";
                buttonLinkSpan.append(buttonLinkSpanIcon);

                buttonEye.insertAdjacentElement("afterend", buttonLink);

                buttonLink.addEventListener("click", ev => {
                    if (ev.target.disabled) return;
                    var imageUrl = divImage.src;
                    _CE_.bgmNotification = _CE_.$snotify.success(imageUrl, "Evidence Info " + imageUrl, {
                        html: `<div class="snotifyToast__body" style="word-break: break-all;"><h3>Evidence</h3><div><a style="color:#0f28e6" href="${imageUrl}" target="_blank" rel="noreferrer">${imageUrl}</a></div>`,
                        closeOnClick: false, buttons: [
                            { text: "Copy URL", action: () => { navigator.clipboard.writeText(imageUrl); } },
                            { text: "Open in new tab", action: () => { window.open(imageUrl, "_blank", "noreferrer"); } }
                        ]
                    });
                });

                // Hide eye button (clicking on the image itself clicks on the eye)
                buttonEye.style.display = "none";

                // Replace mention button text with an icon
                buttonMention.classList.add("v-btn--round", "v-btn--icon");
                buttonMention.classList.remove("v-btn--text");
                buttonMention.title = "Mention";
                buttonMention.querySelector("span").textContent = "";
                buttonMention.querySelector("span").classList.add("mdi", "mdi-text-box-plus");
            };

            if (ui.evidence_list.childElementCount) {
                for (const node of ui.evidence_list.childNodes) {
                    ui.evidence_list.fixEvidenceItem(node);
                }
            }

            (new MutationObserver(on_evidenceListChange)).observe(ui.evidence_list, { childList: true });
            function on_evidenceListChange(changes, observer) {
                for (const change of changes) {
                    for (const node of change.addedNodes) {
                        ui.evidence_list.fixEvidenceItem(node);
                    }
                }
            }

        };

        if (_CE_.$store.getters["courtroom/addEvidencePermission"]) {
            ui.enhanceEvidenceForm();
        }

        // Fix delete icon on being modded
        _CE_.$vue.$watch(() => _CE_.$vue.isMod || _CE_.$vue.isOwner, (newValue, oldValue) => {
            if (newValue === false) return;
            ui.evidence_list.querySelectorAll("i.mdi-delete").forEach(el => { el.parentNode.parentNode.classList.add("mx-0", "px-0"); });
        });

        // Watch for evidence permission or mod/owner status changes
        _CE_.$vue.$watch(() => _CE_.$store.state.courtroom.room.permissions.addEvidence == 0 || _CE_.$store.state.courtroom.room.permissions.addEvidence == 1 && (_CE_.$vue.isMod || _CE_.$vue.isOwner) || _CE_.$vue.isOwner,
            (newValue, oldValue) => {
                // Only run the enhancer function when permission changes OFF to ON
                if (!newValue || (newValue && oldValue)) return;
                ui.enhanceEvidenceForm();
            });

        ui.enhanceEvidenceItems();

        // CSS injector to change textbox style
        ui.StylePicker = {
            styleSheet: (function () { var style = document.createElement("style"); document.head.appendChild(style); return style; })(),
            customStyles: new Map([
                // ["persona4golden", {
                //     "name": "Persona 4 Golden",
                //     "optionColor": "#ff9c19",
                //     "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100% !important;width: 100% !important;letter-spacing: normal!important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://z.zz.fo/XOpfX.png\") !important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100%;top: 0 !important;left: 0 !important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif!important;font-size: 1.4em !important;color: #4c2816!important;top: 70.5% !important;left: 4.8%!important;text-align: left !important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif!important;top: 76.6%!important;left: 5%!important;width: 86%!important;height: 20%!important;padding: 6px 0 !important;}"
                // }],
                // ["finalfantasy7", {
                //     "name": "FF7",
                //     "optionColor": "#0a02de",
                //     "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100% !important;width: 100% !important;letter-spacing: normal!important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://z.zz.fo/ZAF9I.png\") !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100% !important;top: 0 !important;left: 0 !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: \"Determination Sans\", Verdana, sans-serif!important;color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;top: 0!important;left: 0!important;margin: 45.7% 11.5% !important;padding: 1px 0 !important;width: 21.7% !important;height: 6.5% !important;line-height: normal !important;-webkit-text-stroke: unset !important;text-stroke: unset !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: \"Determination Sans\", Verdana, sans-serif!important;color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;top: 76.2%!important;left: 12%!important;width: 77.5%!important;height: 14.5%!important;line-height: normal !important;margin: 2px 0 !important;}"
                // }],
                ["finalfantasy7alternative", {
                    "name": "FF7 Alternative",
                    "optionColor": "#0a02de",
                    "css": "div.courtroom > div:nth-of-type(5) > div > div.chat-box {position: absolute !important;top: unset !important;left: 0 !important;bottom: 0 !important;width: 86% !important;height: 26% !important;margin: 0 7% 1.5% 7% !important;border: solid 1px #424542;box-shadow: 1px 1px #e7dfe7, -1px -1px #e7dfe7, 1px -1px #e7dfe7, -1px 1px #e7dfe7, 0 -2px #9c9a9c, -2px 0 #7b757b, 0 2px #424542;background: #04009dcc;background: -moz-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #04009dcc), color-stop(100%, #050039cc));background: -webkit-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: -o-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: -ms-linear-gradient(top, #04009dcc 0%, #050039cc 100%);background: linear-gradient(to bottom, #04009dcc 0%, #050039cc 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#04009dcc', endColorstr='#050039cc', GradientType=0);-webkit-border-radius: 7px;-moz-border-radius: 7px;border-radius: 7px;}div.courtroom > div:nth-of-type(5) > div > div.chat-box > img.name-plate-img {display: none !important;}div.courtroom > div:nth-of-type(5) > div > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div > div.name-plate {position: absolute !important;top: unset !important;left: 0 !important;bottom: 0 !important;width: 86% !important;height: 7% !important;padding: 0 !important;margin: 0 7% 14% 7% !important;background: unset !important;border: unset !important;}div.courtroom > div:nth-of-type(5) > div > div.name-plate > div.name-plate-text {top: 0 !important;left: 0 !important;width: 100% !important;padding: 0 3% !important;}div.courtroom > div:nth-of-type(5) > div > div.name-plate > div.name-plate-text, div.courtroom > div:nth-of-type(5) > div > div.name-plate > div.name-plate-text span {text-align: left;font-size: 1.5rem !important;color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;font-family: \"Determination Sans\", Verdana, sans-serif !important;letter-spacing: unset !important;-webkit-text-stroke: unset !important;text-stroke: unset !important;}div.courtroom > div:nth-of-type(5) > div > div.chat-box > div.chat-box-text {top: unset !important;left: unset !important;width: 100% !important;height: 78% !important;max-height: unset !important;margin: 4.5% 0 0 0 !important;text-align: left;padding: 0 3% !important;}div.courtroom > div:nth-of-type(5) > div > div.chat-box > div.chat-box-text span {color: #eff1ff !important;text-shadow: 2px 2px #212421, 1px 1px #212021;font-family: \"Determination Sans\", Verdana, sans-serif !important;line-height: unset !important;}"
                }],
                // ["persona2", {
                //     "name": "Persona 2",
                //     "optionColor": "#bb0608",
                //     "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100% !important;width: 100% !important;letter-spacing: normal!important }div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://z.zz.fo/HXYhd.png\") !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100% !important;top: 0 !important;left: 0 !important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif !important;font-size: 20px!important;left: 6%!important;top: 72.5%!important;text-align: start !important;letter-spacing: unset!important;color: #9cfc04!important;-webkit-text-stroke: unset !important;text-stroke: unset !important;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: \"P4G Vector\", \"P4G\", Roboto, sans-serif!important;top: 78.5%!important;left: 8%!important;width: 80%!important;height: 20.5%!important;line-height: 26px !important;color: #ff5151!important }"
                // }],
                ["wc3human", {
                    "name": "WC3 Human",
                    "optionColor": "#ebbc3d",
                    "css": "div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box {height: 100%;width: 100%;letter-spacing: normal!important;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > img.name-plate-img {opacity: 1!important;content: url(\"https://take-me-to.space/3C1h9Zm.gif\") }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate {width: 100%!important;height: 100%;top: 0;left: 0 }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > img {display: none!important }div.courtroom > div:nth-of-type(5) > div[style] > div.name-plate > div.name-plate-text {font-family: Gothic, \"Song Light\", \"Friz Quadrata\", \"Times New Roman\", sans-serif!important;font-size: 1.2em !important;width: auto !important;color: #c49917!important;top: 72% !important;left: 18%!important;text-align: start;}div.courtroom > div:nth-of-type(5) > div[style] > div.chat-box > div.chat-box-text {font-family: Gothic, \"Song Light\", \"Friz Quadrata\", \"Times New Roman\", sans-serif!important;font-size: 1.2em !important;top: 77%!important;left: 18%!important;width: 80%!important;height: 19%!important;}"
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
        };

        ui.StylePicker.baseStyles = Array.from(ui.StylePicker.customStyles.keys());
        if (Array.isArray(_CE_.options.custom_styles)) {
            _CE_.options.custom_styles.forEach(customStyle => { ui.StylePicker.import(customStyle); });
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

                label.addEventListener("click", () => {
                    input.click();
                });

                input.addEventListener("change", ev => {
                    icon.classList.toggle("mdi-checkbox-blank-outline", !ev.target.checked);
                    icon.classList.toggle("mdi-checkbox-marked", ev.target.checked);
                    icon.classList.toggle("primary--text", ev.target.checked);
                    options.onchange.call(this, ev);
                });

                return container;
            };

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
                    title: options.title,
                    style: { color: "white", backgroundColor: "#1e1e1e", lineHeight: "18px" },
                    min: options.min,
                    max: options.max
                });

                container.appendChild(inputControl);
                inputControl.appendChild(inputSlot);
                inputSlot.appendChild(selectSlot);
                selectSlot.append(label, input);

                container.style.maxWidth = options.maxWidth;
                if (options.display === false) {
                    container.style.display = "none";
                }

                label.textContent = options.label;
                input.value = options.value;

                input.addEventListener("focus", function () {
                    container.classList.add("v-input--is-focused", "primary--text");
                    label.classList.add("primary--text");
                });

                input.addEventListener("focusout", function (ev) {
                    container.classList.remove("v-input--is-focused", "primary--text");
                    label.classList.remove("primary--text");
                    options.onfocusout.call(this, ev);
                });

                if (options.onchange !== null)
                    input.addEventListener("change", options.onchange);

                if (options.oninput !== null)
                    input.addEventListener("input", options.oninput);

                input.addEventListener("keypress", ev => {
                    if (ev.key === "Enter") {
                        ev.preventDefault();
                        ev.target.blur();
                    }
                })

                return container;
            };

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
                };

                options.values.forEach(value => {
                    const option = parseOptions(value);
                    select.appendChild(option);
                });

                select.addEventListener("change", ev => {
                    options.onchange.call(this, ev);
                });

                return container;
            };

            ui.extraSettings_warnOnExit = new createInputCheckbox({
                checked: _CE_.options.warn_on_exit,
                label: "Confirm on exit",
                onchange: ev => {
                    setSetting("warn_on_exit", ev.target.checked);
                }
            });

            ui.extraSettings_rememberUsername = new createInputCheckbox({
                checked: _CE_.options.remember_username,
                label: "Remember username",
                onchange: ev => {
                    setSetting("remember_username", ev.target.checked);
                }
            });

            ui.extraSettings_chatHoverTooltip = new createInputCheckbox({
                checked: _CE_.options.chat_hover_tooltip,
                label: "Chat tooltips",
                onchange: ev => {
                    const value = ev.target.checked;
                    setSetting("chat_hover_tooltip", value);
                    if (value) {
                        ui.chatLog_chatList.addEventListener("mouseover", _CE_.chatTooltip.onChatListMouseOver, false);
                    } else {
                        ui.chatLog_chatList.removeEventListener("mouseover", _CE_.chatTooltip.onChatListMouseOver, false);
                    }
                }
            });

            ui.extraSettings_disableKeyboardShortcuts = new createInputCheckbox({
                checked: _CE_.options.disable_keyboard_shortcuts,
                label: "Disable WASDT hotkeys",
                onchange: ev => {
                    const value = ev.target.checked;
                    setSetting("disable_keyboard_shortcuts", value);
                    if (value) {
                        ui.main.addEventListener("shortkey", disableKeyboardShortcuts, true);
                    } else {
                        ui.main.removeEventListener("shortkey", disableKeyboardShortcuts, true);
                    }
                    ui.settings_keyboardShortcutsWS.style.display = value ? "none" : "flex";
                    ui.settings_keyboardShortcutsAD.style.display = value ? "none" : "flex";
                    ui.settings_keyboardShortcutsT.style.display = value ? "none" : "flex";
                }
            });

            ui.extraSettings_showRoulettes = new createInputCheckbox({
                checked: _CE_.options.show_roulettes,
                label: "Roulette buttons",
                onchange: ev => {
                    const value = ev.target.checked;
                    setSetting("show_roulettes", value);
                    ui.customButtons_evidenceRouletteButton.style.display = value ? "flex" : "none";
                    ui.customButtons_soundRouletteButton.style.display = value ? "flex" : "none";
                    ui.customButtons_musicRouletteButton.style.display = value ? "flex" : "none";
                }
            });

            ui.extraSettings_globalAudioControlButtons = new createInputCheckbox({
                checked: _CE_.options.global_audio_control_buttons,
                label: "Global BGM/SFX control buttons",
                onchange: ev => {
                    const value = ev.target.checked;
                    setSetting("global_audio_control_buttons", value);
                    ui.customButton_globalStopSfx.style.display = value ? "flex" : "none";
                    ui.customButton_globalStopBgm.style.display = value ? "flex" : "none";
                    ui.customButton_globalStopSfxMusic.style.display = value ? "flex" : "none";
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
                onchange: ev => {
                    const selected = ev.target.value;
                    if (selected === "import") {
                        ev.target.value = _CE_.options.textbox_style; //Reset select to original value
                        const input = prompt("Paste your code here");
                        if (!input) { return; }
                        var toImport = JSON.parse(input);
                        if (!Array.isArray(toImport[0])) { toImport = [toImport]; }

                        toImport.forEach(thisStyle => {
                            if (["none", "import", "remove"].includes(thisStyle[0])) { return; } // Don't allow reserved names
                            if (ui.StylePicker.import(thisStyle)) {
                                var option;
                                if (Array.from(ev.target.options).some(option => { return option.value == thisStyle[0]; })) { // Check if we are overwriting an existing option or adding a new one
                                    option = Array.from(ev.target.options).find(option => { return option.value == thisStyle[0]; });
                                    option.textContent = thisStyle[1].name;
                                    option.style.color = thisStyle[1].optionColor;
                                } else {
                                    option = document.createElement("option");
                                    ev.target.querySelector("optgroup[label='Styles']").appendChild(option);
                                }
                                option.value = thisStyle[0];
                                option.textContent = thisStyle[1].name;
                                option.style.color = thisStyle[1].optionColor;

                                if (thisStyle[0] === _CE_.options.textbox_style) {
                                    ev.target.dispatchEvent(new Event("change")); // Force change when updating the current active style
                                }
                            }
                        });

                        const toSave = JSON.stringify(
                            Array.from(ui.StylePicker.customStyles).filter(
                                ([k, v]) => { return !ui.StylePicker.baseStyles.includes(k); }
                            )
                        );
                        if (!toSave) { return; }
                        setSetting("custom_styles", toSave);

                        return ev.preventDefault();
                    } else if (selected === "remove") {
                        ev.target.value = _CE_.options.textbox_style; //Reset select to original value
                        const input = prompt("Type a style ID or name to delete");
                        if (!input) { return; }
                        var key;
                        if (ui.StylePicker.customStyles.has(input)) {
                            key = input;
                        } else {
                            key = Array.from(ui.StylePicker.customStyles).find(s => { return s[1].name === input; })?.[0];
                        }

                        if (!key || !ui.StylePicker.customStyles.has(key)) { return; }
                        if (["none", "import", "remove"].concat(ui.StylePicker.baseStyles).includes(input)) { return; }

                        ui.StylePicker.customStyles.delete(key);
                        ev.target.options.remove(Array.from(ev.target.options).indexOf(Array.from(ev.target.options).find(option => { return option.value == key; })));

                        const toSave = JSON.stringify(
                            Array.from(ui.StylePicker.customStyles).filter(
                                ([k, v]) => { return !ui.StylePicker.baseStyles.includes(k); }
                            )
                        );
                        if (!toSave) { return; }
                        setSetting("custom_styles", toSave);

                        if (key === _CE_.options.textbox_style) {
                            ev.target.dispatchEvent(new Event("change")); // Force change when deleting the current style
                        }

                        return ev.preventDefault();
                    } else if (selected === "help") {
                        ev.target.value = _CE_.options.textbox_style; //Reset select to original value
                        window.open("https://rentry.co/n2g92", '_blank');
                        return ev.preventDefault();
                    } else if (selected === "none" || ui.StylePicker.customStyles.has(selected)) { // Selected a style
                        ui.StylePicker.changeStyle(selected);
                        setSetting("textbox_style", selected);
                    }
                }
            });

            ui.extraSettings_fileHostSelector = new createInputSelect({
                label: "File host",
                title: "Preferred file host. Some hosts don't support certain file types or upload methods. A default file host will automatically be selected if the current option is unavailable as fallback.",
                values: Array.from(_CE_.Uploader.fileHosts).map(([k, v]) => [k, v.name]),
                selectedValue: _CE_.options.file_host,
                onchange: ev => {
                    if (_CE_.Uploader.fileHosts.has(ev.target.value)) {
                        setSetting("file_host", ev.target.value);
                    }
                }
            });

            ui.extraSettings_chatlogHighlights = new createInputCheckbox({
                checked: _CE_.options.chatlog_highlights,
                label: "Chat Notifications",
                title: "Enable notifications for when a message contains one of the words on the list",
                onchange: ev => {
                    const value = ev.target.checked;
                    setSetting("chatlog_highlights", value);
                    ui.extraSettings_chatlogHighlightsPlaySound.style.display = value ? "flex" : "none";
                    ui.extraSettings_chatlogHighlightsSoundUrl.style.display = value ? "flex" : "none";
                    ui.extraSettings_chatlogHighlightsSoundVolume.style.display = value ? "flex" : "none";
                    ui.extraSettings_chatlogHighlightsWordlist.style.display = value ? "flex" : "none";
                }
            });

            ui.extraSettings_chatlogHighlightsPlaySound = new createInputCheckbox({
                checked: _CE_.options.chatlog_highlights_playsound,
                label: "Play Sound",
                title: "Play a sound when a word is highlighted and the window is not in focus",
                display: _CE_.options.chatlog_highlights,
                onchange: ev => {
                    const value = ev.target.checked;
                    setSetting("chatlog_highlights_playsound", value);
                    ui.extraSettings_chatlogHighlightsSoundUrl.style.display = value ? "flex" : "none";
                    ui.extraSettings_chatlogHighlightsSoundVolume.style.display = value ? "flex" : "none";
                }
            });


            ui.extraSettings_chatlogHighlightsSoundUrl = new createInputText({
                value: _CE_.options.chatlog_highlights_sound_url,
                label: "Sound URL",
                title: "URL to the audio file for the sound to be played. Can be in any audio format. Leave empty or type \"default\" for default",
                display: _CE_.options.chatlog_highlights && _CE_.options.chatlog_highlights_playsound,
                type: "text",
                maxWidth: "max-content",
                onfocusout: ev => {
                    const value = ev.target.value;
                    setSetting("chatlog_highlights_sound_url", value);
                    _CE_.notificationSound.sound.pause();
                    if (value && value !== "default") {
                        _CE_.notificationSound.sound.src = value;
                        _CE_.notificationSound.seek = 0;
                        _CE_.notificationSound.duration = 0;
                    } else {
                        _CE_.notificationSound.sound.src = "/Audio/Music/ringtone%202.ogg";
                        _CE_.notificationSound.seek = 1710;
                        _CE_.notificationSound.duration = 1240;
                    }
                    _CE_.notificationSound.sound.load();
                }
            });

            ui.extraSettings_chatlogHighlightsSoundVolume = new createInputText({
                value: _CE_.options.chatlog_highlights_sound_volume,
                label: "Volume: " + _CE_.options.chatlog_highlights_sound_volume,
                title: "Volume for the notification sound.",
                display: _CE_.options.chatlog_highlights && _CE_.options.chatlog_highlights_playsound,
                type: "range",
                min: "0",
                max: "100",
                maxWidth: "75px",
                onfocusout: ev => {
                    const value = ev.target.value;
                    if ((value >= 0 && value <= 100) === false) {
                        return false;
                    }
                    setSetting("chatlog_highlights_sound_volume", value);
                    _CE_.notificationSound.sound.volume = value / 100;
                },
                oninput: ev => {
                    const value = ev.target.value;
                    const label = ui.extraSettings_chatlogHighlightsSoundVolume.querySelector("label");
                    label.textContent = label.textContent.replace(/\d+$/, value);
                }
            });


            ui.extraSettings_chatlogHighlightsWordlist = new createInputText({
                value: _CE_.options.chatlog_highlights_wordlist,
                label: "Words separated by commas",
                title: "List of words to be highlighted, separated by commas. $me always refers to the current username",
                display: _CE_.options.chatlog_highlights,
                type: "text",
                maxWidth: "max-content",
                onfocusout: ev => {
                    const value = ev.target.value;
                    // Remove duplicates, empty spaces and non-word characters, and split into an array
                    const list = [...new Set(value.split(",").map(word => word.replace(/[^\w\s@$]/g, "").trim()).filter(word => word && typeof word === "string"))];
                    ev.target.value = list.join(",");
                    setSetting("chatlog_highlights_wordlist", list);
                    _CE_.notificationWords = _CE_.options.chatlog_highlights_wordlist.map(word => word.replace("$me", _CE_.$store.state.courtroom.user.username));
                    _CE_.notificationRegex = new RegExp(`\\b(?:${_CE_.notificationWords.join("|")})\\b`, "gmi");
                }
            });

            // Row 1 - Header
            const extraSettings_rows = [];
            ui.extraSettings_rowHeader = document.createElement("h3");
            ui.extraSettings_rowHeader.textContent = "Courtroom Enhancer";

            ui.extraSettings_resetButton = new createButton({
                label: "Reset and reload",
                icon: "refresh",
                onclick: () => {
                    if (confirm("Reset Courtroom Enhancer settings and refresh the page?") !== true) {
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
                    gap: "12px 8px"
                }
            });

            ui.extraSettings_rowButtons.appendChild(ui.extraSettings_rowButtonsCol);
            ui.extraSettings_rowButtonsCol.append(ui.extraSettings_warnOnExit,
                ui.extraSettings_rememberUsername,
                ui.extraSettings_chatHoverTooltip,
                ui.extraSettings_disableKeyboardShortcuts,
                ui.extraSettings_textboxStyleSelector,
                ui.extraSettings_fileHostSelector,
                ui.extraSettings_showRoulettes,
                ui.extraSettings_globalAudioControlButtons
            );
            extraSettings_rows.push(ui.extraSettings_rowButtons);

            // Chat Notifications buttons
            ui.extraSettings_chatNotificationButtons = document.createElement("div");
            ui.extraSettings_chatNotificationButtons.className = "row mt-4 no-gutters";
            ui.extraSettings_chatNotificationButtonsCol = document.createElement("div");
            ui.extraSettings_chatNotificationButtonsCol.setAttributes({
                className: "col col-12 d-flex align-center",
                style: {
                    flexWrap: "wrap",
                    gap: "12px 8px"
                }
            });
            ui.extraSettings_chatNotificationButtons.appendChild(ui.extraSettings_chatNotificationButtonsCol);
            ui.extraSettings_chatNotificationButtonsCol.append(ui.extraSettings_chatlogHighlights,
                ui.extraSettings_chatlogHighlightsPlaySound,
                ui.extraSettings_chatlogHighlightsSoundUrl,
                ui.extraSettings_chatlogHighlightsSoundVolume,
                ui.extraSettings_chatlogHighlightsWordlist,
            );

            extraSettings_rows.push(ui.extraSettings_chatNotificationButtons);

            // Append the custom controls before the volume control
            const volumeControl = ui.courtSettings.$children.find(child => { return child.$vnode.componentOptions.tag === "volumeControl"; }).$el.parentNode;

            extraSettings_rows.forEach(row => {
                volumeControl.insertAdjacentElement("beforebegin", row);
            });

            // Add the <hr> separator after the last row
            volumeControl.insertAdjacentElement("beforebegin", ui.divider.cloneNode());
        }();

        // Create additional buttons container below the right panels
        ui.addRightFrameExtraButtons = function () {
            ui.customButtonsContainer = ui.CourtRightPanel.$el.insertAdjacentElement("afterend", document.createElement("div"));
            ui.customButtonsContainer.className = "mx-3 mt-4";

            ui.customButtons_rows = [];

            // Roulette buttons row
            ui.customButtons_rowButtons = document.createElement("div");
            ui.customButtons_rowButtons.setAttributes({
                className: "row no-gutters",
                style: {
                    gap: "15px 5px"
                }
            });

            ui.customButtons_evidenceRouletteButton = new createButton({
                label: "EVD",
                title: "Show a random piece of evidence",
                display: _CE_.options.show_roulettes,
                icon: "dice-multiple",
                onclick: () => {
                    if (_CE_.$store.state.courtroom.room.restrictEvidence) {
                        _CE_.$snotify.error("Showing evidence is restricted to this courtroom's evidence list.");
                        return;
                    }
                    _CE_.findHighestAssetID("evidence");
                    _CE_.sendFrameMessage("[#evd" + Math.floor(Math.random() * _CE_.options.roulette_max_evidence) + "]", "EVD Roulette");
                }
            });

            ui.customButtons_musicRouletteButton = new createButton({
                label: "BGM",
                title: "Play a random song",
                display: _CE_.options.show_roulettes,
                icon: "dice-multiple",
                onclick: () => {
                    _CE_.findHighestAssetID("music");
                    _CE_.sendFrameMessage("[#bgm" + Math.floor(Math.random() * _CE_.options.roulette_max_music) + "]", "BGM Roulette");
                }
            });

            ui.customButtons_soundRouletteButton = new createButton({
                label: "SFX",
                title: "Play a random sound",
                display: _CE_.options.show_roulettes,
                icon: "dice-multiple",
                onclick: () => {
                    _CE_.findHighestAssetID("sound");
                    _CE_.sendFrameMessage("[#bgs" + Math.floor(Math.random() * _CE_.options.roulette_max_sound) + "]", "SFX Roulette");
                }
            });

            ui.customButtons_rowButtons.append(ui.customButtons_evidenceRouletteButton,
                ui.customButtons_musicRouletteButton,
                ui.customButtons_soundRouletteButton);

            // Music buttons
            ui.customButton_stopAllSounds = new createButton({
                label: "Shut up BGM/SFX",
                title: "Stop all sounds that are currently playing (only for you)",
                icon: "volume-variant-off",
                backgroundColor: "teal",
                onclick: () => {
                    _CE_.musicPlayer.stopMusic();
                    _CE_.musicPlayer.stopSounds();
                    if (_CE_.notificationSound.sound)
                        _CE_.notificationSound.sound.pause();
                }
            });

            ui.customButton_muteBGM = new createButton({
                label: "Mute BGM",
                title: "Mute BGM",
                icon: "music",
                backgroundColor: "teal",
                width: "115px",
                onclick: () => {
                    if (_CE_.bgmMute === true) {
                        ui.customButton_muteBGM.querySelector("span.v-btn__content").lastChild.textContent = "Mute BGM";
                        ui.customButton_muteBGM.querySelector(".v-icon").classList.add("mdi-music");
                        ui.customButton_muteBGM.querySelector(".v-icon").classList.remove("mdi-music-off");
                    } else {
                        ui.customButton_muteBGM.querySelector("span.v-btn__content").lastChild.textContent = "Unmute";
                        ui.customButton_muteBGM.querySelector(".v-icon").classList.remove("mdi-music");
                        ui.customButton_muteBGM.querySelector(".v-icon").classList.add("mdi-music-off");
                    }

                    _CE_.bgmMute = !_CE_.bgmMute;

                    if (ui.courtPlayer.$refs.player.musicPlayer.music !== undefined) {
                        if (_CE_.bgmMute === true) {
                            _CE_.bgmVol = _CE_.musicPlayer.volume;
                            _CE_.musicPlayer.volume = 0;
                            _CE_.musicPlayer.music.volume(0);
                        } else {
                            _CE_.musicPlayer.volume = _CE_.bgmVol;
                            _CE_.musicPlayer.music.volume(_CE_.bgmVol);
                        }
                    }
                }
            });

            ui.customButton_globalStopBgm = new createButton({
                label: "Stop BGM",
                title: "Stops the song that is currently playing (for everyone)",
                display: _CE_.options.global_audio_control_buttons,
                icon: "volume-variant-off",
                backgroundColor: "crimson",
                onclick: () => {
                    _CE_.sendFrameMessage("[#bgms]");
                }
            });

            ui.customButton_globalStopSfx = new createButton({
                label: "Stop SFX",
                title: "Stop all SFX that are currently playing (for everyone)",
                display: _CE_.options.global_audio_control_buttons,
                icon: "volume-variant-off",
                backgroundColor: "crimson",
                onclick: () => {
                    _CE_.sendFrameMessage("[#bgss]");
                }
            });

            ui.customButton_globalStopSfxMusic = new createButton({
                label: "Stop BGM/SFX",
                title: "Stop all sounds that are currently playing (for everyone)",
                display: _CE_.options.global_audio_control_buttons,
                icon: "volume-variant-off",
                backgroundColor: "crimson",
                onclick: () => {
                    _CE_.sendFrameMessage("[#bgms][#bgss]");
                }
            });

            ui.customButton_showBgmInfo = new createButton({
                label: "BGM Info",
                title: "Display active BGM information",
                icon: "music-circle-outline",
                backgroundColor: "teal",
                onclick: () => {
                    if (!_CE_.musicPlayer.currentMusicUrl) {
                        if (!_CE_.$snotify.notifications.some(notification => notification.title === "BGM Info Error"))
                            _CE_.$snotify.error("No music is playing.", "BGM Info Error", {
                                html: `<div class="snotifyToast__body" style="word-break: break-all;">No music is playing.</div>`
                            });
                        return;
                    }
                    const bgm_url = _CE_.musicPlayer.currentMusicUrl;
                    const bgm_object = Object.values(ui.courtPlayer.musicCache).find(music => music.url === bgm_url);
                    const bgm_tag = "[#bgm" + bgm_object.id + "]";

                    // Check if a notification for the current song is already active
                    if (_CE_.$snotify.notifications.some(notification => notification.title === "BGM Info " + bgm_object.id)) return;

                    _CE_.bgmNotification = _CE_.$snotify.success(bgm_url, "BGM Info " + bgm_object.id, {
                        html: `<div class="snotifyToast__body" style="word-break: break-all;"><h3>${sanitizeHTML(bgm_object.name)}</h3><div><a style="color:#0f28e6" href="${bgm_url}" target="_blank" rel="noreferrer">${bgm_url}</a></div><div>${bgm_tag}</div>`,
                        closeOnClick: false, buttons: [
                            { text: "Copy URL", action: () => { navigator.clipboard.writeText(bgm_url); } },
                            { text: "Copy Tag", action: () => { navigator.clipboard.writeText(bgm_tag); } }
                        ]
                    });
                }
            });

            ui.customButton_showSfxInfo = new createButton({
                label: "SFX URL",
                title: "Display the URL for all active sound effects",
                icon: "music-circle-outline",
                backgroundColor: "teal",
                onclick: () => {
                    if (_CE_.musicPlayer.soundsPlaying.length === 0 || !_CE_.musicPlayer.soundsPlaying.some(snd => snd.howler._duration)) {
                        if (_CE_.$snotify.notifications.some(notification => notification.title === "SFX Info Error") === false) {
                            _CE_.$snotify.error("No sounds are playing.", "SFX Info Error", {
                                html: `<div class="snotifyToast__body" style="word-break: break-all;">No sounds are playing.</div>`
                            });
                        }
                        return;
                    }

                    var notif_html = "";
                    _CE_.musicPlayer.soundsPlaying.forEach(snd => {
                        if (!snd.howler._duration) return;
                        const snd_url = snd.howler._src;
                        const snd_object = Object.values(ui.courtPlayer.soundCache).find(csnd => csnd.url === snd_url);
                        notif_html += `<div>[#bgs${snd_object.id}] <b>${sanitizeHTML(snd_object.name)}</b><p><a style="color:#0f28e6" href="${snd_url}" target="_blank" rel="noreferrer">${snd_url}</a></p></div>`;
                    });

                    if (_CE_.$snotify.notifications.some(notification => notification.title === "SFX Info")) return;

                    _CE_.$snotify.success("SFX Info", "SFX Info", {
                        html: `<div class="snotifyToast__body" style="word-break: break-all;">${notif_html}</div>`,
                        closeOnClick: false, timeout: 3000
                    });
                }
            });

            ui.customButtons_rowButtons.append(ui.customButton_stopAllSounds,
                ui.customButton_showBgmInfo,
                ui.customButton_showSfxInfo,
                ui.customButton_muteBGM,
                ui.customButton_globalStopBgm,
                ui.customButton_globalStopSfx,
                ui.customButton_globalStopSfxMusic);

            ui.customButtons_rows.push(ui.customButtons_rowButtons);

            // Attach each rows to the custom buttons container
            ui.customButtons_rows.forEach(row => {
                ui.customButtonsContainer.appendChild(row);
            });
        };
        ui.addRightFrameExtraButtons();

        // Set up chat notifications
        if (_CE_.options.chatlog_highlights_sound_url && _CE_.options.chatlog_highlights_sound_url !== "default") {
            _CE_.notificationSound = { sound: new Audio(_CE_.options.chatlog_highlights_sound_url), seek: 0, duration: 0 };
        } else {
            _CE_.notificationSound = { sound: new Audio("/Audio/Music/ringtone%202.ogg"), seek: 1710, duration: 1240 };
        }

        _CE_.notificationSound.sound.onplay = ev => {
            var sound = ev.target;
            sound.currentTime = (_CE_.notificationSound.seek || 0) / 1000;
            if (_CE_.notificationSound.duration > 0) {
                setTimeout(() => { sound.pause(); }, _CE_.notificationSound.duration);
            }
        };

        _CE_.notificationSound.sound.volume = _CE_.options.chatlog_highlights_sound_volume / 100;
        _CE_.notificationWords = _CE_.options.chatlog_highlights_wordlist.map(word => word.replace("$me", _CE_.$store.state.courtroom.user.username));
        _CE_.notificationRegex = new RegExp(`\\b(?:${_CE_.notificationWords.join("|")})\\b`, "gmi");

        _CE_.$vue.$watch("$store.state.courtroom.messages", () => {
            const lastMessage = _CE_.$store.state.courtroom.messages[Object.entries(_CE_.$store.state.courtroom.messages).length - 1];

            if (!lastMessage)
                return console.log("test1");

            setTimeout(_CE_.chatLog_enhanceMessages, 0);

            if (document.hasFocus())
                return;

            if (_CE_.options.chatlog_highlights !== true)
                return;

            if (_CE_.options.chatlog_highlights_playsound !== true)
                return;

            // Sound is on cooldown
            if (_CE_.notificationSound_cooldown === true)
                return;

            // Sound is already playing
            if (_CE_.notificationSound.sound.paused !== true)
                return;

            // Message is a system message
            if (!lastMessage.authUsername)
                return;

            // check if the window is not focused, and the last message is a text message, and the message contains any words in the list
            if (lastMessage.text.match(_CE_.notificationRegex)) {

                _CE_.notificationSound_cooldown = true;
                // 10 seconds cooldown between notification pings
                setTimeout(() => { _CE_.notificationSound_cooldown = false; }, 10000);
                _CE_.notificationSound.sound.play();

                // If there is music playing lower its volume while the notification sound is playing
                if (_CE_.musicPlayer.music && _CE_.musicPlayer.music.volume() && _CE_.bgmMute !== true) {
                    const musicVolume = _CE_.musicPlayer.music.volume();
                    _CE_.musicPlayer.music.volume(musicVolume * 0.35);
                    _CE_.notificationSound.sound.onpause = () => {
                        if (_CE_.bgmMute === true) return;
                        _CE_.musicPlayer.music.fade(_CE_.musicPlayer.music.volume(), musicVolume, 300);
                    };
                }
            }
        });

        _CE_.chatLog_enhanceMessages = function () {
            if (!document.contains(ui.chatLog_chatList)) return;

            for (let messageNode of ui.chatLog_chatList.children) {
                const messageIcon = messageNode.querySelector("i");

                // Message is a system message
                if (!messageIcon.matches(".mdi-account, .mdi-crown, .mdi-account-tie")) continue;

                const messageTextDiv = messageNode.querySelector("div.chat-text");
                const html = messageTextDiv.innerHTML;

                // Message was already changed
                if (html.includes("<")) continue;

                messageTextDiv.innerHTML = html.replaceAll(
                    URL_REGEX,
                    `<a target="_blank" rel="noreferrer" href="$1">$1</a>`
                );

                // Highlight notification words
                if (_CE_.options.chatlog_highlights === true) {
                    messageTextDiv.innerHTML = messageTextDiv.innerHTML.replaceAll(
                        _CE_.notificationRegex,
                        `<span style="background-color: aqua; color:black; margin:0px 1px">$&</span>`
                    )
                }
            }
        }

        // Set up a watcher for when a new BGM is played to automatically mute it if BGM is muted
        ui.courtPlayer.$refs.player.$watch("musicPlayer.music", (newValue, oldValue) => {
            if (!newValue) return;

            if (_CE_.bgmMute === true) {
                newValue.once("load", () => {
                    _CE_.bgmVol = _CE_.musicPlayer.volume;
                    _CE_.musicPlayer.volume = 0;
                    _CE_.musicPlayer.music.volume(0);
                });
            }
        });

        // Function to send a chat message with optional output in the chatlog
        _CE_.sendFrameMessage = function (command, printInChatlog = false) {
            if (ui.courtTextEditor.canSend !== true) return;
            ui.courtTextEditor.$store.state.courtroom.frame.text += command;
            ui.courtTextEditor.send();

            if (printInChatlog === false) return;

            _CE_.$store.dispatch("courtroom/appendMessage", {
                type: "system",
                text: (typeof printInChatlog === "string" ? printInChatlog + ": " : "") + command
            });
        };

        // Find a cached asset with an ID highest than the recorded one and if it exists remember it
        _CE_.findHighestAssetID = function (asset) {
            if (!["evidence", "music", "sound"].includes(asset)) return;
            const highestCached = Math.max(...Object.keys(_CE_.$store.state.assets[asset].cache), 0);
            if (highestCached > _CE_.options[`roulette_max_${asset}`]) {
                setSetting(`roulette_max_${asset}`, highestCached);
            }
        };

        // Finds all cached assets with the highest ID for later use
        _CE_.findAllHighestAssetID = function () {
            ["evidence", "music", "sound"].forEach(asset => { _CE_.findHighestAssetID(asset); });
        };

        // Chat hover tooltips
        _CE_.chatTooltip = {
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
                    ui.chatLog_chatList.addEventListener("mouseover", this.onChatListMouseOver, false);
                }
                this.tooltipElement.addEventListener("mouseenter", ev => { ev.target.style.opacity = "1"; });
                this.tooltipElement.addEventListener("mouseleave", this.onChatItemMouseLeave.bind(this), { capture: false });
                this.tooltipElement.addEventListener("transitioncancel", ev => {
                    if (ev.target.style.opacity == "0") {
                        ev.target.style.visibility = "hidden";
                    }
                });
                this.tooltipElement.addEventListener("transitionend", ev => {
                    const audioVideoElements = this.tooltipElement.querySelectorAll("audio, video");
                    if (Array.from(audioVideoElements).some(ob => !ob.paused)) {
                        ev.target.style.opacity = "100";
                        return;
                    }
                    if (ev.target.style.opacity == "0") {
                        ev.target.style.visibility = "hidden";
                        audioVideoElements.forEach(f => { f.pause(); });
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
                if (top < ui.chatLog_chatList.getBoundingClientRect().y) {
                    top = ui.chatLog_chatList.getBoundingClientRect().y;
                } else if (top + this.tooltipElement.offsetHeight > this.tooltipElement.parentNode.offsetHeight) {
                    top = this.parentNode.offsetHeight - this.tooltipElement.offsetHeight - 20;
                }
                this.tooltipElement.style.top = top + "px";
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

                    img.addEventListener("load", () => {
                        img.style.display = "inline";
                        this.reposition();
                    });

                    img.addEventListener("error", () => {
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

                    video.addEventListener("loadeddata", () => {
                        video.style.display = "inline-block";
                        this.reposition();
                    });

                    video.addEventListener("error", () => {
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

                    youtubeEmbed.addEventListener("load", () => {
                        youtubeEmbed.style.display = "inline-block";
                        this.reposition();
                    });

                    youtubeEmbed.addEventListener("error", () => {
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

                    audio.addEventListener("loadedmetadata", () => {
                        audio.style.width = "100%";
                        audio.style.display = "inline-block";
                        this.reposition();
                    });

                    audio.addEventListener("error", () => {
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
                    } catch (err) {
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
                matchedElements.forEach(element => { this.tooltipElement.appendChild(element); });
                this.reposition();
                this.tooltipElement.setAttributes({
                    style: {
                        visibility: "visible",
                        opacity: "1"
                    }
                });
                this.chat.element.addEventListener("mouseleave", this.onChatItemMouseLeave, { capture: false });
            },

            onChatListMouseOver(ev) {
                const chat = {
                    element: ev.target.closest("div.v-list-item__content")
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

            onChatItemMouseLeave(ev) {
                if (this.tooltipElement.contains(ev.toElement)) return;
                // return if the YouTube video is fullscreen
                if (document.fullscreenElement instanceof HTMLIFrameElement && /^https:\/\/www\.youtube\.com/.test(document.fullscreenElement.src)) return;
                // return if any audio or video is playing
                if (Array.from(this.tooltipElement.querySelectorAll("audio,video")).some(ob => !ob.paused)) return;
                this.tooltipElement.style.opacity = "0";
            }
        };

        ui.chatTooltip = _CE_.chatTooltip.init();
        ui.app.appendChild(ui.chatTooltip);

        // CSS fixes: allow right clicking and dragging images, fix wide evidence
        document.head.insertAdjacentHTML('beforeend', `<style>
        img {pointer-events: auto; -webkit-user-drag:auto;}
        .name-plate-img {pointer-events: none;}
        div.scene-container {pointer-events: auto; justify-content:center;}
        .evidence {max-width:100%;align-self:center;object-fit:contain;}
        </style>`);

        // Restore right click functionality to courtroom container
        ui.courtroom_container.addEventListener("contextmenu", ev => {
            ev.stopImmediatePropagation();
        }, true);

        // Disable WASDT shortcuts
        const disableKeyboardShortcuts = function (ev) {
            if ("wasdt".includes(ev.srcKey)) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
        };

        if (_CE_.options.disable_keyboard_shortcuts) {
            ui.main.addEventListener("shortkey", disableKeyboardShortcuts, true);
            ui.settings_keyboardShortcutsWS.style.display = "none";
            ui.settings_keyboardShortcutsAD.style.display = "none";
            ui.settings_keyboardShortcutsT.style.display = "none";
        }

        ui.StylePicker.changeStyle(_CE_.options.textbox_style);

    }

    function on_beforeUnload(ev) {
        _CE_.findAllHighestAssetID();
        if (_CE_.options.warn_on_exit && _CE_.$vue.$socket.connected === true) {
            ev.preventDefault();
            ev.returnValue = "Are you sure you want to leave?";
            return "Are you sure you want to leave?";
        }
    }

    function on_windowResize() {
        if (!document.contains(ui.customButtonsContainer)) {
            ui.addRightFrameExtraButtons();
        }
        if (!document.contains(ui.chatLog_chatList)) {
            ui.chatLog_chatList = ui.courtChatLog.$children.find(child => { return child.$vnode.componentOptions.tag === "v-list"; })?.$el;
            if (document.contains(ui.chatLog_chatList)) {
                setTimeout(_CE_.chatLog_enhanceMessages, 0);
                if (_CE_.options.chat_hover_tooltip) {
                    ui.chatLog_chatList.addEventListener("mouseover", _CE_.chatTooltip.onChatListMouseOver, false);
                }
            }
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
            if (typeof res === "undefined" || res === null || res === "") {
                return def;
            } else {
                return JSON.parse(res);
            }
        } catch {
            if (typeof res === "undefined" || res === null || res === "") {
                return def;
            } else {
                return res;
            }
        }
    }

    function storeSet(key, value) {
        if (typeof GM_setValue === "undefined") {
            return localStorage.setItem(key, value);
        } else {
            return GM_setValue(key, value);
        }
    }

    function storeDel(key) {
        if (typeof GM_deleteValue === "undefined") {
            return localStorage.removeItem(key);
        } else {
            return GM_deleteValue(key);
        }
    }

    function storeClear() {
        if (typeof GM_listValues === "undefined") {
            localStorage.clear();
        } else {
            const storedSettings = GM_listValues();
            for (const val of storedSettings) {
                GM_deleteValue(storedSettings[val]);
            }
        }
        _CE_.options.warn_on_exit = false;
        window.location.reload();
    }

    function sanitizeHTML(text) {
        return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    const CrossOrigin = (function () {
        try {
            return (typeof GM !== "undefined" && GM !== null ? GM.xmlHttpRequest : void 0) || GM_xmlhttpRequest;
        } catch (err) {
            return "CrossOrigin error:" + console.error(err);
        }
    })();

    // Helper function to set multiple element attributes at once
    Element.prototype.setAttributes = function (attr) {
        var recursiveSet = function (at, set) {
            for (var prop in at) {
                if (typeof at[prop] == 'object' && at[prop].dataset == null && at[prop][0] == null) {
                    recursiveSet(at[prop], set[prop]);
                } else {
                    set[prop] = at[prop];
                }
            }
        };
        recursiveSet(attr, this);
    };
})();
