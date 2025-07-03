const vscode = acquireVsCodeApi();
const { Marked } = globalThis.marked;
const { markedHighlight } = globalThis.markedHighlight;
const modelList = ['gemini-2.0-flash'];
let currentModel = modelList[0];

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
 * @type {HTMLSelectElement}
 */
const modelSelection = document.getElementById('model-selection')
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
/**
 * @type {HTMLDivElement}
 */
let currentAiMessageElement;
let currentAiMessageContent = "";

modelSelection.value = currentModel;
modelSelection.addEventListener("change", (e) => {
    currentModel = e.target.value;
});

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

function createAiMessage() {
    const aiMessageElement = document.createElement("div");
    aiMessageElement.className = 'p-2 rounded bg-secondary text-white text-start';
    aiMessageElement.style.width = 'fit-content';
    aiMessageElement.style.maxWidth = '75%';

    const aiMessageWrapperElement = document.createElement("div");
    aiMessageWrapperElement.className = 'd-flex flex-column align-items-start'
    aiMessageWrapperElement.appendChild(aiMessageElement);

    chatMessagesContainer.appendChild(aiMessageWrapperElement);

    return aiMessageElement;
}

function sendMessage() {
    const msg = msgInput.value ? msgInput.value.trim() : "";
    if (!msg) {
        return;
    }

    createUserMessage(msg);
    vscode.postMessage({
        type: 'send-message',
        data: {
            role: 'user',
            content: msg,
            model: currentModel
        }
    })
    msgInput.value = "";
    msgInput.style.height = baseHeight + "px";
}

window.addEventListener("message", (e) => {
    const message = e.data;

    switch (message.type) {
        case "init-ai-message":
            currentAiMessageElement = createAiMessage()
            break;
        case "ai-message-chunk":
            currentAiMessageContent += message.data;
            currentAiMessageElement.innerHTML = marked.parse(currentAiMessageContent);
            break;
        case "complete-ai-message":
            currentAiMessageElement = null;
            currentAiMessageContent = "";
            break;
    }
})

msgInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && !e.shiftKey) {
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