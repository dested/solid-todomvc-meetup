import type {Component} from 'solid-js';

import styles from './App.module.css';
import {TodoList} from './todo/todoList';

const App: Component = () => {
  return (
    <div class={styles.App}>
      <TodoList></TodoList>
    </div>
  );
};

export default App;
