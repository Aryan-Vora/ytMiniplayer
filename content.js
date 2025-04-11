function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function createMiniPlayer(youtubeUrl) {
  const existingPlayer = document.getElementById('yt-mini-player-container');
  if (existingPlayer) {
    existingPlayer.remove();
  }

  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) return;

  const container = document.createElement('div');
  container.id = 'yt-mini-player-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '2147483647';
  container.style.width = '320px';
  container.style.height = '240px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.background = '#000';
  container.style.border = '2px solid #888';
  container.style.borderRadius = '4px';
  container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  container.style.overflow = 'hidden';

  const header = document.createElement('div');
  header.id = 'yt-mini-player-header';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.width = '100%';
  header.style.height = '30px';
  header.style.background = '#333';
  header.style.cursor = 'move';

  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'yt-mini-player-resize';
  resizeHandle.innerHTML = '&#8596;';
  resizeHandle.title = 'Resize';
  resizeHandle.style.color = 'white';
  resizeHandle.style.fontSize = '16px';
  resizeHandle.style.cursor = 'se-resize';
  resizeHandle.style.width = '30px';
  resizeHandle.style.height = '30px';
  resizeHandle.style.display = 'flex';
  resizeHandle.style.justifyContent = 'center';
  resizeHandle.style.alignItems = 'center';

  const dragIndicator = document.createElement('div');
  dragIndicator.id = 'yt-mini-player-drag-indicator';
  dragIndicator.innerHTML = '&#8801;';
  dragIndicator.style.cursor = 'move';
  dragIndicator.style.flex = '1';
  dragIndicator.style.textAlign = 'center';
  dragIndicator.style.color = 'white';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'yt-mini-player-close';
  closeBtn.innerHTML = '×';
  closeBtn.title = 'Close';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'white';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.width = '30px';
  closeBtn.style.height = '30px';
  closeBtn.style.display = 'flex';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.alignItems = 'center';

  header.appendChild(resizeHandle);
  header.appendChild(dragIndicator);
  header.appendChild(closeBtn);

  const iframe = document.createElement('iframe');
  iframe.id = 'yt-mini-player-iframe';
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.style.width = '100%';
  iframe.style.height = 'calc(100% - 30px)';
  iframe.style.border = 'none';
  iframe.style.display = 'block';

  container.appendChild(header);
  container.appendChild(iframe);

  document.body.appendChild(container);

  makeDraggable(container, header);
  makeResizable(container, resizeHandle);

  closeBtn.addEventListener('click', () => {
    // pause then remove because the iframe is not removed immediately
    const iframe = document.getElementById('yt-mini-player-iframe');
    if (iframe) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'pauseVideo',
        args: []
      }), '*');

      // If pausing takes longer than 200ms you've got other problems
      setTimeout(() => {
        container.remove();
      }, 200);
    } else {
      container.remove();
    }
  });
}
function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    let newTop = element.offsetTop - pos2;
    let newLeft = element.offsetLeft - pos1;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;

    if (newTop < 0) newTop = 0;
    if (newLeft < 0) newLeft = 0;
    if (newTop + elementHeight > windowHeight) newTop = windowHeight - elementHeight;
    if (newLeft + elementWidth > windowWidth) newLeft = windowWidth - elementWidth;

    element.style.top = newTop + "px";
    element.style.left = newLeft + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function makeResizable(element, handle) {
  let startWidth, startHeight, startTop, startLeft;

  handle.onmousedown = resizeMouseDown;

  function resizeMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    startTop = element.offsetTop;
    startLeft = element.offsetLeft;

    const bottomRightX = startLeft + startWidth;
    const bottomRightY = startTop + startHeight;

    document.onmouseup = stopResize;
    document.onmousemove = function (e) { resizeElement(e, bottomRightX, bottomRightY); };
  }

  function resizeElement(e, fixedX, fixedY) {
    e.preventDefault();

    const newLeft = Math.min(e.clientX, fixedX - 200);
    const newTop = Math.min(e.clientY, fixedY - 150);

    const newWidth = fixedX - newLeft;
    const newHeight = fixedY - newTop;

    if (newLeft >= 0 && newTop >= 0) {
      element.style.left = newLeft + 'px';
      element.style.top = newTop + 'px';
      element.style.width = newWidth + 'px';
      element.style.height = newHeight + 'px';
    }
  }

  function stopResize() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "createMiniPlayer") {
    createMiniPlayer(message.youtubeUrl);
  }
});
