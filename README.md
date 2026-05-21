# Stellar Interaction

Stellar Interaction e um site educativo e interativo sobre astronomia, sistema solar e exploracao espacial. O projeto combina paginas informativas, quiz, loja, perfil de usuario, feedback, videos e um jogo espacial em uma experiencia visual com tema galatico.

Deploy: https://stellar-steraction.web.app

## Funcionalidades

- Autenticacao com Firebase Auth usando email/senha e login com Google.
- Cadastro, login, recuperacao de senha e rotas protegidas.
- Perfil do usuario com edicao de dados, avatar local, logout, desativacao e exclusao de conta.
- Sistema de moedas salvo no Firestore.
- Loja com itens de avatar e fundos equipaveis.
- Quiz sobre planetas com pontuacao, progresso, resultado e botao para parar o quiz.
- Pagina de planetas com cards, detalhes e visual galatico.
- Sistema solar 3D com Three.js.
- Pagina de misterios cosmicos com imagens interativas.
- Galeria de videos educativos sobre o espaco.
- Jogo espacial com nave, tiros, recarga, meteoros, explosoes e pontuacao.
- Formulario de feedback com envio para `stellarinteraction@gmail.com` e registro no Firestore.
- Toasts/mensagens visuais no estilo do site.
- Deploy configurado com Firebase Hosting.
- SEO tecnico com `robots.txt`, `sitemap.xml`, `sitemap-public.xml` e arquivo de verificacao do Google Search Console.
- Regras de seguranca do Firestore em `firestore.rules`.

## Tecnologias

- React 18
- Vite 8
- React Router DOM v6
- Firebase Auth
- Firebase Firestore
- Firebase Hosting
- Firebase Web SDK 12
- Three.js
- Tailwind CSS
- PostCSS e Autoprefixer
- CSS modular por pagina
- FormSubmit para envio de feedback por email

## Como Rodar Localmente

Clone o repositorio:

```bash
git clone https://github.com/seu-usuario/stellar-interaction.git
cd stellar-interaction
```

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra no navegador o endereco mostrado pelo Vite, geralmente:

```bash
http://localhost:5173
```

## Scripts Disponiveis

```bash
npm run dev
```

Inicia o projeto em modo desenvolvimento.

```bash
npm run build
```

Gera a versao de producao na pasta `dist`.

```bash
npm run preview
```

Executa uma previa local da build de producao.

```bash
npm run firebase:login
```

Faz login na Firebase CLI.

```bash
npm run deploy
```

Gera a build e publica o site no Firebase Hosting.

## SEO e Google Search Console

Arquivos publicos usados para indexacao e verificacao:

```txt
public/robots.txt
public/sitemap.xml
public/sitemap-public.xml
public/google97e4445819f8733f.html
```

URLs publicadas:

```txt
https://stellar-steraction.web.app/robots.txt
https://stellar-steraction.web.app/sitemap.xml
https://stellar-steraction.web.app/sitemap-public.xml
```

No Google Search Console, use a propriedade de prefixo de URL:

```txt
https://stellar-steraction.web.app/
```

E envie o sitemap:

```txt
sitemap-public.xml
```

Observacao: as paginas internas do app ficam protegidas por login, entao o Google indexa melhor as rotas publicas, como login, cadastro, termos e privacidade.

## Firebase

Este projeto usa Firebase para autenticacao, banco de dados e hospedagem.

Recursos usados:

- Authentication: login por email/senha e Google.
- Firestore: usuarios, moedas, inventario, feedback e dados do app.
- Hosting: deploy da aplicacao React.

Para configurar o projeto no Firebase Console:

1. Ative Authentication.
2. Ative os provedores Email/Senha e Google.
3. Crie o banco Firestore.
4. Publique as regras do arquivo `firestore.rules`.
5. Confira os dominios autorizados em Authentication > Settings.
6. Restrinja a chave de API no Google Cloud Console para o dominio do site.

Publicar regras do Firestore:

```bash
firebase deploy --only firestore:rules
```

Publicar o site:

```bash
npm run deploy
```

## Configuracao do Firebase no Codigo

A configuracao atual do Firebase fica em:

```txt
src/services/firebase.js
```

As chaves publicas do Firebase podem aparecer no frontend, mas por seguranca e organizacao e recomendado restringir a chave no Google Cloud Console e, em uma versao futura, mover os valores para variaveis de ambiente do Vite.

Exemplo de `.env` recomendado:

```env
VITE_FIREBASE_API_KEY=sua_chave
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
VITE_FEEDBACK_EMAIL=stellarinteraction@gmail.com
```

## Rotas Principais

| Rota | Descricao |
| --- | --- |
| `/login` | Tela de login |
| `/register` | Cadastro de usuario |
| `/forgot-password` | Recuperacao de senha |
| `/` | Pagina inicial |
| `/planets` | Lista de planetas |
| `/planets/:id` | Detalhes de um planeta |
| `/mysteries` | Misterios cosmicos |
| `/videos` | Galeria de videos |
| `/quiz` | Quiz educativo |
| `/game` | Jogo espacial |
| `/store` | Loja galatica |
| `/feedback` | Feedback do usuario |
| `/profile` | Perfil do usuario |

## Estrutura do Projeto

```txt
src/
  components/
    auth/
    effects/
    game/
    layout/
    planets/
    quiz/
    store/
    ui/
    user/
    videos/
  context/
  data/
  hooks/
  pages/
  routes/
  services/
  styles/
  utils/
```

## Seguranca

O projeto possui regras de Firestore para limitar acesso aos dados dos usuarios e bloquear colecoes nao autorizadas. Mesmo assim, nenhuma aplicacao frontend e 100% segura so com regras no cliente.

Pontos importantes:

- Nao envie `.env`, logs ou arquivos de build para o GitHub.
- Nao versione `node_modules`, `dist` ou `.firebase`; esses diretorios sao gerados localmente.
- Restrinja a chave de API do Firebase pelo dominio do site.
- Mantenha os dominios autorizados do Firebase Auth revisados.
- Use Cloud Functions no futuro para validar moedas, compras, recompensas do quiz e pontuacoes do jogo no servidor.

## Qualidade e Publicacao

Ultima verificacao tecnica:

```bash
npm audit
npm run build
npm run deploy
```

Resultado esperado:

- `npm audit`: sem vulnerabilidades conhecidas.
- `npm run build`: build de producao gerada com sucesso.
- `npm run deploy`: publicacao no Firebase Hosting.

Dependencias principais atualizadas:

- `firebase` 12.x
- `vite` 8.x
- `@vitejs/plugin-react` 6.x

Tambem foi adicionada a configuracao `postcss.config.js` para processar corretamente Tailwind CSS e Autoprefixer durante a build.

## Feedback

O formulario de feedback envia mensagens para:

```txt
stellarinteraction@gmail.com
```

Tambem tenta salvar uma copia no Firestore. Caso a conexao falhe, o feedback pode ser salvo localmente no navegador.

## Status

Projeto em desenvolvimento, com foco educacional. As principais telas e recursos estao funcionando, com deploy ativo no Firebase Hosting, sitemap publico e auditoria de dependencias sem vulnerabilidades conhecidas no momento da ultima verificacao.

Melhorias futuras podem incluir Cloud Functions para economia segura, dominio proprio, home publica otimizada para SEO e mais dados dinamicos de APIs espaciais.

## Autor

Projeto desenvolvido como site educativo interativo sobre astronomia e sistema solar.
