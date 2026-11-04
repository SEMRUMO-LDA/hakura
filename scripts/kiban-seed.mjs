#!/usr/bin/env node
/**
 * Importa o conteúdo atual do site da Hakura para o kibanCMS.
 *
 *  1. Faz login com um utilizador ADMIN (Supabase Auth → JWT)
 *  2. Cria as collections (equipa, pilares, especialidades, testemunhos, contactos)
 *  3. Faz upload das fotos da equipa para a Media Library
 *  4. Cria/atualiza as entries a partir de cms/seed-data.json (status: published)
 *
 * Pode ser corrido várias vezes: collections existentes são mantidas e as
 * entries são atualizadas pelo slug (fotos já carregadas não são repetidas).
 *
 * Uso:
 *   cp cms/.env.seed.example .env.seed   # preencher (NÃO fazer commit)
 *   npm run cms:seed                     # = node --env-file=.env.seed scripts/kiban-seed.mjs
 *   DRY_RUN=1 npm run cms:seed           # só mostra o que faria
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    console.error(`✖ Falta a variável ${name} (ver cms/.env.seed.example)`);
    process.exit(1);
  }
  return value;
};

const API = env('KIBAN_API_URL', 'https://kiban.pt/api/v1').replace(/\/+$/, '');
const TENANT = env('KIBAN_TENANT', 'hakura');
const SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = env('SUPABASE_ANON_KEY');
const ADMIN_EMAIL = env('KIBAN_ADMIN_EMAIL');
const ADMIN_PASSWORD = env('KIBAN_ADMIN_PASSWORD');
const DRY_RUN = process.env.DRY_RUN === '1';

/* --------------------------------------------------------------------------
   Collection schemas
   -------------------------------------------------------------------------- */
const PILLAR_OPTIONS = [
  { label: 'Medical', value: 'medical' },
  { label: 'Spa', value: 'spa' },
  { label: 'Holistic', value: 'holistic' },
  { label: 'Aesthetic', value: 'aesthetic' },
];
const field = (id, label, type, extra = {}) => ({ id, name: id, label, type, ...extra });
const ORDER = field('ordem', 'Ordem', 'number', { helpText: 'Posição no site (1 = primeiro)' });

export const COLLECTIONS = [
  {
    name: 'Equipa',
    slug: 'equipa',
    description: 'Corpo Clínico — cartões da secção Equipa e profissionais das especialidades. O título da entry é o nome.',
    type: 'custom',
    icon: 'users',
    fields: [
      field('cargo', 'Cargo', 'text', { helpText: 'Ex.: TERAPEUTA, DRA. · MEDICINA' }),
      field('especialidade', 'Especialidade', 'text', { required: true, helpText: 'Texto por baixo do nome' }),
      field('foto', 'Foto', 'image', { helpText: 'Recorte com fundo transparente (PNG/WebP), ~640×1024' }),
      field('bio', 'Bio curta', 'textarea'),
      field('mostrar_na_equipa', 'Mostrar no carrossel da Equipa', 'boolean', { helpText: 'Desligar para manter a pessoa só nas especialidades' }),
      ORDER,
    ],
  },
  {
    name: 'Pilares',
    slug: 'pilares',
    description: 'Os 4 pilares (Medical, Spa, Holistic, Aesthetic). O título da entry é o nome no painel (ex.: Hakura Medical).',
    type: 'custom',
    icon: 'layers',
    fields: [
      field('chave', 'Pilar', 'select', { required: true, options: PILLAR_OPTIONS }),
      field('etiqueta', 'Etiqueta do painel', 'text', { helpText: 'Ex.: ESPECIALIDADES' }),
      field('subtitulo', 'Subtítulo do painel', 'text'),
      field('descricao', 'Descrição do painel', 'textarea'),
      field('destaque_titulo', 'Título em destaque', 'text', { helpText: 'Secção Especialidades (desktop e cartões mobile)' }),
      field('destaque_descricao', 'Descrição em destaque', 'textarea'),
      field('texto_botao', 'Texto do botão (desktop)', 'text'),
      ORDER,
    ],
  },
  {
    name: 'Especialidades',
    slug: 'especialidades',
    description: 'Especialidades de cada pilar (painel lateral). O título da entry é o nome da especialidade.',
    type: 'custom',
    icon: 'stethoscope',
    fields: [
      field('pilar', 'Pilar', 'select', { required: true, options: PILLAR_OPTIONS }),
      field('descricao', 'Descrição', 'textarea', { required: true }),
      field('pontos', 'Foco clínico & indicações', 'textarea', { helpText: 'Um ponto por linha' }),
      field('profissional', 'Profissional responsável', 'reference', { referenceCollection: 'equipa' }),
      ORDER,
    ],
  },
  {
    name: 'Testemunhos',
    slug: 'testemunhos',
    description: 'Avaliações da secção Testemunhos. O título da entry é o nome do autor.',
    type: 'custom',
    icon: 'message-square',
    fields: [
      field('texto', 'Testemunho', 'textarea', { required: true }),
      field('origem', 'Origem', 'text', { helpText: 'Ex.: Avaliação Google' }),
      field('estrelas', 'Estrelas (1–5)', 'number'),
      ORDER,
    ],
  },
  {
    name: 'Contactos',
    slug: 'contactos',
    description: 'Contactos e horário (rodapé, gaveta de contactos, menu e barra mobile). Usar uma única entry com o slug "geral".',
    type: 'custom',
    icon: 'phone',
    fields: [
      field('telefone', 'Telefone', 'text', { required: true, helpText: 'Ex.: +351 964 166 845' }),
      field('telefone_nota', 'Nota do telefone', 'text', { helpText: 'Ex.: (Chamada para a rede móvel nacional)' }),
      field('email', 'Email', 'email', { required: true }),
      field('morada', 'Morada', 'textarea', { helpText: 'Duas linhas: rua / código postal e localidade' }),
      field('google_maps_url', 'Link do Google Maps', 'url'),
      field('horario', 'Horário', 'textarea', { helpText: 'Uma linha por período (o site mostra 2 linhas)' }),
      field('whatsapp', 'WhatsApp', 'text', { helpText: 'Só dígitos, com indicativo (ex.: 351964166845)' }),
    ],
  },
];

/* --------------------------------------------------------------------------
   HTTP helpers
   -------------------------------------------------------------------------- */
let token = '';

async function login() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`Login falhou (${res.status}): ${json.error_description || json.msg || json.error || 'sem detalhe'}`);
  }
  token = json.access_token;
}

async function api(method, route, body, { allow404 = false } = {}) {
  const headers = { Authorization: `Bearer ${token}`, 'X-Tenant': TENANT, Accept: 'application/json' };
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API}${route}`, { method, headers, body: payload });
  if (allow404 && res.status === 404) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status}: ${json?.error?.message || JSON.stringify(json).slice(0, 200)}`);
  return json.data ?? json;
}

const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function ensureCollection(def) {
  const existing = await api('GET', `/collections/${def.slug}`, null, { allow404: true });
  if (existing) {
    console.log(`  • collection "${def.slug}" já existe — mantida`);
    return;
  }
  if (DRY_RUN) return console.log(`  [dry-run] criaria collection "${def.slug}"`);
  await api('POST', '/collections', def);
  console.log(`  ✓ collection "${def.slug}" criada`);
}

async function upsertEntry(collection, { title, slug, content }) {
  const existing = await api('GET', `/entries/${collection}/${slug}`, null, { allow404: true });
  const body = { title, slug, content, status: 'published' };
  if (DRY_RUN) {
    console.log(`  [dry-run] ${existing ? 'atualizaria' : 'criaria'} ${collection}/${slug}`);
    return existing || { id: `dry-${slug}`, content };
  }
  const saved = existing
    ? await api('PUT', `/entries/${collection}/${slug}`, body)
    : await api('POST', `/entries/${collection}`, body);
  console.log(`  ✓ ${collection}/${slug} ${existing ? 'atualizada' : 'criada'}`);
  return saved;
}

async function uploadPhoto(localPath, alt) {
  const file = path.join(ROOT, 'public', localPath);
  const bytes = await readFile(file);
  if (DRY_RUN) return `[dry-run]${localPath}`;
  const form = new FormData();
  const type = file.endsWith('.webp') ? 'image/webp' : file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  form.append('file', new Blob([bytes], { type }), path.basename(file));
  form.append('alt_text', alt);
  form.append('folder_path', 'equipa');
  form.append('is_public', 'true');
  const media = await api('POST', '/media/upload', form);
  const url = media.url || media.public_url || (media.storage_path && `${SUPABASE_URL}/storage/v1/object/public/media/${media.storage_path}`);
  if (!url) throw new Error(`Upload de ${localPath} não devolveu URL`);
  return url;
}

/* --------------------------------------------------------------------------
   Main
   -------------------------------------------------------------------------- */
async function main() {
  const seed = JSON.parse(await readFile(path.join(ROOT, 'cms', 'seed-data.json'), 'utf8'));
  console.log(`kibanCMS: ${API} (tenant "${TENANT}")${DRY_RUN ? ' — DRY RUN' : ''}`);

  console.log('→ Login');
  await login();

  console.log('→ Collections');
  for (const def of COLLECTIONS) await ensureCollection(def);

  console.log('→ Equipa (com upload das fotos)');
  const peopleIds = new Map();
  for (const person of seed.equipa) {
    const slug = slugify(person.nome);
    const current = await api('GET', `/entries/equipa/${slug}`, null, { allow404: true });
    const foto = current?.content?.foto || (person.foto_local ? await uploadPhoto(person.foto_local, person.nome) : '');
    const saved = await upsertEntry('equipa', {
      title: person.nome,
      slug,
      content: {
        cargo: person.cargo || '',
        especialidade: person.especialidade || '',
        foto,
        bio: person.bio || '',
        mostrar_na_equipa: person.mostrar_na_equipa !== false,
        ordem: person.ordem,
      },
    });
    peopleIds.set(person.nome, saved.id);
  }

  console.log('→ Pilares');
  for (const p of seed.pilares) {
    await upsertEntry('pilares', {
      title: p.nome,
      slug: p.key,
      content: {
        chave: p.key,
        etiqueta: p.etiqueta || '',
        subtitulo: p.subtitulo || '',
        descricao: p.descricao || '',
        destaque_titulo: p.destaque_titulo || '',
        destaque_descricao: p.destaque_descricao || '',
        texto_botao: p.texto_botao || '',
        ordem: p.ordem,
      },
    });
  }

  console.log('→ Especialidades');
  for (const e of seed.especialidades) {
    await upsertEntry('especialidades', {
      title: e.nome,
      slug: `${e.pilar}-${slugify(e.nome)}`,
      content: {
        pilar: e.pilar,
        descricao: e.descricao || '',
        pontos: e.pontos || '',
        profissional: (e.profissional && peopleIds.get(e.profissional)) || '',
        ordem: e.ordem,
      },
    });
  }

  console.log('→ Testemunhos');
  for (const t of seed.testemunhos) {
    await upsertEntry('testemunhos', {
      title: t.autor,
      slug: slugify(t.autor),
      content: { texto: t.texto, origem: t.origem || '', estrelas: t.estrelas || 5, ordem: t.ordem },
    });
  }

  console.log('→ Contactos');
  await upsertEntry('contactos', { title: 'Contactos', slug: 'geral', content: { ...seed.contactos } });

  console.log('\n✓ Concluído. Confirme no admin do kibanCMS e crie o utilizador "viewer" para o site (ver cms/README.md).');
}

main().catch((err) => {
  console.error(`\n✖ ${err.message}`);
  process.exit(1);
});
