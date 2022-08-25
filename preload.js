// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { shell } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})


// assuming $ is jQuery
document.addEventListener('click', function (event) {
  const target = event.target;
  if (target.nodeName === 'A') {
    event.preventDefault();
    shell.openExternal(target.getAttribute('href'));
  }

});

document.addEventListener('loadedmetadata', function (event) {
  console.log(event);
  const target = event.target;
  if (target.nodeName === 'VIDEO') {
    event.preventDefault();
    target.currentTime = target.getAttribute('data-start');
  }

});
