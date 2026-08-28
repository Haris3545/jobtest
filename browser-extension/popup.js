const baseUrlInput = document.getElementById("baseUrl");
const statusEl = document.getElementById("status");

chrome.storage.local.get(["baseUrl"], ({ baseUrl }) => {
  if (baseUrl) baseUrlInput.value = baseUrl;
});

baseUrlInput.addEventListener("change", () => {
  chrome.storage.local.set({ baseUrl: baseUrlInput.value.trim().replace(/\/$/, "") });
});

document.getElementById("send").addEventListener("click", async () => {
  const baseUrl = baseUrlInput.value.trim().replace(/\/$/, "");
  if (!baseUrl) {
    statusEl.textContent = "Set your dashboard URL first.";
    return;
  }
  chrome.storage.local.set({ baseUrl });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    statusEl.textContent = "Could not read the current tab URL.";
    return;
  }

  statusEl.textContent = "Scanning…";
  try {
    const scanRes = await fetch(`${baseUrl}/api/jobs/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tab.url }),
    });
    const scanned = await scanRes.json();

    const job = {
      url: tab.url,
      title: scanned.title || tab.title || "Untitled role",
      company: scanned.company || "Unknown",
      location: scanned.location,
      source: scanned.source,
      description: scanned.description,
      salary: scanned.salary,
      openDate: scanned.openDate,
      closingDate: scanned.closingDate,
    };

    const createRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    if (!createRes.ok) throw new Error(await createRes.text());
    statusEl.textContent = "✅ Added to your tracker.";
  } catch (err) {
    statusEl.textContent = `Failed: ${err.message}`;
  }
});
