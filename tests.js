
//Observe first 100 messages
let observer = new MutationObserver(
mutationRecords => {
  console.log(mutationRecords);
}
);

node=document.querySelector("#app > div > div.container.pa-0.pa-lg-2.container--fluid > main > div > div > div.row.no-gutters > div:nth-child(2) > div > div > div > div > div.v-window-item.v-window-item--active > div > div.chat");
observer.observe(node, {subtree:true, childList:true});



////////////////////////////////
//Send 50 messages
for (let i=0; i<=50; i++) {
document.querySelector("#input-181").value=i;
document.querySelector("#input-181").dispatchEvent(new Event("input"));

document.querySelector("#app > div > div.container.pa-0.pa-lg-2.container--fluid > main > div > div > div.row.no-gutters > div:nth-child(2) > div > div > div > div > div.v-window-item.v-window-item--active > div > div:nth-child(2) > div > div > div > div.v-input__append-inner > div > button").click();
}


//////////////////////////////////////
//Observe messages past first 100
let chatobserver = new MutationObserver( mutations => {
    for(let mutation of mutations) {
        for(let node of mutation.addedNodes) {
            document.querySelector("div.chat > div.v-list").childNodes.forEach(
                item=> {
                    let message=item.lastChild.lastChild.lastChild;
		newdiv = document.createElement("div");
		newdiv.className = "v-list-item__subtitle black--text chat-text"
                    newdiv.innerHTML = message.textContent.replaceAll('&', '&amp;')
                        .replaceAll('<', '&lt;')
                        .replaceAll('>', '&gt;')
                        .replaceAll('"', '&quot;')
                        .replaceAll("'", '&#039;')
                        .replace(/\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim, '<a href="$&" target="_blank" rel="noreferrer">$&</a>')
                        .replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="http://$2" target="_blank">$2</a>');
                  message.replaceWith(newdiv)
                }
            )
        }
    }
});

node=document.querySelector("#app > div > div.container.pa-0.pa-lg-2.container--fluid > main > div > div > div.row.no-gutters > div:nth-child(2) > div > div > div > div > div.v-window-item.v-window-item--active > div > div.chat > div > div:last-child");
chatobserver.observe(node, {subtree:true, childList:true});

////////
window.Howler._howls.forEach( howl=> {if (howl._loop) {console.log(howl._src)}})
