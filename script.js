// Convertit le markdown _italique_ en HTML <em>italique</em>
function markdownToHtml(md) {
  return md.replace(/_(.+?)_/g, "<em>$1</em>");
}

let blocks = [], lastHero = null;

// 1️⃣ Charge le bloc initial depuis blocks.json
fetch("blocks.json")
  .then(r => r.json())
  .then(b => {
    blocks = b;
    lastHero = b[0];
    renderHero(lastHero);
  })
  .catch(console.error);

document.getElementById("go").onclick = async () => {
  const promptInput = document.getElementById("prompt").value.trim();
  if (!promptInput) {
    return alert("Merci de saisir un prompt avant de personnaliser.");
  }

  // 2️⃣ Prépare les messages SYSTEM et USER avec exemple JSON
  const messages = [
    {
      role: "system",
      content:
        "Vous êtes un assistant expert en marketing B2B et copywriting. " +
        "Vous devez répondre EXACTEMENT par un unique objet JSON contenant " +
        'deux clés : "title" et "description". Rien d’autre.'
    },
    {
      role: "user",
      content: [
        "Exemple de structure attendue :",
        "```json",
        "{",
        '  "title": "Exemple de titre",',
        '  "description": "_Exemple de description italique_"',
        "}",
        "```",
        "",
        `Maintenant personnalise ce bloc pour la requête suivante : « ${promptInput} ».`,
        `Bloc initial : ${JSON.stringify(blocks[0], null, 2)}.`
      ].join("\n")
    }
  ];

  // 3️⃣ Crée le payload pour /chat/completions
  const payload = {
    model: "google/gemma-3n-e4b",
    messages,
    temperature: 0.7,
    max_tokens: 300,
    n: 1
  };

  // 4️⃣ Appelle l’API LM Studio
  let responseText = "";
  try {
    const res = await fetch("http://localhost:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    responseText = data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("Erreur fetch Chat API :", e);
    return alert("Erreur lors de l’appel au modèle.");
  }

  // 5️⃣ Extrait le JSON de la réponse
  const match = responseText.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn("Aucun JSON trouvé dans :", responseText);
    return alert("Le modèle n'a pas renvoyé de JSON valide. Voir console.");
  }

  let modifiedHero;
  try {
    modifiedHero = JSON.parse(match[0]);
  } catch (e) {
    console.error("JSON invalide reçu :", match[0], e);
    return alert("JSON invalide. Voir console.");
  }

  // 6️⃣ Vérifie la présence des clés
  if (!modifiedHero.title || !modifiedHero.description) {
    console.warn("JSON sans title/description :", modifiedHero);
    return alert("JSON incomplet reçu. Voir console.");
  }

  // 7️⃣ Fusionne et affiche
  lastHero = { ...blocks[0], ...modifiedHero };
  renderHero(lastHero);
};

// Fonction utilitaire pour afficher le bloc Hero
function renderHero(hero) {
  document.getElementById("content").innerHTML = `
    <section class="hero" style="text-align:center; padding:4rem 2rem;">
      <h1>${hero.title}</h1>
      ${markdownToHtml(hero.description)}
    </section>
  `;
}
