# 🩺 NurseHub

Plataforma de estudo gamificado para Enfermagem que roda **só no navegador** (GitHub Pages).
React 19 + Vite + Tailwind CSS v4. Mascote: **Doutor Ossinho** 🦴.

## Matérias
| Matéria | Objetivas | Discursivas | Da prova/quiz | Prática |
|---|---|---|---|---|
| 🦴 Anatomia | 118 | 16 | — | Atlas: 6 figuras, 71 estruturas |
| 🔬 Histologia | 90 | 49 | 66 | Laminário: 22 lâminas (19 da aula + 3 da prova), 50 estruturas |

## Recursos de TODA matéria
- **🧠 Mapa mental** do conteúdo: ramos que abrem/fecham, busca, "Treinar" por sistema e impressão.
  Se a matéria não tiver `mindmap.json`, o mapa é gerado automaticamente das questões e figuras.
- **📝 Simulado de prova**: objetivas + discursivas + identificação por imagem, tempo total,
  navegação livre entre questões, correção só ao entregar e **nota de 0 a 10**
  (discursivas corrigidas por autoavaliação com a resposta modelo).
- Teoria por sistema, simulado relâmpago, discursivas, revisar erros, flashcards, ranking.
- Prática (Atlas/Laminário): estudar, qual é a estrutura, onde está, que lâmina é essa, prova prática.
- **📄 Questões da prova e do quiz** (quando houver), marcadas com a origem.

## Rodar no PC (Windows)
```powershell
npm.cmd install
npm.cmd run dev
```

## Publicar no GitHub Pages
1. Envie esta pasta para o repositório (com a pasta oculta `.github`); `package.json` na raiz.
2. **Settings → Pages → Source: GitHub Actions** (deixe *Custom domain* vazio).
3. Cada `push` na `main` publica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
4. Opcional: secret `PROF_PIN` para a senha do editor (padrão: `anatomia`).

## Adicionar conteúdo
- **Objetiva** (`src/data/<matéria>/questions.json`):
  `{ "id": "hist-uri-99", "type": "mcq", "text": "…", "options": ["A","B","C","D"], "answer": 1, "explanation": "…", "source": "prova" }`
  (`source` é opcional: `prova`, `quiz` ou `prova+quiz`; aceita até 7 alternativas)
- **Discursiva**: `{ "id": "…", "type": "open", "text": "Explique…", "model": "Resposta modelo",
  "keyPoints": [ { "label": "Podócitos", "keywords": ["podocit", "pedicel"] } ] }`
- **Mapa mental** (`src/data/<matéria>/mindmap.json`):
  `{ "label": "Matéria", "children": [ { "label": "Sistema", "system": "uri", "note": "dica", "children": [ … ] } ] }`
  - **Imagens no mapa:** em qualquer ramo, use `"figures": ["lam-traqueia"]` (ids do Atlas/Laminário, abre com as
    estruturas marcadas) e/ou `"image": "laminas/minha-foto.jpg"` (arquivo em `public/` ou um link https).
- **Nova matéria**: crie `src/data/NOVA/questions.json`, `atlas.json` (pode ser `[]`) e, se quiser, `mindmap.json`;
  coloque as imagens em `public/` e registre em `src/data/subjects.js`. Mapa mental e simulado de prova
  passam a funcionar automaticamente.

## Observações
- Questões de **Glândulas Endócrinas** vieram da prova; o gabarito foi montado pelo app (o tema não está no resumo do módulo) — confira com a professora.
- O progresso fica no navegador de cada aluno; o ranking mostra só quem usou o mesmo aparelho.
