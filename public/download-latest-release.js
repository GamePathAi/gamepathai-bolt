/**
 * Gera um botão de download da última release do GitHub, pegando o asset desejado (.exe, .dmg, .AppImage, etc)
 * Usage: 
 *   1. Inclua este script no seu HTML.
 *   2. Adicione um elemento <div id="download-button"></div> onde o botão deve aparecer.
 */

const repoOwner = "GamePathAi";
const repoName = "gamepathai-bolt";
const assetRegex = /\.exe$/; // Altere conforme o SO desejado (.dmg, .AppImage, etc)

(async function() {
  const releasesApi = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
  const res = await fetch(releasesApi);
  const data = await res.json();

  // Procura pelo arquivo desejado
  const asset = (data.assets || []).find(a => assetRegex.test(a.name));
  const container = document.getElementById('download-button');

  if (asset && container) {
    const link = document.createElement('a');
    link.href = asset.browser_download_url;
    link.className = 'btn btn-primary';
    link.innerText = 'Baixar para Windows (versão mais recente)';
    link.setAttribute('download', asset.name);
    container.appendChild(link);
  } else if(container) {
    container.innerHTML = "Arquivo não encontrado!";
  }
})();