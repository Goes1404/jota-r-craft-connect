import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
const createQueryBuilder = () => {
  const qb = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    let: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    _data: null as any,
    _error: null as any,
    then: vi.fn((resolve) => resolve({ data: qb._data, error: qb._error })),
  };
  return qb;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(createQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    _getQueryBuilder: createQueryBuilder,
  },
}));
