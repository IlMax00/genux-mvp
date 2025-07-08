let blocks = [];
fetch("blocks.json")
  .then(r => r.json())
  .then(b => blocks = b);

document.getElementById("go").onclick = async () => {
  const prompt = document.getElementById("prompt").value;
  const system = "Vous êtes un assistant qui personnalise des blocs JSON de landing page.";
  const user = `L'utilisateur souhaite : « ${prompt} ».\n` +
               `Blocs (JSON) :\n${JSON.stringify(blocks, null,2)}\n` +
               `Modifiez seulement title/body/items et renvoyez un JSON.`;
  const payload = { prompt: system + "\n\n" + user, max_tokens:512, temperature:0.7 };

  const resp = await fetch("http://localhost:11434/v1/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await resp.json();
  const text = data.choices?.[0]?.text || "{}";
  let modified = {};
  try { modified = JSON.parse(text); } catch {}

  const merged = blocks.map(b => ({ ...b, ...modified[b.id] }));
  const container = document.getElementById("content");
  container.innerHTML = "";
  merged.forEach(b => {
    const sec = document.createElement("section");
    sec.innerHTML = `<h2>${b.title}</h2><p>${b.body||""}</p>`;
    if (b.items) {
      const ul = document.createElement("ul");
      b.items.forEach(i => ul.innerHTML += `<li>${i}</li>`);
      sec.appendChild(ul);
    }
    container.appendChild(sec);
  });
};
