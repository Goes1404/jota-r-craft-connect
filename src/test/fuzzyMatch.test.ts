import { describe, it, expect } from 'vitest';
import { normalizeText, matchProduct, familyOf, resolveByPrice, AUTO_ACCEPT_SCORE } from '@/lib/fuzzyMatch';

const catalog = [
  { id: 'p1', name: 'Fone de Ouvido Bluetooth TWS' },
  { id: 'p2', name: 'Carregador Turbo USB-C 20W' },
  { id: 'p3', name: 'Capa iPhone 15 Pro' },
  { id: 'p4', name: 'Cordão para Celular' },
];

describe('normalizeText', () => {
  it('remove acentos, pontuação e caixa', () => {
    expect(normalizeText('Cordão P/ Celular!')).toBe('cordao p celular');
  });

  it('não quebra com entrada vazia', () => {
    expect(normalizeText('')).toBe('');
  });
});

describe('matchProduct', () => {
  it('casa abreviação comum do caderno', () => {
    const { best } = matchProduct('fone bt', catalog);
    expect(best?.id).toBe('p1');
  });

  it('não auto-preenche abreviação semântica, mas sugere o candidato certo', () => {
    // "tipo c" é jargão de USB-C: só a IA resolve isso semanticamente.
    // O fuzzy deve ranquear certo e oferecer como sugestão, sem chutar sozinho.
    const { best, candidates } = matchProduct('carreg tipo c', catalog);
    expect(best).toBeNull();
    expect(candidates[0]?.item.id).toBe('p2');
  });

  it('não sugere produto errado por causa de token de uma letra no catálogo', () => {
    // Regressão: o "C" de "USB-C" casava com qualquer palavra iniciada em C.
    const { candidates } = matchProduct('cordao celular', catalog);
    expect(candidates.map((c) => c.item.id)).not.toContain('p2');
  });

  it('casa nome parcial com número de modelo', () => {
    const { best } = matchProduct('capinha 15 pro', catalog);
    expect(best?.id).toBe('p3');
  });

  it('ignora acento na escrita do lojista', () => {
    const { best } = matchProduct('cordao celular', catalog);
    expect(best?.id).toBe('p4');
  });

  it('não inventa produto para texto sem relação', () => {
    const { best, score } = matchProduct('geladeira brastemp', catalog);
    expect(best).toBeNull();
    expect(score).toBeLessThan(AUTO_ACCEPT_SCORE);
  });

  it('devolve vazio para catálogo vazio', () => {
    expect(matchProduct('fone', []).best).toBeNull();
  });

  it('devolve vazio para busca vazia', () => {
    expect(matchProduct('', catalog).best).toBeNull();
  });
});

// Cenário real: mesmo nome cadastrado várias vezes, uma linha por preço —
// "Película" (uma por modelo de tela) e "Capinha Iphone 11" já existem assim
// no catálogo. O nome sozinho não diferencia; o preço lido no caderno diferencia.
describe('familyOf', () => {
  const catalogWithVariants = [
    { id: 'v1', name: 'Película', price: 10 },
    { id: 'v2', name: 'Película', price: 15 },
    { id: 'v3', name: 'Película', price: 25 },
    { id: 'v4', name: 'Capinha Iphone 11', price: 20 },
    { id: 'v5', name: 'Capinha Iphone 11', price: 25 },
    { id: 'v6', name: 'Capinha Iphone 11', price: 40 },
    { id: 'v7', name: 'Fone de Ouvido', price: 18 },
  ];

  it('agrupa todas as variantes do mesmo nome', () => {
    const family = familyOf('pelicula', catalogWithVariants);
    expect(family.map((f) => f.id).sort()).toEqual(['v1', 'v2', 'v3']);
  });

  it('ignora acento/caixa ao agrupar', () => {
    expect(familyOf('PELÍCULA', catalogWithVariants)).toHaveLength(3);
  });

  it('produto sem variante forma família de 1', () => {
    expect(familyOf('fone de ouvido', catalogWithVariants).map((f) => f.id)).toEqual(['v7']);
  });
});

describe('resolveByPrice', () => {
  const peliculas = [
    { id: 'v1', price: 10 },
    { id: 'v2', price: 15 },
    { id: 'v3', price: 25 },
  ];

  it('preço exato escolhe sozinho', () => {
    expect(resolveByPrice(peliculas, 15).winner?.id).toBe('v2');
  });

  it('preço próximo (erro de leitura de 1 real) ainda resolve', () => {
    expect(resolveByPrice(peliculas, 14).winner?.id).toBe('v2');
  });

  it('preço no meio do caminho entre duas opções fica em aberto', () => {
    // 20 está a 5 de "15" e a 5 de "25": nenhuma opção vence com folga.
    const r = resolveByPrice(peliculas, 20);
    expect(r.winner).toBeNull();
    expect(r.tie).toBe(true);
  });

  it('sem preço lido, fica em aberto mesmo com só duas variantes', () => {
    const r = resolveByPrice(peliculas, null);
    expect(r.winner).toBeNull();
    expect(r.tie).toBe(true);
  });

  it('família de 1 resolve mesmo sem preço', () => {
    expect(resolveByPrice([{ id: 'x', price: 30 }], null).winner?.id).toBe('x');
  });

  it('família vazia não resolve', () => {
    expect(resolveByPrice([], 10).winner).toBeNull();
  });

  it('3 variantes com preços bem espaçados: cada preço lido cai na certa', () => {
    const capinhas = [
      { id: 'v4', price: 20 },
      { id: 'v5', price: 25 },
      { id: 'v6', price: 40 },
    ];
    expect(resolveByPrice(capinhas, 20).winner?.id).toBe('v4');
    expect(resolveByPrice(capinhas, 25).winner?.id).toBe('v5');
    expect(resolveByPrice(capinhas, 39).winner?.id).toBe('v6');
  });
});
