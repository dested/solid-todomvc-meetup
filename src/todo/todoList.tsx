import {createMemo, createEffect, onCleanup, Component, Show, For} from 'solid-js';
import {createStore} from 'solid-js/store';
import {render} from 'solid-js/web';

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;
declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      setFocus: true;
    }
  }
}
const setFocus = (el: HTMLElement) => setTimeout(() => el.focus());

const LOCAL_STORAGE_KEY = 'todos-solid';
function createLocalStore<T extends {}>(value: T) {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  const [state, setState] = createStore<T>(stored ? JSON.parse(stored) : value);

  // JSON.stringify creates deps on every iterable field
  createEffect(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)));
  return [state, setState] as const;
}
type Todo = {completed: boolean; id: number; title: string};
export const TodoList: Component = () => {
  const [state, setState] = createLocalStore<{
      counter: number;
      todos: Todo[];
      showMode: 'all' | 'active' | 'completed';
      editingTodoId: null | number;
    }>({
      counter: 1,
      todos: [],
      showMode: 'all',
      editingTodoId: null,
    }),
    remainingCount = createMemo(() => state.todos.length - state.todos.filter((todo) => todo.completed).length),
    filterList = (todos: Todo[]) => {
      if (state.showMode === 'active') return todos.filter((todo) => !todo.completed);
      else if (state.showMode === 'completed') return todos.filter((todo) => todo.completed);
      else return todos;
    },
    removeTodo = (todoId: number) => setState('todos', (t) => t.filter((item) => item.id !== todoId)),
    editTodo = (todo: Partial<Todo>) => setState('todos', (item) => item.id === todo.id, todo),
    clearCompleted = () => setState('todos', (t) => t.filter((todo) => !todo.completed)),
    toggleAll = (completed: boolean) => setState('todos', (todo) => todo.completed !== completed, {completed}),
    setEditing = (todoId: number | null) => setState('editingTodoId', todoId),
    addTodo = ({target, keyCode}: any) => {
      const title = target.value.trim();
      if (keyCode === ENTER_KEY && title) {
        setState({
          todos: [{title, id: state.counter, completed: false}, ...state.todos],
          counter: state.counter + 1,
        });
        target.value = '';
      }
    },
    save = (todoId: number, {target: {value}}: any) => {
      const title = value.trim();
      if (state.editingTodoId === todoId && title) {
        editTodo({id: todoId, completed: false, title});
        setEditing(null);
      }
    },
    toggle = (todoId: number, {target: {checked}}: any) => editTodo({id: todoId, completed: checked}),
    doneEditing = (todoId: number, e: any) => {
      if (e.keyCode === ENTER_KEY) save(todoId, e);
      else if (e.keyCode === ESCAPE_KEY) setEditing(null);
    };

  const locationHandler = () => setState('showMode', (location.hash.slice(2) as any) || 'all');
  window.addEventListener('hashchange', locationHandler);
  onCleanup(() => window.removeEventListener('hashchange', locationHandler));

  return (
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
      </header>

      <Show when={state.todos.length > 0}>
        <section class="main">
          <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={!remainingCount()}
            onInput={({target: {checked}}: any) => toggleAll(checked)}
          />
          <label for="toggle-all" />
          <ul class="todo-list">
            <For each={filterList(state.todos)}>
              {(todo) => (
                <li class="todo" classList={{editing: state.editingTodoId === todo.id, completed: todo.completed}}>
                  <div class="view">
                    <input class="toggle" type="checkbox" checked={todo.completed} onInput={[toggle, todo.id]} />
                    <label onDblClick={[setEditing, todo.id]}>{todo.title}</label>
                    <button class="destroy" onClick={[removeTodo, todo.id]} />
                  </div>
                  <Show when={state.editingTodoId === todo.id}>
                    <input
                      class="edit"
                      value={todo.title}
                      onFocusOut={[save, todo.id]}
                      onKeyUp={[doneEditing, todo.id]}
                      use:setFocus
                    />
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </section>

        <footer class="footer">
          <span class="todo-count">
            <strong>{remainingCount()}</strong> {remainingCount() === 1 ? ' item ' : ' items '} left
          </span>
          <ul class="filters">
            <li>
              <a href="#/" classList={{selected: state.showMode === 'all'}}>
                All
              </a>
            </li>
            <li>
              <a href="#/active" classList={{selected: state.showMode === 'active'}}>
                Active
              </a>
            </li>
            <li>
              <a href="#/completed" classList={{selected: state.showMode === 'completed'}}>
                Completed
              </a>
            </li>
          </ul>
          <Show when={remainingCount() !== state.todos.length}>
            <button class="clear-completed" onClick={clearCompleted}>
              Clear completed
            </button>
          </Show>
        </footer>
      </Show>
    </section>
  );
};
