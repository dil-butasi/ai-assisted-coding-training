import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

function isValidTodo(item: unknown): item is Todo {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;
  const { id, title, description, completed, createdAt } = candidate;
  return (
    typeof id === 'string' &&
    typeof title === 'string' &&
    typeof description === 'string' &&
    typeof completed === 'boolean' &&
    // createdAt can be string (serialized) or Date
    (typeof createdAt === 'string' || createdAt instanceof Date)
  );
}

export function isValidTodos(data: unknown): data is Todo[] {
  return Array.isArray(data) && data.every(isValidTodo);
}

export function loadTodos(): Todo[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!isValidTodos(parsed)) {
      // Corrupt data, clear and fallback
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Ensure createdAt are Date instances
    return parsed.map(todo => ({ ...todo, createdAt: new Date(todo.createdAt) }));
  } catch (err) {
    console.warn('[sessionStorage] Failed to load todos:', err);
    // Fallback to empty list on error
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  const serializable = todos.map(todo => ({ ...todo, createdAt: todo.createdAt.toISOString() }));
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}
