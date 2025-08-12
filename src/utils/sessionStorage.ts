import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates if an object is a valid Todo
 */
function isValidTodo(obj: unknown): obj is Todo {
  if (!obj || typeof obj !== 'object') return false;

  const todo = obj as Record<string, unknown>;

  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.description === 'string' &&
    typeof todo.completed === 'boolean' &&
    (todo.createdAt instanceof Date || typeof todo.createdAt === 'string')
  );
}

/**
 * Validates if an array contains only valid Todo objects
 */
export function isValidTodos(data: unknown): data is Todo[] {
  return Array.isArray(data) && data.every(isValidTodo);
}

/**
 * Loads todos from sessionStorage
 * Returns empty array if storage is empty, corrupt, or contains invalid data
 */
export function loadTodos(): Todo[] {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    // Validate the parsed data
    if (!isValidTodos(parsed)) {
      console.warn('Invalid todos data found in sessionStorage, clearing storage');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Convert createdAt strings back to Date objects
    return parsed.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
    }));
  } catch (error) {
    console.warn('Failed to load todos from sessionStorage:', error);
    // Clear corrupted data
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      console.warn('Failed to clear corrupted sessionStorage data:', clearError);
    }
    return [];
  }
}

/**
 * Saves todos to sessionStorage
 * Returns true if successful, false if failed (e.g., quota exceeded)
 */
export function saveTodos(todos: Todo[]): boolean {
  try {
    const serialized = JSON.stringify(todos);
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('SessionStorage quota exceeded - unable to save todos');
      // Don't clear existing data, just fail to save new data
      return false;
    }

    console.warn('Failed to save todos to sessionStorage:', error);
    return false;
  }
}

/**
 * Clears todos from sessionStorage
 */
export function clearTodos(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear todos from sessionStorage:', error);
  }
}
