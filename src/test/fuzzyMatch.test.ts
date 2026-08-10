import { describe, it, expect } from 'vitest';
import { normalizeText, matchProduct, AUTO_ACCEPT_SCORE } from '@/lib/fuzzyMatch';

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
