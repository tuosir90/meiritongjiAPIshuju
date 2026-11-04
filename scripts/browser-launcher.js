const fs = require('fs');
const path = require('path');

const SYSTEM_BROWSER_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function exists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (_) {
    return false;
  }
}

function addPlaywrightChromiumCandidates(root, candidates) {
  if (!root || !fs.existsSync(root)) return;
  const entries = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
    .map((entry) => {
      const dir = path.join(root, entry.name);
      let mtimeMs = 0;
      try {
        mtimeMs = fs.statSync(dir).mtimeMs;
      } catch (_) {
        mtimeMs = 0;
      }
      return { dir, mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const entry of entries) {
    candidates.push(path.join(entry.dir, 'chrome-win64', 'chrome.exe'));
    candidates.push(path.join(entry.dir, 'chrome-win', 'chrome.exe'));
  }
}

function getReusableChromiumExecutables() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) candidates.push(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE);
  if (process.env.CHROME_EXECUTABLE) candidates.push(process.env.CHROME_EXECUTABLE);

  if (process.env.PLAYWRIGHT_BROWSERS_PATH && process.env.PLAYWRIGHT_BROWSERS_PATH !== '0') {
    addPlaywrightChromiumCandidates(process.env.PLAYWRIGHT_BROWSERS_PATH, candidates);
  }
  if (process.env.LOCALAPPDATA) {
    addPlaywrightChromiumCandidates(path.join(process.env.LOCALAPPDATA, 'ms-playwright'), candidates);
  }
  candidates.push(...SYSTEM_BROWSER_CANDIDATES);

  const seen = new Set();
  return candidates
    .filter(Boolean)
    .map((candidate) => path.resolve(candidate))
    .filter((candidate) => {
      const key = candidate.toLowerCase();
      if (seen.has(key) || !exists(candidate)) return false;
      seen.add(key);
      return true;
    });
}

async function launchChromium(chromium, options = {}) {
  const candidates = getReusableChromiumExecutables();
  for (const executablePath of candidates) {
    try {
      console.log(`使用已安装浏览器启动 Playwright: ${executablePath}`);
      return await chromium.launch({ ...options, executablePath });
    } catch (error) {
      console.log(`已安装浏览器启动失败，继续尝试下一个: ${executablePath} (${error.name || 'Error'})`);
    }
  }

  console.log('未找到可复用 Chromium/Chrome/Edge，尝试 Playwright 默认浏览器。');
  return chromium.launch(options);
}

module.exports = {
  getReusableChromiumExecutables,
  launchChromium,
};
