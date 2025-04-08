const link = document.getElementById("link");
const submitBtn = document.getElementById("submitBtn");
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

submitBtn.addEventListener("click", () => {
  resetFieldStyles();
  statusMessage.textContent = "";
  statusMessage.className = "";
  
  const newLink = link.value.trim();
  let hasError = false;
  
  if (!newLink) {
    link.classList.add("error-field");
    hasError = true;
  }
  
  if (hasError) {
    statusMessage.textContent = "Please enter a YouTube URL";
    statusMessage.classList.add("error");
    return;
  }

  if (!isValidYoutubeUrl(newLink)) {
    link.classList.add("error-field");
    statusMessage.textContent = "Invalid YouTube URL";
    statusMessage.classList.add("error");
    return;
  }
  
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
