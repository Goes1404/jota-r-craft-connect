import type { Product } from '@/types/database';

/**
 * Estado do lançamento por foto do caderno, guardado FORA da árvore de
 * componentes. Ler a foto pode levar dezenas de segundos — o lojista não
 * pode ficar preso na tela esperando. Por viver num módulo (não num useState),
 * este estado sobrevive a fechar o diálogo e a navegar para outra página: a
 * leitura continua em segundo plano e o resultado aparece quando ele voltar.
 */

// ─── Contrato da edge function parse-sale-photo ──────────────────────────────
export interface ApiLine {
  raw_text: string;
  product_id: string | null;
  product_name_guess: string;
  quantity: number | null;
  unit_price: number | null;
  confidence: number;
  warnings: string[];
}

export interface ExtractedLine extends ApiLine {
  uid: string;
  selected: boolean;
  /** Produto veio do casamento local (apelido ou aproximado), não da IA. */
  suggested: boolean;
  /** Casou por apelido aprendido — já foi confirmado por você antes. */
  fromAlias: boolean;
  /** Havia mais de uma variante com o mesmo nome; o preço lido decidiu qual. */
  resolvedByPrice: boolean;
  /**
   * Quando o nome achado tem variantes (mesmo nome, preços diferentes) e o
   * preço lido não decide sozinho, guarda só essa família — a lista de
   * escolha fica pequena e certeira, em vez do catálogo inteiro.
   */
  candidates: { id: string; name: string }[];
}

/** Uma foto lida = uma página do caderno, com suas linhas, data e total. */
export interface PageResult {
  uid: string;
  preview: string;
  hash: string;
  pageDate: string;
  pageTotal: number | null;
  duplicateOf: string | null;
  lines: ExtractedLine[];
}

export interface CreateDraft {
  uid: string;
  name: string;
  category: string;
  price: string;
}

export interface BatchProgress {
  current: number;
  total: number;
}

export interface SalePhotoState {
  step: 'idle' | 'analyzing' | 'review' | 'saving';
  pages: PageResult[];
  errorMsg: string | null;
  creatingFor: string | null;
  zoom: string | null;
  dupWarning: string | null;
  justCreated: Product[];
  /** apelido normalizado → product_id, aprendido nos lançamentos anteriores. */
  aliases: Map<string, string>;
  aliasesLoaded: boolean;
  /** Formulário de "novo produto" aberto para uma linha — editável antes de confirmar. */
  createDraft: CreateDraft | null;
  /** Quando várias fotos são escolhidas de uma vez, mostra "foto 2 de 5" etc. */
  batchProgress: BatchProgress | null;
}

const initialState: SalePhotoState = {
  step: 'idle',
  pages: [],
  errorMsg: null,
  creatingFor: null,
  zoom: null,
  dupWarning: null,
  justCreated: [],
  aliases: new Map(),
  aliasesLoaded: false,
  createDraft: null,
  batchProgress: null,
};

let state: SalePhotoState = initialState;
const listeners = new Set<() => void>();

function getState(): SalePhotoState {
  return state;
}

function setState(
  patch: Partial<SalePhotoState> | ((prev: SalePhotoState) => Partial<SalePhotoState>),
): void {
  const partial = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** true enquanto há leitura em andamento ou páginas lidas esperando revisão. */
function hasPendingWork(): boolean {
  return state.step === 'analyzing' || (state.step === 'review' && state.pages.length > 0);
}

function reset(): void {
  setState({
    step: 'idle',
    pages: [],
    errorMsg: null,
    justCreated: [],
    createDraft: null,
    batchProgress: null,
  });
}

export const salePhotoStore = { getState, setState, subscribe, hasPendingWork, reset };
