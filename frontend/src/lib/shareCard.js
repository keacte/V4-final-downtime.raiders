import html2canvas from "html2canvas";

// Capture a DOM node to a PNG blob using html2canvas.
async function captureBlob(node) {
  const canvas = await html2canvas(node, {
    backgroundColor: "#07021a",
    scale: 2,
    useCORS: true,
    logging: false,
    // Extra breathing room around the card in the final image.
    x: -24,
    y: -24,
    width: node.offsetWidth + 48,
    height: node.offsetHeight + 48,
    // html2canvas can choke on modern color funcs; we only use hex/rgba so we're good.
  });
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareKillCard(node, { filename = "downtime-raiders-kill.png", title = "downtime.raiders — got pipebombed!", text = "I got pipebombed in downtime.raiders! o7 #npsi" } = {}) {
  if (!node) return { ok: false, reason: "no-node" };

  // Temporarily mark the card as "capturing" so export-only branding shows.
  node.classList.add("is-capturing");
  let blob;
  try {
    blob = await captureBlob(node);
  } finally {
    node.classList.remove("is-capturing");
  }
  if (!blob) return { ok: false, reason: "no-blob" };

  // Try native Web Share API with a file first (mobile + modern desktop).
  try {
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return { ok: true, method: "share" };
    }
  } catch (err) {
    // User cancelled or share failed — fall through to download.
    if (err && err.name === "AbortError") return { ok: true, method: "cancelled" };
  }

  // Fallback: download the PNG.
  downloadBlob(blob, filename);
  return { ok: true, method: "download" };
}
