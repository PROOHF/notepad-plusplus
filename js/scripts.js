const ITEMS = [
    {
        id: "add-text-start", title: "Add text to the start of each line", tags: "prepend prefix regex replace",
        body: ["Press `Ctrl+H`, tick **Regular expressions**.",
            "Find what: `^` · Replace with: your text (e.g. `test`) · hit **Replace All**."]
    },
    {
        id: "add-text-end", title: "Add text to the end of each line", tags: "append suffix regex replace",
        body: ["Press `Ctrl+H`, tick **Regular expressions**.",
            "Find what: `$` · Replace with: your text (e.g. `test`) · hit **Replace All**."]
    },
    {
        id: "remove-last-chars", title: "Remove the last X characters on every line", tags: "delete trim regex",
        body: ["Press `Ctrl+H`, tick **Regular expressions**.",
            "Find what: `.{13}$` · Replace with: nothing. Change `13` to the number of characters to remove."]
    },
    {
        id: "multiple-cursors", title: "Multiple cursors", tags: "multi editing multi-select",
        body: ["Go to **Settings → Preferences → Editing** and enable **Multi-Editing**.",
            "Then hold `Ctrl` and click or select to add more cursors/regions."]
    },
    {
        id: "column-mode", title: "Column mode editing", tags: "block rectangular select",
        body: ["`Alt + mouse drag` or `Alt+Shift+Arrow keys`"]
    },
    {
        id: "move-line", title: "Move line up/down", tags: "shift reorder",
        body: ["`Ctrl+Shift+Up` / `Ctrl+Shift+Down`"]
    }
];

const $ = s => document.querySelector(s);
const list = $("#list"), q = $("#q"), toast = $("#toast");
const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const fmt = s => esc(s)
    .replace(/`([^`]+)`/g, '<code class="copy" title="Click to copy">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

// Render
list.innerHTML = ITEMS.map(i => `
  <article id="${i.id}">
    <h2><a href="#${i.id}">${esc(i.title)}</a>
      <button class="anchor" data-id="${i.id}" title="Copy link" aria-label="Copy link to ${esc(i.title)}">🔗</button></h2>
    ${i.body.map(p => `<p>${fmt(p)}</p>`).join("")}
  </article>`).join("");
const cards = [...list.querySelectorAll("article")];

// Toast + copy
let tt;
function say(msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), 1500); }
async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
        const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t);
        t.select(); try { document.execCommand("copy"); } catch (_) { } t.remove();
    }
    say(msg);
}
list.addEventListener("click", e => {
    const b = e.target.closest(".anchor");
    if (b) copy(location.href.split("#")[0] + "#" + b.dataset.id, "Link copied");
    const c = e.target.closest("code.copy");
    if (c) copy(c.textContent, "Copied");
});

// Search / filter with highlight
const original = cards.map(c => c.innerHTML);
function filter() {
    const term = q.value.trim().toLowerCase();
    let shown = 0;
    cards.forEach((c, i) => {
        const it = ITEMS[i];
        const hay = (it.title + " " + it.tags + " " + it.body.join(" ")).toLowerCase();
        const ok = term.split(/\s+/).every(w => hay.includes(w));
        c.hidden = !ok;
        c.innerHTML = original[i];
        if (ok) shown++;
        if (ok && term) highlight(c, term.split(/\s+/));
    });
    $("#empty").hidden = shown > 0;
    $("#hint").textContent = term ? "Esc" : "Ctrl K";
    $("#count").textContent = term ? shown + " of " + ITEMS.length + " shown" : "";
}
function highlight(root, words) {
    const re = new RegExp("(" + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
        if (!re.test(n.nodeValue)) return; re.lastIndex = 0;
        const span = document.createElement("span");
        span.innerHTML = esc(n.nodeValue).replace(re, "<mark>$1</mark>");
        n.replaceWith(span);
    });
}
q.addEventListener("input", filter);
document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); q.focus(); q.select(); }
    if (e.key === "Escape" && q.value) { q.value = ""; filter(); }
});

// Deep links: highlight the targeted card
function flash() {
    const id = decodeURIComponent(location.hash.slice(1));
    cards.forEach(c => c.classList.toggle("flash", c.id === id));
    const el = id && document.getElementById(id);
    if (el) { if (el.hidden) { q.value = ""; filter(); } el.scrollIntoView({ block: "start" }); }
}
window.addEventListener("hashchange", flash);
flash();

// Theme: starts from the system setting until the user picks one
const root = document.documentElement, sw = $("#theme");
function setTheme(t, save) {
    root.dataset.theme = t;
    sw.setAttribute("aria-checked", t === "dark");
    if (save) { try { localStorage.setItem("theme", t); } catch (e) { } }
}
let saved = null;
try { saved = localStorage.getItem("theme"); } catch (e) { }
setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), false);
sw.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
