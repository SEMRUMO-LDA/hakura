# Hakura × kibanCMS

O site lê quatro conteúdos do kibanCMS **no browser**: Equipa, Especialidades (com os 4 pilares), Testemunhos e Contactos/horário.

- O código está em [`js/cms.js`](../js/cms.js).
- O HTML do `index.html` continua a ser a **versão de reserva**. Se o CMS não estiver configurado, estiver em baixo ou uma collection estiver vazia, essa parte do site fica como está.

## Como funciona

| Collection | O que controla no site |
|---|---|
| `equipa` | Carrossel "Corpo Clínico" e o cartão do profissional em cada especialidade |
| `pilares` | Os 4 pilares: título e descrição na secção Especialidades (desktop e cartões mobile), etiqueta, título e descrição do painel lateral ; **Resumo no menu** = texto curto do menu ESPECIALIDADES no cabeçalho |
| `especialidades` | Lista de especialidades de cada pilar no painel lateral (descrição, pontos, profissional) ; **Sintomas / palavras-chave** = termos que a lupa "O que sente?" usa para sugerir a especialidade |
| `testimonials` | Secção Testemunhos: `author_name`, `testimonial`, `rating`; `author_role` é a origem (vazio = "Avaliação Google"); `featured` põe-no primeiro. Se estiver vazia, o site usa `testemunhos` (a collection criada pela importação). |
| `contactos` | Telefone, nota do telefone, email, morada, link do Google Maps, horário e WhatsApp: rodapé, gaveta de contactos, menu mobile e barra mobile |

- Só aparecem no site as entries com estado **Published**. Os rascunhos ficam escondidos.
- A ordem é dada pelo campo **Ordem** (1 = primeiro).
- Para tirar alguém do carrossel da Equipa sem o tirar das especialidades, desligue **Mostrar no carrossel da Equipa**.
- O texto é sempre mostrado como texto simples. Não é possível pôr HTML.
- A política de privacidade **não** é alterada pelo CMS, porque mantém os contactos legais próprios.
- Cada visitante guarda os dados durante **10 minutos**. Uma alteração no CMS pode demorar até 10 minutos a aparecer para quem já tinha o site aberto.

## Configuração (uma vez)

### 1. Supabase da Hakura

O projeto já foi criado: `https://ueuderjsugkmncgtoaxc.supabase.co`.

1. No **SQL Editor**, correr `database/migrations/CLEAN_RESET.sql`, que está no repositório do kibanCMS.
2. Em **Storage**, criar o bucket `media` com a opção **Public** ativa.

### 2. Tenant "hakura" no kibanCMS (Railway)

Seguir o [`docs/NEW_CLIENT_SETUP.md`](https://github.com/SEMRUMO-LDA/kibanCMS/blob/main/docs/NEW_CLIENT_SETUP.md) do kibanCMS. O caminho mais curto é `pnpm new-client`. Na variável `TENANTS`, a entrada `hakura` tem de incluir as **origins** do site:

```json
"hakura": {
  "supabaseUrl": "https://ueuderjsugkmncgtoaxc.supabase.co",
  "supabaseAnonKey": "…",
  "supabaseServiceKey": "…",
  "hostnames": ["hakura.kiban.pt"],
  "origins": ["https://www.hakura.pt", "https://hakura.pt", "http://localhost:3000"]
}
```

Sem as origins, o browser bloqueia os pedidos (CORS) e o site fica com o conteúdo de reserva. O site envia `X-Tenant: hakura`, por isso o subdomínio `hakura.kiban.pt` só é necessário para o admin.

### 3. Importar o conteúdo atual

O script cria as 5 collections, sobe as fotos da equipa e importa tudo o que está hoje no site (ficheiro [`seed-data.json`](seed-data.json)).

```bash
cp cms/.env.seed.example .env.seed   # preencher com o admin da Hakura — NÃO fazer commit
DRY_RUN=1 npm run cms:seed           # pré-visualizar
npm run cms:seed                     # importar
```

Pode ser corrido mais do que uma vez: atualiza as entries pelo slug e não repete os uploads.

### 4. Utilizador só de leitura para o site

⚠️ A API key do kibanCMS tem **as mesmas permissões que o utilizador a quem pertence**, e a key usada pelo site fica pública no código. Por isso nunca use a key de um admin, editor ou author.

1. No admin, em **Users → Invite**, criar por exemplo `site@hakura.pt` com o role **viewer**.
2. Entrar com esse utilizador e, em **Settings → API**, copiar a key (`kiban_live_…`).
3. Opcional, mas recomendado: confirmar que a key não consegue escrever. Um `POST /api/v1/entries/testemunhos` com essa key deve devolver **403**.

### 5. Ligar o site

Criar `.env` a partir de [`.env.example`](../.env.example). Definir as mesmas variáveis no alojamento ou no build, porque o Vite injeta-as no código quando corre `npm run build`.

```env
VITE_KIBAN_API_URL=https://kiban.pt/api/v1
VITE_KIBAN_TENANT=hakura
VITE_KIBAN_API_KEY=kiban_live_…   # key do utilizador viewer
```

Depois, fazer um novo build e deploy.

## Notas

- **Limite da API:** a API aceita 100 pedidos por 15 minutos por IP. O site faz 5 pedidos na primeira visita e nenhum durante os 10 minutos seguintes. Redes com muitos utilizadores atrás do mesmo IP podem atingir o limite. Nesse caso o site mostra o conteúdo de reserva.
- **SEO:** o conteúdo de reserva está no HTML. Se o conteúdo no CMS se afastar muito do HTML, convém atualizar o `index.html` de vez em quando.
- **Fotos da equipa:** usar um recorte com fundo transparente (PNG ou WebP), por volta de 640×1024. O ponto focal definido no CMS é ignorado nestes cartões, porque o recorte fica sempre alinhado em baixo.

## Widgets do kibanCMS

O site carrega o **loader de widgets** do kibanCMS (`js/cms.js` → `https://kiban.pt/api/v1/widgets/loader.js`, com a key de leitura e `data-tenant="hakura"`). O loader pergunta ao CMS que add-ons estão ativos e injeta só esses. **Ligar ou desligar um widget faz-se no admin (Add-ons), sem mexer no site.**

| Widget | Onde aparece |
|---|---|
| Aviso de cookies | Na primeira visita e depois num ícone no canto inferior esquerdo |
| Acessibilidade | Canto inferior esquerdo, agrupado com o ícone dos cookies |
| Idiomas (tradução automática) | Canto inferior direito, por baixo do botão de chat do site (no computador) |
| WhatsApp | Desligado, porque o site já tem WhatsApp na barra do telemóvel |

- No telemóvel, os widgets ficam acima da barra "Marcar Consulta" (`css/hakura-responsive.css` §18).
- Enquanto o aviso de cookies está aberto, fica por cima de todos os widgets.

**Configurar no admin do kibanCMS:**
- **Aviso de cookies:**
  - `policyUrl` → `/#politica-de-privacidade` (abre o popup da política de privacidade);
  - `primaryColor` → `#379cb7` (azul Hakura).
- **Acessibilidade:** `buttonLabel` → "Acessibilidade".
- **Idiomas:** precisa de uma chave DeepL válida. Sem ela, mudar de idioma não traduz nada. Se não houver chave, desligue o add-on.

## Lupa "O que sente?"

No cabeçalho, a pessoa escreve o que sente (ex.: "dor nas costas") e o site sugere até 3 especialidades, com "Ver especialidade" e "Marcar consulta". Código: [`js/symptom-search.js`](../js/symptom-search.js).

- **Privacidade:** tudo corre no browser e o texto escrito **não é enviado para nenhum servidor** (sintomas são dados de saúde).
- **Como melhorar as sugestões:** no admin, em **Especialidades → Sintomas / palavras-chave**, acrescente os termos que as pessoas usam, separados por vírgulas. Se o campo estiver vazio, a lupa usa a lista de [`sintomas.json`](sintomas.json).
- **Avisos:** palavras de alarme (ex.: "dor no peito", "falta de ar") mostram um aviso para ligar 112 / SNS 24. A nota "sugestão orientativa" aparece sempre.
