/**
 * Normalização de categorias de produto.
 * Evita duplicatas acidentais como "Mouse" vs "Mouse " vs "mouse":
 * remove espaços das pontas, colapsa espaços internos e capitaliza
 * a primeira letra (o restante fica como o lojista digitou).
 */
export function normalizeCategory(raw: string): string {
  const clean = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  return clean.charAt(0).toLocaleUpperCase('pt-BR') + clean.slice(1);
}
