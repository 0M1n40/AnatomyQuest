# 🩺 NurseHub

Plataforma de estudo gamificado para Enfermagem que roda **só no navegador** (GitHub Pages).
React 19 + Vite + Tailwind CSS v4. Mascote: **Doutor Ossinho** 🦴.

## Matérias
| Matéria | Questões | Discursivas | Da prova/quiz/ED | Prática |
|---|---|---|---|---|
| 🦴 Anatomia | 134 | 16 | — | Atlas: 6 figuras, 71 estruturas |
| 🔬 Histologia | 139 | 49 | 66 | Laminário: 22 lâminas, 50 estruturas |
| 🛡️ Imunologia | 129 | 30 | 57 | Esquemas: 11 imagens, 85 estruturas |

## Recursos de TODA matéria
- **🧠 Mapa mental** com imagens, busca, "Treinar" por tema e impressão
- **📝 Simulado de prova**: objetivas (inclui V/F) + discursivas + identificação por imagem, tempo total, nota 0–10;
  modelo **"Estilo da prova real"** e opção de **priorizar as questões da prova, quiz e estudos dirigidos**
- Teoria por tema, simulado relâmpago, discursivas, "questões que já caíram", revisar erros, flashcards, ranking
- Prática: estudar, qual é a estrutura, onde está, que lâmina é essa (Histologia) e prova prática

## Rodar no PC (Windows)
```powershell
npm.cmd install
npm.cmd run dev
```

## Publicar no GitHub Pages
1. Envie esta pasta para o repositório (com a pasta oculta `.github`); `package.json` na raiz.
2. **Settings → Pages → Source: GitHub Actions** (deixe *Custom domain* vazio).
3. Cada `push` na `main` publica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Adicionar conteúdo
- **Objetiva**: `{ "id": "…", "type": "mcq", "text": "…", "options": ["A","B","C","D"], "answer": 1, "explanation": "…", "source": "prova" }`
  - `source` (opcional): `prova`, `quiz`, `prova+quiz` ou `ed` (estudo dirigido)
  - Verdadeiro/falso: `"options": ["Verdadeira","Falsa"]`
- **Discursiva**: `{ "id": "…", "type": "open", "text": "…", "model": "Resposta modelo", "keyPoints": [ { "label": "…", "keywords": ["radical"] } ] }`
- **Mapa mental**: `src/data/<matéria>/mindmap.json` — ramos com `label`, `children`, `note`, `system`, `figures` (ids das imagens) e/ou `image`.
- **Nova matéria**: crie `src/data/NOVA/questions.json`, `atlas.json` e (opcional) `mindmap.json`, coloque as imagens em `public/`
  e registre em `src/data/subjects.js`. Mapa mental e simulado funcionam automaticamente.

## Observações
- Imunologia: os esquemas foram desenhados para o app (os materiais não tinham figuras). As respostas de hipersensibilidade e vacinas
  (estudo dirigido parte II) e o gabarito da Prova 2 foram montados pelo app — confira com a professora.
- Histologia: gabarito de Glândulas Endócrinas montado pelo app — confira com a professora.
- O progresso fica no navegador de cada aluno.
