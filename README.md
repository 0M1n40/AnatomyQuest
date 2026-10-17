# 🩺 NurseHub

Plataforma de estudo gamificado para Enfermagem que roda **só no navegador** (GitHub Pages).
React 19 + Vite + Tailwind CSS v4. Mascote: **Doutor Ossinho** 🦴.

## Matérias
| Matéria | Teoria | Discursivas | Prática |
|---|---|---|---|
| 🦴 Anatomia | 118 questões (5 sistemas) | — | Atlas: 6 figuras, 71 estruturas |
| 🔬 Histologia | 79 questões (4 sistemas) | 20 questões "explique / diferencie" | Laminário: 19 lâminas da aula, 44 estruturas |

### Modos de estudo (em cada matéria)
- **Teoria por sistema**, **Simulado geral**, **Revisar erros** e **Flashcards**
- **✍️ Explique com suas palavras** (discursivas): o aluno escreve, o app mostra a **resposta modelo**
  e marca os **pontos-chave** encontrados; depois o aluno se autoavalia (acertei / parcial / errei)
- **Prática (Atlas / Laminário)**:
  - 📖 Estudar · 👉 Qual é a estrutura? · 📍 Onde está?
  - 🔬 **Que lâmina é essa?** — escolha o órgão e a justificativa (como na prova prática)
  - 🎲 Prova prática — mistura todos os modos
- XP geral, nível, estrelas e recordes **por matéria**, ranking, modo claro/escuro

## Rodar no PC (Windows)
```powershell
npm.cmd install
npm.cmd run dev
```
Abra http://localhost:5173

## Publicar no GitHub Pages
1. Envie esta pasta para o repositório (com a pasta oculta `.github`). O `package.json` deve ficar na raiz.
2. **Settings → Pages → Source: GitHub Actions**.
3. Cada `push` na `main` publica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/` (acompanhe em **Actions**).
4. Opcional: secret `PROF_PIN` (Settings → Secrets and variables → Actions) para a senha do editor. Padrão: `anatomia`.

## Editor da professora
Prática → **Editor da professora**: adicionar fotos, marcar estruturas, e (opcional) informar **órgão** e
**justificativa** para o modo "Que lâmina é essa?". As alterações ficam no navegador até clicar em
**Exportar atlas.json** e substituir `src/data/<matéria>/atlas.json` no repositório.

## Adicionar conteúdo
- **Questão objetiva** (`src/data/<matéria>/questions.json`):
  ```json
  { "id": "hist-uri-99", "type": "mcq", "text": "Pergunta?", "options": ["A","B","C","D"], "answer": 1, "explanation": "Por quê." }
  ```
- **Questão discursiva**:
  ```json
  { "id": "hist-uri-98", "type": "open", "text": "Explique…", "model": "Resposta modelo…",
    "keyPoints": [ { "label": "Podócitos", "keywords": ["podocit", "pedicel"] } ] }
  ```
  As `keywords` são comparadas sem acentos e sem maiúsculas; use radicais (ex.: `podocit` pega podócito/podócitos).
- **Nova matéria**: crie `src/data/NOVA/questions.json` e `src/data/NOVA/atlas.json` (pode ser `[]`),
  coloque as imagens em `public/` e adicione a matéria em `src/data/subjects.js`.

## Limitações (versão estática)
- O progresso fica salvo no navegador de cada aluno.
- O ranking mostra só quem jogou no mesmo aparelho.
- Gabarito e senha do editor ficam no código do site (não é segurança real, mas nada que alguém altere afeta os outros).

## Estrutura
```
├── .github/workflows/deploy.yml
├── public/atlas/        # figuras SVG de Anatomia
├── public/laminas/      # lâminas de Histologia (material da aula prática)
└── src/
    ├── data/subjects.js               # lista de matérias
    ├── data/anatomia/   questions.json · atlas.json
    ├── data/histologia/ questions.json · atlas.json
    ├── lib/api.js       # lógica do jogo (localStorage)
    ├── lib/text.js      # correção por pontos-chave das discursivas
    ├── hooks/ · components/ · components/atlas/
    └── App.jsx
```
