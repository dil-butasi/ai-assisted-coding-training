import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadTodos, saveTodos, isValidTodos, clearTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Test data
const validTodo: Todo = {
  id: 'test-id',
  title: 'Test Todo',
  description: 'Test Description',
  completed: false,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
};

const validTodos: Todo[] = [
  validTodo,
  {
    id: 'test-id-2',
    title: 'Test Todo 2',
    description: 'Test Description 2',
    completed: true,
    createdAt: new Date('2023-01-02T00:00:00.000Z'),
  },
];

describe('sessionStorage utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidTodos', () => {
    it('should return true for valid todos array', () => {
      expect(isValidTodos(validTodos)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isValidTodos([])).toBe(true);
    });

    it('should return false for non-array', () => {
      expect(isValidTodos('not an array')).toBe(false);
      expect(isValidTodos({})).toBe(false);
      expect(isValidTodos(null)).toBe(false);
      expect(isValidTodos(undefined)).toBe(false);
    });

    it('should return false for array with invalid todos', () => {
      expect(isValidTodos([{ id: 'test' }])).toBe(false);
      expect(
        isValidTodos([{ id: 123, title: 'test', description: 'test', completed: false }])
      ).toBe(false);
      expect(
        isValidTodos([{ id: 'test', title: 123, description: 'test', completed: false }])
      ).toBe(false);
      expect(isValidTodos([{ id: 'test', title: 'test', completed: false }])).toBe(false); // missing description
    });

    it('should return true for todos with string createdAt', () => {
      const todosWithStringDate = [
        {
          id: 'test-id',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
      expect(isValidTodos(todosWithStringDate)).toBe(true);
    });
  });

  describe('loadTodos', () => {
    it('should return empty array when sessionStorage is empty', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('todos');
    });

    it('should load and parse valid todos from sessionStorage', () => {
      const serialized = JSON.stringify(validTodos);
      mockSessionStorage.getItem.mockReturnValue(serialized);

      const result = loadTodos();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-id');
      expect(result[0].title).toBe('Test Todo');
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].completed).toBe(true);
    });

    it('should handle corrupt JSON data gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json {');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load todos from sessionStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid todo structure gracefully', () => {
      const invalidTodos = [{ id: 'test', invalid: 'data' }];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(invalidTodos));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid todos data found in sessionStorage, clearing storage'
      );

      consoleSpy.mockRestore();
    });

    it('should handle sessionStorage access errors', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load todos from sessionStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveTodos', () => {
    it('should save todos to sessionStorage successfully', () => {
      const result = saveTodos(validTodos);

      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', JSON.stringify(validTodos));
    });

    it('should handle QuotaExceededError gracefully', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveTodos(validTodos);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'SessionStorage quota exceeded - unable to save todos'
      );

      consoleSpy.mockRestore();
    });

    it('should handle other storage errors gracefully', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveTodos(validTodos);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save todos to sessionStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should save empty array successfully', () => {
      const result = saveTodos([]);

      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', '[]');
    });
  });

  describe('clearTodos', () => {
    it('should remove todos from sessionStorage', () => {
      clearTodos();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
    });

    it('should handle storage errors gracefully when clearing', () => {
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      clearTodos();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear todos from sessionStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
