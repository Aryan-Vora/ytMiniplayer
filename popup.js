const link = document.getElementById("link");
const createMiniPlayerBtn = document.getElementById("createMiniPlayerBtn");
const createWindowBtn = document.getElementById("createWindowBtn");
const statusMessage = document.getElementById("statusMessage");

chrome.storage.sync.get("link", (data) => {
  link.value = data.link || "";
});

function resetFieldStyles() {
  link.classList.remove("error-field");
}

function isValidYoutubeUrl(url) {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return regex.test(url);
}

function validateYoutubeUrl() {
  resetFieldStyles();
  statusMessage.textContent = "";
  statusMessage.className = "";
  
  const newLink = link.value.trim();
  
  if (!newLink) {
    link.classList.add("error-field");
    statusMessage.textContent = "Please enter a YouTube URL";
    statusMessage.classList.add("error");
    return null;
  }

  if (!isValidYoutubeUrl(newLink)) {
    link.classList.add("error-field");
    statusMessage.textContent = "Invalid YouTube URL";
    statusMessage.classList.add("error");
    return null;
  }
  
  return newLink;
}

createMiniPlayerBtn.addEventListener("click", () => {
  const newLink = validateYoutubeUrl();
  if (!newLink) return;
  
  chrome.storage.sync.set({ 
    link: newLink,
  }, () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "createMiniPlayer", 
        youtubeUrl: newLink
      });
      
      statusMessage.textContent = "Mini-player created!";
      statusMessage.classList.add("success");
      
      setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.className = "";
      }, 2000);
    });
  });
});

createWindowBtn.addEventListener("click", () => {
  const newLink = validateYoutubeUrl();
  if (!newLink) return;
  
  chrome.storage.sync.set({ 
    link: newLink,
  }, () => {
    const videoId = extractVideoId(newLink);
    if (videoId) {
      //autoplay=1 parameter doesn't work - will need to figure out in future version
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
      chrome.windows.create({
        url: youtubeEmbedUrl,
        type: 'popup',
        width: 640,
        height: 480
      });
      
      statusMessage.textContent = "Window created!";
      statusMessage.classList.add("success");
      
      setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.className = "";
      }, 2000);
    }
  });
});

function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
