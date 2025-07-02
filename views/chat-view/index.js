const marked = new Marked(
    markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
);

/**
 * @type {HTMLTextAreaElement}
 */
const msgInput = document.getElementById('msg-input');
/**
 * @type {HTMLButtonElement}
 */
const sendBth = document.getElementById('send-btn');
/**
 * @type {HTMLDivElement}
 */
const chatMessagesContainer = document.getElementById('chat-messages-container');

const baseHeight = parseInt(getComputedStyle(msgInput).height);
const msgInputMaxRows = 5;
const msgInputPaddingY = 6;
const msgInputLineHeight = parseInt(getComputedStyle(msgInput).lineHeight);
const msgInputMaxHeight = msgInputLineHeight * msgInputMaxRows + (msgInputPaddingY * 2);

function createUserMessage(content) {
    const userMessageElement = document.createElement("div");
    userMessageElement.className = 'p-2 rounded bg-primary text-white text-end';
    userMessageElement.style.width = 'fit-content';
    userMessageElement.style.maxWidth = '75%';
    userMessageElement.innerHTML = marked.parse(content);

    const userMessageWrapperElement = document.createElement("div");
    userMessageWrapperElement.className = 'd-flex flex-column align-items-end'
    userMessageWrapperElement.appendChild(userMessageElement);

    chatMessagesContainer.appendChild(userMessageWrapperElement);
}

function sendMessage() {
    const msg = msgInput.value ? msgInput.value.trim() : "";
    if (!msg) {
        return;
    }

    createUserMessage(msg);
    msgInput.value = "";
    msgInput.style.height = baseHeight + "px";
}

msgInput.addEventListener("keyup", (e) => {
    if (e.shiftKey && e.key == "Enter") {
        e.preventDefault();
        sendMessage();
        return;
    }
    msgInput.style.height = "auto";
    msgInput.style.height = Math.min(msgInput.scrollHeight, msgInputMaxHeight) + "px";
});

sendBth.addEventListener('click', () => {
    sendMessage();
});