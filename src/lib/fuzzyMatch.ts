/**
 * Casamento aproximado de nomes de produto (pt-BR).
 *
 * Usado como rede de segurança quando a IA não consegue casar uma linha do
 * caderno com o catálogo — o lojista escreve "fone bt" e o produto cadastrado
 * é "Fone de Ouvido Bluetooth". Funções puras, sem React nem Supabase.
 */

/** minúsculas, sem acento, sem pontuação, espaços colapsados. */
export function normalizeText(input: string): string {
  return (input ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(value: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < value.length - 1; i++) out.push(value.slice(i, i + 2));
  return out;
}

/**
 * Coeficiente de Dice sobre bigramas (0..1). Tolera erro de grafia e
 * inversão de palavras melhor que comparação literal.
 */
export function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const left = bigrams(a);
  const right = bigrams(b);
  if (!left.length || !right.length) return 0;

  const pool = new Map<string, number>();
  for (const gram of left) pool.set(gram, (pool.get(gram) ?? 0) + 1);

  let hits = 0;
  for (const gram of right) {
    const remaining = pool.get(gram) ?? 0;
    if (remaining > 0) {
      pool.set(gram, remaining - 1);
      hits++;
    }
  }
  return (2 * hits) / (left.length + right.length);
}

/** `bt` está contido em `bluetooth` na ordem (b…t)? Pega abreviação por consoantes. */
function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (const char of haystack) {
    if (char === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

/**
 * Semelhança entre uma palavra escrita no caderno e uma palavra do nome do
 * produto. É aqui que abreviação vira acerto: "carreg"→"carregador" (prefixo),
 * "bt"→"bluetooth" (subsequência).
 */
function tokenSimilarity(queryToken: string, targetToken: string): number {
  if (queryToken === targetToken) return 1;
  // Prefixo exige 3+ letras nos DOIS lados: senão o "C" de "USB-C" casaria
  // com qualquer palavra iniciada em C ("cordão", "celular", "capa"…).
  if (
    queryToken.length >= 3 && targetToken.length >= 3 &&
    (targetToken.startsWith(queryToken) || queryToken.startsWith(targetToken))
  ) {
    return 0.95;
  }
  if (queryToken.length >= 2 && isSubsequence(queryToken, targetToken)) return 0.75;
  if (targetToken.length >= 3 && isSubsequence(targetToken, queryToken)) return 0.7;
  return diceCoefficient(queryToken, targetToken);
}

/**
 * Média da melhor semelhança de cada palavra escrita contra as palavras do
 * produto. Comparar token a token (em vez da frase inteira) é o que faz uma
 * anotação curta casar com um nome de catálogo longo.
 */
function tokenScore(query: string, target: string): number {
  const queryTokens = query.split(' ').filter(Boolean);
  const targetTokens = target.split(' ').filter(Boolean);
  if (!queryTokens.length || !targetTokens.length) return 0;

  const total = queryTokens.reduce((sum, qt) => {
    const best = targetTokens.reduce((max, tt) => Math.max(max, tokenSimilarity(qt, tt)), 0);
    return sum + best;
  }, 0);
  return total / queryTokens.length;
}

export interface MatchCandidate<T> {
  item: T;
  score: number;
}

export interface MatchResult<T> {
  /** Melhor candidato, apenas quando o score passa de AUTO_ACCEPT_SCORE. */
  best: T | null;
  score: number;
  /** Top 3 acima de SUGGEST_SCORE — viram chips clicáveis na revisão. */
  candidates: MatchCandidate<T>[];
}

/** Acima disso o produto é preenchido automaticamente (com aviso de "sugerido"). */
export const AUTO_ACCEPT_SCORE = 0.62;
/** Acima disso vira sugestão clicável, mas não preenche sozinho. */
export const SUGGEST_SCORE = 0.35;

/**
 * Ordena o catálogo pela semelhança com o texto lido na foto.
 * O peso fica na semelhança token a token (que resgata abreviações); o Dice
 * global entra só como desempate entre candidatos parecidos.
 */
export function matchProduct<T extends { id: string; name: string }>(
  query: string,
  products: T[],
): MatchResult<T> {
  const needle = normalizeText(query);
  if (!needle || !products?.length) {
    return { best: null, score: 0, candidates: [] };
  }

  const scored = products
    .map((item) => {
      const target = normalizeText(item.name);
      const score = Math.min(
        1,
        tokenScore(needle, target) * 0.85 + diceCoefficient(needle, target) * 0.15,
      );
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  return {
    best: top && top.score >= AUTO_ACCEPT_SCORE ? top.item : null,
    score: top?.score ?? 0,
    candidates: scored.filter((c) => c.score >= SUGGEST_SCORE).slice(0, 3),
  };
}

// ─── Desambiguação por preço ──────────────────────────────────────────────────
// Algumas lojas cadastram o MESMO nome de produto várias vezes — "Película",
// "Capinha Iphone 11" — uma linha por variante, cada uma com um preço diferente
// (o modelo do aparelho vira preço, não nome). No caderno o lojista escreve só
// "pelicula 15,00": o nome sozinho não diz qual variante é, mas o preço diz.

/** Todo produto do catálogo cujo nome normalizado é IGUAL ao informado. */
export function familyOf<T extends { id: string; name: string }>(
  name: string,
  catalog: T[],
): T[] {
  const key = normalizeText(name);
  if (!key) return [];
  return catalog.filter((p) => normalizeText(p.name) === key);
}

/** Diferença mínima (em R$) entre o 1º e o 2º colocado para aceitar sozinho. */
const PRICE_TIE_TOLERANCE = 2;

export interface PriceResolution<T> {
  /** Produto escolhido, ou null se o preço não diferencia com segurança. */
  winner: T | null;
  /** true quando havia mais de uma opção plausível (winner nulo por empate). */
  tie: boolean;
}

/**
 * Dentro de uma família (mesmo nome, preços diferentes), escolhe pelo preço
 * lido. Só decide sozinho quando há um vencedor claro — a diferença entre o
 * 1º e o 2º colocado precisa ser maior que PRICE_TIE_TOLERANCE. Preço exato
 * sempre vence na hora. Sem preço lido, ou com dois preços igualmente perto,
 * fica em aberto para o lojista escolher.
 */
export function resolveByPrice<T extends { price: number | string }>(
  family: T[],
  price: number | null,
): PriceResolution<T> {
  if (family.length === 0) return { winner: null, tie: false };
  if (family.length === 1) return { winner: family[0], tie: false };
  if (price === null) return { winner: null, tie: true };

  const ranked = [...family].sort(
    (a, b) => Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price),
  );
  const d1 = Math.abs(Number(ranked[0].price) - price);
  if (d1 === 0) return { winner: ranked[0], tie: false };

  const d2 = ranked[1] ? Math.abs(Number(ranked[1].price) - price) : Infinity;
  if (d2 - d1 < PRICE_TIE_TOLERANCE) return { winner: null, tie: true };
  return { winner: ranked[0], tie: false };
}
