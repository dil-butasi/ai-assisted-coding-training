import React, { useState, useEffect } from 'react';
import type { Todo } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';
import { Snackbar, Alert } from '@mui/material';
import { loadTodos, saveTodos } from '../utils/sessionStorage';
import { TodoContext } from './TodoContextType';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [quotaError, setQuotaError] = useState<boolean>(false);

  const addTodo = (title: string, description: string) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
    };
    setTodos([...todos, newTodo]);
  };

  const editTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const toggleTodoCompletion = (id: string) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Persist todos to sessionStorage on every change
  useEffect(() => {
    try {
      saveTodos(todos);
    } catch (err: unknown) {
      if (
        (typeof err === 'object' &&
          err !== null &&
          'name' in err &&
          err.name === 'QuotaExceededError') ||
        (typeof err === 'object' && err !== null && 'code' in err && err.code === 22)
      ) {
        console.warn('Storage quota exceeded – your latest changes may not be saved.', err);
        setQuotaError(true);
      } else {
        console.warn('Failed to persist todos:', err);
      }
    }
  }, [todos]);

  return (
    <TodoContext.Provider value={{ todos, addTodo, editTodo, toggleTodoCompletion, deleteTodo }}>
      {children}
      <Snackbar
        open={quotaError}
        autoHideDuration={6000}
        onClose={() => setQuotaError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setQuotaError(false)} severity="warning" sx={{ width: '100%' }}>
          Storage quota exceeded – your latest changes may not be saved.
        </Alert>
      </Snackbar>
    </TodoContext.Provider>
  );
};

// No re-exports to avoid react-refresh/only-export-components error
