# 🦴 Anatomia Quest — versão GitHub Pages

Simulado gamificado de Anatomia (Módulo 3) que roda **só no navegador**, sem servidor.
React 19 + Vite + Tailwind CSS v4.

- 118 questões comentadas (5 sistemas), simulado geral, revisão de erros e flashcards
- 🖼️ Atlas: identificação por imagem, com 6 figuras e 71 estruturas
- 🌗 Modo claro e escuro · 🦴 mascote Doutor Ossinho
- O progresso (XP, estrelas, erros e ranking) fica salvo **no navegador de cada aluno**

## Rodar no PC (Windows)
```powershell
npm.cmd install
npm.cmd run dev
```
Depois abra http://localhost:5173

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e envie esta pasta (com a pasta oculta `.github`).
2. No repositório, abra **Settings → Pages** e, em **Source**, escolha **GitHub Actions**.
3. Pronto: a cada `push` na branch `main`, o site é gerado e publicado sozinho
   (acompanhe na aba **Actions**).
4. O endereço fica assim: `https://SEU-USUARIO.github.io/NOME-DO-REPO/`

**Senha do editor (opcional):** em **Settings → Secrets and variables → Actions**, crie o secret
`PROF_PIN`. Sem ele, a senha é `anatomia`.

> Num site estático a senha fica dentro do código do site, então ela **não é segurança de verdade**.
> Mas isso não é problema: o que alguém editar fica salvo só no próprio navegador e não muda nada para a turma.

## Como a professora adiciona fotos ao Atlas
1. No site, abra **Atlas → Editor da professora**.
2. Adicione as fotos, clique para marcar as estruturas e clique em **Salvar**.
   Tudo fica salvo só naquele navegador, que guarda cerca de 10 a 15 fotos.
3. Clique em **Exportar atlas.json**.
4. Substitua o arquivo `src/data/atlas.json` do repositório pelo arquivo exportado e faça o commit.
   Dá para fazer pelo próprio site do GitHub: abra o arquivo, clique no lápis e cole o conteúdo, ou use **Add file → Upload files**.
5. Depois que o deploy terminar, todos os alunos passam a ver as fotos.

## Limitações desta versão
| Item | Comportamento |
|---|---|
| XP, estrelas e erros | Salvos por navegador. Se o aluno limpar os dados do navegador ou trocar de aparelho, o progresso volta a zero |
| Ranking | Mostra só os jogadores que usaram aquele navegador |
| Gabarito | Fica dentro do código do site, então quem souber abrir as ferramentas do navegador consegue ver |
| Fotos novas | Precisam ser publicadas pelo `atlas.json`, como explicado acima |

## Estrutura
```
├── .github/workflows/deploy.yml   # publica no GitHub Pages
├── public/atlas/                  # figuras SVG
├── src/
│   ├── data/questions.json        # ✏️ questões (answer = índice da correta, começando em 0)
│   ├── data/atlas.json            # ✏️ figuras e pontos do Atlas
│   ├── lib/api.js                 # toda a lógica do jogo (salva no localStorage)
│   ├── hooks/ · components/ · components/atlas/
│   └── App.jsx
└── vite.config.js                 # base './' para funcionar em /NOME-DO-REPO/
```
