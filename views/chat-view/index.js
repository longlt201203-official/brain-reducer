const vscode = acquireVsCodeApi();
const { Marked } = globalThis.marked;
const { markedHighlight } = globalThis.markedHighlight;
const modelList = [
  "gemini-2.0-flash",
  "claude-sonnet-4-20250514",
  "claude-3-5-sonnet-latest",
  "claude-3-7-sonnet-latest",
];
let currentModel = modelList[0];
/**
 * @type {File[]}
 */
let loadedImages = [];

const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

/**
 * @type {HTMLSelectElement}
 */
const modelSelection = document.getElementById("model-selection");
/**
 * @type {HTMLTextAreaElement}
 */
const msgInput = document.getElementById("msg-input");
/**
 * @type {HTMLInputElement}
 */
const searchInternetCheckbox = document.getElementById(
  "search-internet-checkbox"
);
/**
 * @type {HTMLInputElement}
 */
const filesInput = document.getElementById("files-input");
/**
 * @type {HTMLLabelElement}
 */
const filesInputLabel = document.getElementById("files-input-label");
/**
 * @type {HTMLButtonElement}
 */
const sendBth = document.getElementById("send-btn");
/**
 * @type {HTMLDivElement}
 */
const chatMessagesContainer = document.getElementById(
  "chat-messages-container"
);
/**
 * @type {HTMLDivElement}
 */
const imagesPreviewContainer = document.getElementById(
  "images-preview-container"
);
/**
 * @type {HTMLDivElement}
 */
let currentAiMessageElement;
let currentAiMessageContent = "";

// modelSelection.style.display = "none";
modelSelection.innerHTML = modelList
  .map((model) => `<option value="${model}">${model}</option>`)
  .join();
modelSelection.value = currentModel;
modelSelection.addEventListener("change", (e) => {
  currentModel = e.target.value;
  vscode.postMessage({
    type: "set-model",
    data: currentModel,
  });
});

const baseHeight = parseInt(getComputedStyle(msgInput).height);
const msgInputMaxRows = 5;
const msgInputPaddingY = 6;
const msgInputLineHeight = parseInt(getComputedStyle(msgInput).lineHeight);
const msgInputMaxHeight =
  msgInputLineHeight * msgInputMaxRows + msgInputPaddingY * 2;

function createUserMessage(content, images) {
  const userMessageElement = document.createElement("div");
  userMessageElement.className = "p-2 rounded text-start user-msg";
  userMessageElement.style.width = "fit-content";
  userMessageElement.style.maxWidth = "75%";
  userMessageElement.innerHTML = content
    .split("\n")
    .map((line) => `<p>${line}</p>`);

  const imagesContainer = document.createElement("div");
  imagesContainer.className = "d-flex flex-row";
  imagesContainer.style.columnGap = "8px";
  images.forEach((image) => {
    const imgElement = document.createElement("img");
    imgElement.className = "rounded";
    imgElement.src = image;
    imgElement.style.width = "40px";
    imgElement.style.height = "40px";
    imgElement.style.objectFit = "cover";

    imagesContainer.appendChild(imgElement);
  });

  const userMessageWrapperElement = document.createElement("div");
  userMessageWrapperElement.className = "d-flex flex-column align-items-end";
  userMessageWrapperElement.style.rowGap = "4px";
  userMessageWrapperElement.appendChild(userMessageElement);
  userMessageWrapperElement.appendChild(imagesContainer);

  chatMessagesContainer.appendChild(userMessageWrapperElement);
}

function createAiMessage(content = "") {
  const aiMessageHeadingElement = document.createElement("div");
  aiMessageHeadingElement.className = "d-flex flex-row ai-msg-heading";
  aiMessageHeadingElement.style.columnGap = "8px";

  const aiNameWrapperElement = document.createElement("div");
  aiNameWrapperElement.className = "d-flex flex-column";
  aiNameWrapperElement.style.rowGap = "4px";

  const aiNameElement = document.createElement("h5");
  aiNameElement.innerText = "AI Assistant";
  const aiDescriptionElement = document.createElement("p");

  aiNameWrapperElement.appendChild(aiNameElement);
  aiNameWrapperElement.appendChild(aiDescriptionElement);

  aiMessageHeadingElement.appendChild(aiNameWrapperElement);

  const aiMessageElement = document.createElement("div");
  aiMessageElement.className = "rounded text-start ai-msg";
  aiMessageElement.style.width = "fit-content";
  aiMessageElement.style.maxWidth = "75%";
  aiMessageElement.innerHTML = content ? marked.parse(content) : "Loading...";

  const aiMessageWrapperElement = document.createElement("div");
  aiMessageWrapperElement.className = "d-flex flex-column align-items-start";
  aiMessageWrapperElement.style.rowGap = "4px";
  aiMessageWrapperElement.appendChild(aiMessageHeadingElement);
  aiMessageWrapperElement.appendChild(aiMessageElement);

  chatMessagesContainer.appendChild(aiMessageWrapperElement);

  return aiMessageElement;
}

async function getBase64Images(files) {
  const base64Images = [];
  for (const file of files) {
    const reader = new FileReader();
    const base64Promise = new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    base64Images.push(await base64Promise);
  }
  return base64Images;
}

function disableAllControls() {
  modelSelection.disabled = true;
  modelSelection.classList.add("disabled");

  msgInput.disabled = true;
  msgInput.classList.add("disabled");

  filesInput.disabled = true;
  filesInputLabel.classList.add("disabled");

  sendBth.disabled = true;
  sendBth.classList.add("disabled");
}

function enableAllControls() {
  modelSelection.disabled = false;
  modelSelection.classList.remove("disabled");

  msgInput.disabled = false;
  msgInput.classList.remove("disabled");

  filesInput.disabled = false;
  filesInputLabel.classList.remove("disabled");

  sendBth.disabled = false;
  sendBth.classList.remove("disabled");
}

async function sendMessage() {
  const msg = msgInput.value ? msgInput.value.trim() : "";
  if (!msg && loadedImages.length === 0) {
    return;
  }

  disableAllControls();
  const base64Images = await getBase64Images(loadedImages);

  createUserMessage(msg, base64Images);
  const msgData = {
    role: "user",
    content: msg,
    model: currentModel,
    images: base64Images,
  };
  vscode.postMessage({
    type: "send-message",
    data: msgData,
    searchInternet: searchInternetCheckbox.checked,
  });
  msgInput.value = "";
  msgInput.style.height = baseHeight + "px";
  loadedImages = [];
  loadPreviewImages();
}

function loadChatSession(chatSession = []) {
  chatMessagesContainer.innerHTML = "";
  chatSession.forEach((message) => {
    if (message.role == "user") {
      createUserMessage(message.content, message.images);
    } else if (message.role == "assistant") {
      createAiMessage(message.content);
    }
  });
}

function loadPreviewImages() {
  imagesPreviewContainer.innerHTML = "";

  loadedImages.forEach((f, fIndex) => {
    const url = URL.createObjectURL(f);

    const imgElementWrapper = document.createElement("div");
    imgElementWrapper.className = "position-relative";

    const imgElement = document.createElement("img");
    imgElement.className = "rounded";
    imgElement.src = url;
    imgElement.style.width = "40px";
    imgElement.style.height = "40px";
    imgElement.style.objectFit = "cover";

    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-danger position-absolute rounded-circle";
    removeButton.style.width = "16px";
    removeButton.style.height = "16px";
    removeButton.style.padding = "0";
    removeButton.style.fontSize = "12px";
    removeButton.style.lineHeight = "14px";
    removeButton.style.top = "-6px";
    removeButton.style.right = "-6px";
    removeButton.innerHTML = "&times;";
    removeButton.addEventListener("click", () => {
      loadedImages.splice(fIndex, 1);
      loadPreviewImages();
      URL.revokeObjectURL(url);
    });

    imgElementWrapper.appendChild(imgElement);
    imgElementWrapper.appendChild(removeButton);

    imagesPreviewContainer.appendChild(imgElementWrapper);
  });
}

window.addEventListener("message", (e) => {
  const message = e.data;

  switch (message.type) {
    case "init-ai-message":
      currentAiMessageElement = createAiMessage();
      break;
    case "ai-message-chunk":
      currentAiMessageContent += message.data;
      currentAiMessageElement.innerHTML = marked.parse(currentAiMessageContent);
      break;
    case "ai-message-error":
      currentAiMessageElement.innerHTML = `<span class="text-danger">${message.data}</span>`;
      currentAiMessageElement = null;
      enableAllControls();
      break;
    case "complete-ai-message":
      currentAiMessageElement = null;
      currentAiMessageContent = "";
      enableAllControls();
      break;
    case "load-chat-session":
      loadChatSession(message.data);
      break;
    case "load-model":
      currentModel = message.data;
      modelSelection.value = currentModel;
      break;
  }
});

msgInput.addEventListener("paste", (e) => {
  let isPrevent = false;
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  for (const index in items) {
    const item = items[index];
    if (item.kind === "file" && item.type.startsWith("image/")) {
      isPrevent = true;
      const file = item.getAsFile();
      if (file) {
        loadedImages.push(file);
        loadPreviewImages();
      }
    }
  }

  if (isPrevent) {
    e.preventDefault();
  }
});

msgInput.addEventListener("input", (e) => {
  if (msgInput.value) {
    msgInput.style.height = "auto";
    msgInput.style.height =
      Math.min(msgInput.scrollHeight, msgInputMaxHeight) + "px";
  } else {
    msgInput.style.height = baseHeight + "px";
  }
});

msgInput.addEventListener("keydown", (e) => {
  if (e.key == "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
    return;
  }
  msgInput.style.height = "auto";
  msgInput.style.height =
    Math.min(msgInput.scrollHeight, msgInputMaxHeight) + "px";
});

filesInput.addEventListener("change", async (e) => {
  loadedImages.push(...filesInput.files);
  loadPreviewImages();
});

sendBth.addEventListener("click", () => {
  sendMessage();
});
