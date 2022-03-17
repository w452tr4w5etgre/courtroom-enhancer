// ==UserScript==
// @name         Objection.lol Courtroom Enhancer
// @namespace    https://github.com/w452tr4w5etgre/
// @description  Enhances Objection.lol Courtroom functionality
// @version      0.683
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
        "evid_roulette_max": Math.max(getSetting("evid_roulette_max", 0), 482500),
        "sound_roulette_max": Math.max(getSetting("sound_roulette_max", 0), 41500),
        "music_roulette_max": Math.max(getSetting("music_roulette_max", 0), 136200)
    };
}();

let storedUsername = getStoredUsername();

const ui = {"app": document.querySelector("div#app")};

(new MutationObserver(checkJoinBoxReady)).observe(document, {childList: true, subtree: true});

function checkJoinBoxReady(changes, observer) {
    if (typeof ui.app === "undefined" || !ui.app) {
        ui.app = document.querySelector("div#app");
    }

    for (let change of changes) {
        for (let node of change.addedNodes) {
            if (node === ui.app.querySelector("div.v-dialog__content.v-dialog__content--active")) {
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

        for (let node of change.removedNodes) {
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
    ui.rightFrame_toolbarTabs = ui.rightFrame_toolbarContainer.querySelector("div.v-tabs > div[role=tablist] > div.v-slide-group__wrapper > div.v-slide-group__content.v-tabs-bar__content");

    ui.rightFrame_toolbarGetTabs = function() {
        for (let toolbarTab of ui.rightFrame_toolbarTabs.querySelectorAll("div.v-tab")) {
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
                    console.error("Tab not found: "+toolbarTab.textContent);
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
    ui.evidence_buttonsRow = ui.evidence_form.lastChild;
    ui.evidence_addButton = ui.evidence_form.querySelector("div:last-of-type > div.col:first-of-type > button.mr-2.v-btn.success");
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
    let on_usernameChange = function(name) {
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

    // Function to create a button
    var createButton = function(id, label, icon=null, callback) {
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
    var enhanceEvidenceTab = function() {
        // Clicking "Evidence" focuses on the URL input
        ui.rightFrame_toolbarTabEvidence.addEventListener("click", e => {
            setTimeout(f => {
                ui.evidence_formFields[1].click();
            }, 200);
        });

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
                setTimeout(f=>{ui.evidence_list.scrollTop = ui.evidence_list.scrollHeight;}, 250);
            }
        }, true);

        // Add evidence sources
        var evidenceUploader = function() {
            var parseForm = function(data) {
                const form = new FormData();
                Object.entries(data).filter(([key, value]) => value !== null).map(([key, value]) => form.append(key, value));
                return form;
            }

            var uploadByFile = function(file, callback) {
                CrossOrigin({
                    url: "https://catbox.moe/user/api.php",
                    method: "POST",
                    data: parseForm({
                        reqtype: "fileupload",
                        fileToUpload: file
                    }),
                    onload: res => {
                        if (res.readyState == 4 && res.status == 200) {
                            callback(res.responseText);
                        } else {
                            alert("Request returned code" + res.status + ":" + res.responseText.substr(0,200));
                        }
                    }
                });
            }

            var uploadByURL = function(url, callback) {
                CrossOrigin({
                    url: "https://catbox.moe/user/api.php",
                    method: "POST",
                    data: parseForm({
                        reqtype: "urlupload",
                        url: url
                    }),
                    onload: res => {
                        if (res.readyState == 4 && res.status == 200) {
                            callback(res.responseText);
                        } else {
                            alert("Request returned code" + res.status + ":" + res.responseText.substr(0,200));
                        }
                    }
                });
            }

            var uploadCallback = function(url) {
                ui.evidence_formFields[0].value = "upload";
                ui.evidence_formFields[0].dispatchEvent(new Event("input"));

                ui.evidence_formFields[1].value = url;
                ui.evidence_formFields[1].dispatchEvent(new Event("input"));

                dragdropDiv.setAttributes({
                    firstChild: {classList: "v-icon v-icon--left mdi mdi-image-size-select-large"},
                    lastChild: {textContent: "Drop file"},
                    style: {
                        borderColor: "teal",
                        pointerEvents: "auto",
                    }
                });
            }

            ui.evidence_extraSourcesColumn = document.createElement("div");
            ui.evidence_extraSourcesColumn.setAttributes({
                className: "col",
                style: {
                    display: "flex",
                    gap: "5px",
                    flexWrap: "nowrap",
                    justifyContent: "space-evenly",
                    alignItems: "center"
                }
            });

            const dragdropDiv = document.createElement("div");
            dragdropDiv.setAttributes({
                style: {
                    display: "flex",
                    alignItems: "center",
                    alignSelf: "flex-end",
                    minWidth: "140px",
                    height: "80%",
                    border: "2px dashed teal",
                    padding: "0px 15px",
                    userSelect: "none",
                    cursor: "pointer"
                }
            });

            const dragdropIcon = document.createElement("i");
            dragdropIcon.classList = "v-icon v-icon--left mdi mdi-image-size-select-large";
            dragdropDiv.append(dragdropIcon);
            dragdropIcon.after(document.createTextNode("Upload image"));

            const dragdropFile = document.createElement("input");
            dragdropFile.setAttributes({
                type: "file",
                accept: "image/*",
                style: {opacity: 0}
            });

            dragdropFile.addEventListener("change", e => {
                console.log(e.target.files);
                if (e.target.files) {
                    var files = e.target.files;
                    for (const file of files) {
                        if (file.type.match("^image/")) {
                            dragdropDiv.setAttributes({
                                firstChild: {classList: "v-icon v-icon--left mdi mdi-progress-upload"},
                                lastChild: {textContent: "Uploading"},
                                style: {
                                    borderColor: "yellow",
                                    pointerEvents: "none",
                                }
                            });
                            uploadByFile(file, uploadCallback);
                        }
                    }
                }
            });

            dragdropDiv.addEventListener("click", e => {
                dragdropFile.click();
            });

            dragdropDiv.addEventListener("drop", e => {
                e.preventDefault();
                dragdropDiv.style.borderColor = "teal";
                if (e.dataTransfer.items) {
                    var items = e.dataTransfer.items;
                    for (const item of items) {
                        if (item.kind === "file") {
                            var file = item.getAsFile();
                            if (file.type.match("^image/")) {
                                dragdropDiv.setAttributes({
                                    firstChild: {classList: "v-icon v-icon--left mdi mdi-progress-upload"},
                                    lastChild: {textContent: "Uploading"},
                                    style: {
                                        borderColor: "yellow",
                                        pointerEvents: "none",
                                    }
                                });
                                uploadByFile(file, uploadCallback);
                            }
                            break;
                        } else if (item.kind === "string" && item.type.match("^text/uri")) {
                            item.getAsString(str => {
                                dragdropDiv.setAttributes({
                                    firstChild: {classList: "v-icon v-icon--left mdi mdi-progress-upload"},
                                    lastChild: {textContent: "Uploading"},
                                    style: {
                                        borderColor: "yellow",
                                        pointerEvents: "none",
                                    }
                                });
                                uploadByURL(str, uploadCallback);
                            });
                            break;
                        }
                    }
                }
            })

            dragdropDiv.addEventListener("dragover", e => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "red";
            });

            dragdropDiv.addEventListener("dragleave", e => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "teal";
            });

            // Upload by gelbooru tags
            const gelbooruDiv = document.createElement("div");
            gelbooruDiv.setAttributes({
                style: {
                    display: "flex",
                    alignItems: "center"
                }
            });

            const gelbooruIcon = document.createElement("img");
            gelbooruIcon.setAttributes({
                src: "https://gelbooru.com/favicon.png",
                classList: "v-icon v-icon--left",
                style: {
                    cursor: "pointer"
                }
            });

            const gelbooruTagsContainer = document.createElement("div"), gelbooruInputTags = document.createElement("input"), gelbooruBtnSend = document.createElement("div");
            gelbooruTagsContainer.setAttributes({
                style: {
                    display: "none",
                    gap: "5px"
                }
            });

            gelbooruInputTags.setAttributes({
                maxLength: "255",
                placeholder: "Ex: blue_sky cloud 1girl",
                style: {
                    borderBottom: "1px solid white",
                    color: "white"
                }
            });

            gelbooruBtnSend.setAttributes({
                classList: "mdi mdi-send",
                style: {cursor: "pointer"}
            });

            gelbooruTagsContainer.append(gelbooruInputTags, gelbooruBtnSend);

            gelbooruDiv.append(gelbooruIcon, gelbooruTagsContainer);

            gelbooruIcon.addEventListener("click", e => {
                var display = gelbooruTagsContainer.style.display
                if (display == "none") {
                    gelbooruTagsContainer.style.display = "flex";
                    dragdropDiv.style.display = "none";
                    gelbooruInputTags.focus();
                } else {
                    gelbooruTagsContainer.style.display = "none";
                    dragdropDiv.style.display = "flex";
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
                    url: "https://gelbooru.com/index.php?page=dapi&json=1&s=post&q=index&limit=1&tags=" + encodeURIComponent(tags),
                    method: "GET",
                    onload: res => {
                        if (res.readyState == 4 && res.status == 200) {
                            var responseJSON = JSON.parse(res.responseText);
                            if (!responseJSON.post) {
                                gelbooruInputTags.value = "No results";
                                gelbooruInputTags.style.color = "white";
                                gelbooruInputTags.disabled = false;
                                gelbooruInputTags.focus();
                                return;
                            }
                            uploadByURL(responseJSON.post[0].file_url, f => {
                                ui.evidence_formFields[0].value = responseJSON.post[0].id;
                                ui.evidence_formFields[0].dispatchEvent(new Event("input"));

                                ui.evidence_formFields[1].value = f;
                                ui.evidence_formFields[1].dispatchEvent(new Event("input"));

                                setTimeout(f=>{ui.evidence_addButton.click()}, 500);

                                gelbooruInputTags.value = "";
                                gelbooruInputTags.style.color = "white";
                                gelbooruInputTags.disabled = false;
                                gelbooruIcon.click();
                            });
                        }
                    }
                });
            });

            ui.evidence_extraSourcesColumn.append(dragdropDiv, gelbooruDiv);

            ui.evidence_form.lastChild.append(ui.evidence_extraSourcesColumn);
        }();

        // Show evidence count
        ui.evidence_evidenceTotalColumn = document.createElement("div");
        ui.evidence_evidenceTotalColumn.className = "col";
        ui.evidence_evidenceTotalColumn.style.textAlign = "center";
        ui.evidence_evidenceTotalColumn.updateCount = function() {
            let evidMax = 75, evidCount = Math.max(ui.evidence_list.childElementCount, 0);
            if (evidCount == evidMax) {
                this.className = "col mdi mdi-alert error--text";
            } else if (evidCount / evidMax > 0.9) {
                this.className = "col warning--text";
            } else {
                this.className = "col success--text";
            }
            this.textContent = evidCount + " / " + evidMax;
        };
        ui.evidence_form.lastChild.append(ui.evidence_evidenceTotalColumn);

        ui.evidence_list.fixEvidenceItem = function(node) {
            let divCard = node.firstChild;
            let divImage = divCard.querySelector("div.v-image");
            let divTitle = divCard.querySelector("div.v-card__title");
            let divSubtitle = divCard.querySelector("div.v-card__subtitle");
            let divActions = divCard.querySelector("div.v-card__actions");
            let buttonEye = divActions.querySelector("button > span.v-btn__content > i.mdi-eye").parentNode.parentNode;

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
            ui.evidence_evidenceTotalColumn.updateCount();
            for (let change of changes) {
                for (let node of change.addedNodes) {
                    ui.evidence_list.fixEvidenceItem(node);
                }
            }
        }
    }();

    // Add setting options under the Settings tab
    var enhanceSettingsTab = function() {
        var createExtraSettingElemCheckbox = function(id, text, callback) {
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

        var createExtraSettingElemText = function(id, text, callback, input_type="text") {
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

        ui.extraSettings_warnOnExit = createExtraSettingElemCheckbox("warn_on_exit", "Confirm on exit", e => {
            let value = e.target.checked;
            setSetting("warn_on_exit", value);
        });

        ui.extraSettings_rememberUsername = createExtraSettingElemCheckbox("remember_username", "Remember username", e => {
            let value = e.target.checked;
            setSetting("remember_username", value);
        });

        ui.extraSettings_showConsole = createExtraSettingElemCheckbox("show_console", "Show log console", e => {
            let value = e.target.checked;
            setSetting("show_console", value);
            ui.customButtons_rowLog.style.display = value ? "flex" : "none";
        });

        ui.extraSettings_adjustChatTextWithWheel = createExtraSettingElemCheckbox("adjust_chat_text_with_wheel", "Scroll to adjust text", e => {
            let value = e.target.checked;
            setSetting("adjust_chat_text_with_wheel", value);
            if (value) {
                ui.courtroom_chatBoxes.addEventListener("wheel", on_chatBoxTextWheel);
            } else {
                ui.courtroom_chatBoxes.removeEventListener("wheel", on_chatBoxTextWheel);
            }
        });

        ui.extraSettings_chatHoverTooltip = createExtraSettingElemCheckbox("chat_hover_tooltip", "Link tooltips", e => {
            let value = e.target.checked;
            setSetting("chat_hover_tooltip", value);
            if (value) {
                ui.chatLog_chat.addEventListener("mouseover", onChatListMouseOver, false);
            } else {
                ui.chatLog_chat.removeEventListener("mouseover", onChatListMouseOver, false);
            }
        });

        ui.extraSettings_disableKeyboardShortcuts = createExtraSettingElemCheckbox("disable_keyboard_shortcuts", "Disable WASD shortcuts", e => {
            let value = e.target.checked;
            setSetting("disable_keyboard_shortcuts", value);
            if (value) {
                ui.main.addEventListener("shortkey", disableKeyboardShortcuts, true);
                ui.settings_keyboardShortcutsWS.style.display = "none";
                ui.settings_keyboardShortcutsAD.style.display = "none";
            } else {
                ui.main.removeEventListener("shortkey", disableKeyboardShortcuts, true);
                ui.settings_keyboardShortcutsWS.style.display = "flex";
                ui.settings_keyboardShortcutsAD.style.display = "flex";
            }
        });

        ui.extraSettings_rouletteEvid = createExtraSettingElemCheckbox("evid_roulette", "Evidence roulette", e => {
            let value = e.target.checked;
            setSetting("evid_roulette", value);
            ui.customButtons_evidRouletteButton.style.display = value ? "inline" : "none";
            ui.extraSettings_rouletteEvidAsIcon.style.display = value ? "inline-block" : "none";
            ui.extraSettings_rouletteEvidMax.style.display = value ? "inline-block" : "none";
        });

        ui.extraSettings_rouletteSound = createExtraSettingElemCheckbox("sound_roulette", "Sound roulette", e => {
            let value = e.target.checked;
            setSetting("sound_roulette", value);
            ui.customButtons_soundRouletteButton.style.display = value ? "inline" : "none"
            ui.extraSettings_rouletteSoundMax.style.display = value ? "inline-block" : "none";
        });

        ui.extraSettings_rouletteMusic = createExtraSettingElemCheckbox("music_roulette", "Music roulette", e => {
            let value = e.target.checked;
            setSetting("music_roulette", value);
            ui.customButtons_musicRouletteButton.style.display = value ? "inline" : "none"
            ui.extraSettings_rouletteMusicMax.style.display = value ? "inline-block" : "none";
        });

        ui.extraSettings_rouletteEvidAsIcon = createExtraSettingElemCheckbox("evid_roulette_as_icon", "icon", e => {
            let value = e.target.checked;
            setSetting("evid_roulette_as_icon", value);
        });

        ui.extraSettings_rouletteEvidMax = createExtraSettingElemText("evid_roulette_max", "max", e => {
            let value = parseInt(e.target.value);
            if (value) {
                setSetting("evid_roulette_max", value);
            } else {
                e.target.value = scriptSetting.evid_roulette_max;
                e.preventDefault();
                return false;
            }
        }, "number");

        ui.extraSettings_rouletteSoundMax = createExtraSettingElemText("sound_roulette_max", "max", e => {
            let value = parseInt(e.target.value);
            if (value) {
                setSetting("sound_roulette_max", value);
            } else {
                e.target.value = scriptSetting.sound_roulette_max;
                e.preventDefault();
                return false;
            }
        }, "number");

        ui.extraSettings_rouletteMusicMax = createExtraSettingElemText("music_roulette_max", "max", e => {
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
        let settings_separator = ui.settings_separator;

        // Row 1 - Header
        let extraSettings_rows = [];
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

            let random = Math.floor(Math.random() * scriptSetting.evid_roulette_max);

            ui.leftFrame_textarea.value = "[#evd" + (scriptSetting.evid_roulette_as_icon ? "i" : "") + random + "]";
            ui.leftFrame_textarea.dispatchEvent(new Event("input"));

            // Click Send button
            ui.leftFrame_sendButton.click()
            Logger.log("[#evd" + (scriptSetting.evid_roulette_as_icon ? "i" : "") + random + "]", "image");
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

            let random = Math.floor(Math.random() * scriptSetting.sound_roulette_max);

            ui.leftFrame_textarea.value = "[#bgs" + random + "]";
            ui.leftFrame_textarea.dispatchEvent(new Event("input"));

            // Click Send button
            ui.leftFrame_sendButton.click();
            Logger.log("[#bgs" + random + "]", "volume-medium");
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

            let random = Math.floor(Math.random() * scriptSetting.music_roulette_max);

            ui.leftFrame_textarea.value = "[#bgm" + random + "]";
            ui.leftFrame_textarea.dispatchEvent(new Event("input"));

            // Click Send button
            ui.leftFrame_sendButton.click();
            Logger.log("[#bgm" + random + "]", "music-note");
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
                for (let howl of unsafeWindow.Howler._howls) {
                    if (howl._state == "loaded" && howl._loop) {
                        if (!scriptSetting.show_console) {
                            alert(howl._src);
                        }
                        Logger.log(howl._src, "link-variant");
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
        let Logger = {
            lines: [],
            log: function(str, icon=null) {
                // If a duplicate is find, delete it before adding a new one
                let duplicate;
                if (duplicate = this.lines.find(line=> line.str == str)) {
                    this.lines.splice(this.lines.indexOf(duplicate), 1);
                }
                if (this.lines.length >= 8) {
                    this.lines.shift();
                }
                this.lines.push({
                    str: str,
                    icon: icon
                });

                while (ui.customButtons_logArea.firstChild) {
                    ui.customButtons_logArea.firstChild.remove()
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
                            border: "1px solid rgb(126 85 143)",
                            borderRadius: "4px",
                            backgroundColor: "rgb(126 85 143)",
                            userSelect: "all",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }
                    });
                    item.append(document.createTextNode(entry.str));

                    item.addEventListener("mouseenter", e=>{
                        e.target.style.overflow="visible";
                    });

                    item.addEventListener("mouseleave", e=>{
                        e.target.parentNode.childNodes.forEach(c=>{
                            c.style.overflow="hidden";
                        })
                    });

                    if (scriptSetting.show_console && ui.customButtons_rowLog.style.display == "none") {
                        ui.customButtons_rowLog.style.display = "flex";
                    }
                    ui.customButtons_logArea.prepend(item);
                });
                ui.customButtons_logArea.firstChild.style.borderColor = "#b82792";
            },
            clear: function() {
                lines: [];
                while (ui.customButtons_logArea.firstChild) {
                    ui.customButtons_logArea.firstChild.remove()
                }
                ui.customButtons_rowLog.style.display = "none";
            }
        }

        ui.customButtons_rowLog = document.createElement("div");
        ui.customButtons_rowLog.setAttributes({
            className: "row mt-4 no-gutters",
            style: {
                display: "none"
            }
        });

        ui.customButtons_rowLogContainer = document.createElement("div");
        ui.customButtons_rowLogContainer.setAttributes({
            style: {
                width: "100%",
                display: "flex"
            }
        });
        ui.customButtons_rowLog.append(ui.customButtons_rowLogContainer);

        ui.customButtons_showLogButton = document.createElement("button");
        ui.customButtons_showLogButton.setAttributes({
            className: "mdi mdi-console theme--dark",
            style: {
                fontSize: "24px"
            }
        });

        ui.customButtons_showLogButton.addEventListener("mouseover", e=>{
            e.target.classList.remove("mdi-console");
            e.target.classList.add("mdi-close-circle");
        });

        ui.customButtons_showLogButton.addEventListener("mouseout", e=>{
            e.target.classList.remove("mdi-close-circle");
            e.target.classList.add("mdi-console");
        });

        ui.customButtons_showLogButton.addEventListener("click", e=>{
            Logger.clear();
        });

        ui.customButtons_rowLogContainer.append(ui.customButtons_showLogButton);

        ui.customButtons_logArea = document.createElement("div");
        ui.customButtons_logArea.setAttributes({
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

        ui.customButtons_rowLogContainer.append(ui.customButtons_logArea);

        ui.customButtons_rows.push(ui.customButtons_rowLog);

        // Attach each rows to the custom buttons container
        ui.customButtons_rows.forEach(row => {
            ui.customButtonsContainer.append(row);
        });

        return true;
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
    var chatLogHoverTooltips = function() {
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
            let chatItem = e.target.closest("div.v-list-item__content"), chatName, chatText;
            if (chatItem === null || chatLog_lastItem == chatItem) {
                return;
            }
            chatLog_lastItem = chatItem;

            let chatItemPopulate = function() {
                // Make sure the chat element is not a system message
                let chatItemIcon = chatItem.previousSibling.firstChild.firstChild;
                if (!chatItemIcon.classList.contains("mdi-account-tie") &&
                    !chatItemIcon.classList.contains("mdi-crown") &&
                    !chatItemIcon.classList.contains("mdi-account")) {
                    return;
                }

                chatName = chatItem.querySelector("div.v-list-item__title").textContent;
                chatText = chatItem.querySelector("div.v-list-item__subtitle.chat-text").textContent;

                ui.chatLog_customTooltip.innerHTML = chatName + ":&nbsp;";

                let matchedElements = [];

                let urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                let urlMatches = chatText.match(urlRegex);
                if (urlMatches) {
                    urlMatches.forEach(f => {
                        let a = document.createElement("a");
                        a.setAttributes({
                            href: f,
                            textContent: f,
                            target: "_blank",
                            rel: "noreferrer",
                            style: {display: "inline-block", fontSize: "14px"}
                        });
                        let i = document.createElement("i");
                        i.setAttributes({
                            classList: "mdi mdi-open-in-new",
                            style: {marginLeft: "2px", fontSize: "12px"}
                        });
                        a.append(i);
                        matchedElements.push(a);
                    });
                }

                let imgRegex = /(https?:\/\/\S+(?:png|jpe?g|gif|webp)\S*)/ig;
                let imgMatches = chatText.match(imgRegex);
                if (imgMatches) {
                    imgMatches.forEach(f => {
                        let img = document.createElement("img");
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

                        let a = document.createElement("a");
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

                let videoRegex = /(https?:\/\/\S+(?:webm|mp4)\S*)/ig;
                let videoMatches = chatText.match(videoRegex);
                if (videoMatches) {
                    videoMatches.forEach(f => {
                        let video = document.createElement("video");
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

                let youtubeRegex = /https?:\/\/(?:www\.)?youtu(?:\.be\/|be\.com\/watch\?v=)([\w_-]+)\S*/g;
                let youtubeMatches = chatText.matchAll(youtubeRegex);
                if (youtubeMatches) {
                    for (let match of youtubeMatches) {
                        let youtubeEmbed = document.createElement("iframe");
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

                let audioRegex = /(https?:\/\/\S+(?:mp3|ogg|m4a)\S*)/ig;
                let audioMatches = chatText.match(audioRegex);
                if (audioMatches) {
                    audioMatches.forEach(f => {
                        let audio = document.createElement("audio");
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
    }
    return "Are you sure you want to leave?";
}

function getSetting(setting_name, default_value) {
    let value = storeGet("setting_" + setting_name, default_value);
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

function storeGet(key, def="") {
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
    } catch(e) {
        if (typeof res === "undefined" || res === null) {
            return def;
        } else {
            return res;
        }
    }
};

function storeSet(key, value) {
    //value = JSON.stringify(value);
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
        let storedSettings = GM_listValues();
        for (let val in storedSettings) {
            GM_deleteValue(storedSettings[val]);
        }
    }
    scriptSetting.warn_on_exit = false;
    window.location.reload();
};

const CrossOrigin = (function() {
    try {
        return (typeof GM !== "undefined" && GM !== null ? GM.xmlHttpRequest : void 0) || GM_xmlhttpRequest;
    } catch (error) {
        return false;
    }
})();

// Helper function to set multiple element attributes at once
Element.prototype.setAttributes = function(attr) {var recursiveSet = function(at,set) {for(var prop in at){if(typeof at[prop] == 'object' && at[prop].dataset == null && at[prop][0] == null){recursiveSet(at[prop],set[prop]);}else {set[prop] = at[prop];}}};recursiveSet(attr,this);}
