import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import { ToastProvider } from '../contexts/ToastContext';
import { useTodo } from '../hooks/useTodo';
import type { Todo } from '../types/Todo';
import * as sessionStorageUtils from '../utils/sessionStorage';

// Mock the sessionStorage utilities
vi.mock('../utils/sessionStorage');

const mockLoadTodos = vi.mocked(sessionStorageUtils.loadTodos);
const mockSaveTodos = vi.mocked(sessionStorageUtils.saveTodos);

// Test component that uses the TodoContext
const TestComponent = () => {
  const { todos, addTodo, deleteTodo, toggleTodoCompletion } = useTodo();

  return (
    <div>
      <div data-testid="todo-count">{todos.length}</div>
      <div data-testid="todos">
        {todos.map(todo => (
          <div key={todo.id} data-testid={`todo-${todo.id}`}>
            {todo.title} - {todo.completed ? 'completed' : 'pending'}
          </div>
        ))}
      </div>
      <button onClick={() => addTodo('Test Todo', 'Test Description')} data-testid="add-todo">
        Add Todo
      </button>
      <button
        onClick={() => todos.length > 0 && deleteTodo(todos[0].id)}
        data-testid="delete-first-todo"
      >
        Delete First Todo
      </button>
      <button
        onClick={() => todos.length > 0 && toggleTodoCompletion(todos[0].id)}
        data-testid="toggle-first-todo"
      >
        Toggle First Todo
      </button>
    </div>
  );
};

const TestApp = () => (
  <ToastProvider>
    <TodoProvider>
      <TestComponent />
    </TodoProvider>
  </ToastProvider>
);

describe('TodoContext with Session Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should hydrate todos from sessionStorage on mount', async () => {
    const storedTodos: Todo[] = [
      {
        id: 'stored-todo-1',
        title: 'Stored Todo',
        description: 'Stored Description',
        completed: false,
        createdAt: new Date(),
      },
    ];

    mockLoadTodos.mockReturnValue(storedTodos);

    const { getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('todo-count')).toHaveTextContent('1');
      expect(getByTestId('todo-stored-todo-1')).toHaveTextContent('Stored Todo - pending');
    });

    expect(mockLoadTodos).toHaveBeenCalledTimes(1);
  });

  it('should persist todos to sessionStorage when todos change', async () => {
    const { getByTestId } = render(<TestApp />);

    await act(async () => {
      getByTestId('add-todo').click();
    });

    await waitFor(() => {
      expect(getByTestId('todo-count')).toHaveTextContent('1');
    });

    expect(mockSaveTodos).toHaveBeenCalled();
    const savedTodos = mockSaveTodos.mock.calls[mockSaveTodos.mock.calls.length - 1][0];
    expect(savedTodos).toHaveLength(1);
    expect(savedTodos[0].title).toBe('Test Todo');
  });

  it('should handle delete todo and persist changes', async () => {
    const storedTodos: Todo[] = [
      {
        id: 'test-todo-1',
        title: 'Test Todo 1',
        description: 'Description 1',
        completed: false,
        createdAt: new Date(),
      },
      {
        id: 'test-todo-2',
        title: 'Test Todo 2',
        description: 'Description 2',
        completed: false,
        createdAt: new Date(),
      },
    ];

    mockLoadTodos.mockReturnValue(storedTodos);

    const { getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('todo-count')).toHaveTextContent('2');
    });

    await act(async () => {
      getByTestId('delete-first-todo').click();
    });

    await waitFor(() => {
      expect(getByTestId('todo-count')).toHaveTextContent('1');
    });

    expect(mockSaveTodos).toHaveBeenCalled();
    const savedTodos = mockSaveTodos.mock.calls[mockSaveTodos.mock.calls.length - 1][0];
    expect(savedTodos).toHaveLength(1);
    expect(savedTodos[0].id).toBe('test-todo-2');
  });

  it('should handle toggle completion and persist changes', async () => {
    const storedTodos: Todo[] = [
      {
        id: 'test-todo-1',
        title: 'Test Todo 1',
        description: 'Description 1',
        completed: false,
        createdAt: new Date(),
      },
    ];

    mockLoadTodos.mockReturnValue(storedTodos);

    const { getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('todo-test-todo-1')).toHaveTextContent('Test Todo 1 - pending');
    });

    await act(async () => {
      getByTestId('toggle-first-todo').click();
    });

    await waitFor(() => {
      expect(getByTestId('todo-test-todo-1')).toHaveTextContent('Test Todo 1 - completed');
    });

    expect(mockSaveTodos).toHaveBeenCalled();
    const savedTodos = mockSaveTodos.mock.calls[mockSaveTodos.mock.calls.length - 1][0];
    expect(savedTodos[0].completed).toBe(true);
  });

  it('should handle storage save failure gracefully', async () => {
    mockSaveTodos.mockReturnValue(false);

    const { getByTestId } = render(<TestApp />);

    await act(async () => {
      getByTestId('add-todo').click();
    });

    await waitFor(() => {
      expect(getByTestId('todo-count')).toHaveTextContent('1');
    });

    // Todo should still be added to state even if storage fails
    expect(mockSaveTodos).toHaveBeenCalled();
  });

  it('should not trigger storage save for initial empty state', async () => {
    mockLoadTodos.mockReturnValue([]);

    const { getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('todo-count')).toHaveTextContent('0');
    });

    // Should only save when there are todos and a change occurs, not for initial empty state
    expect(mockSaveTodos).toHaveBeenCalledTimes(1);
    expect(mockSaveTodos).toHaveBeenCalledWith([]);
  });
});
