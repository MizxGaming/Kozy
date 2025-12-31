import { state } from '../core/state.js';
import { elements } from '../core/dom.js';

export function initTodo() {
    renderTodos();
    elements.addTodoBtn.addEventListener('click', addTodo);
    elements.todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });
}

export function renderTodos() {
    const currentTask = elements.taskSelect.value;
    elements.todoList.innerHTML = '';
    elements.taskSelect.innerHTML = '<option value="">-- Select a Task --</option><option value="Just Focus">Just Focus</option>';

    state.todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `<span>${todo.text}</span><div class="todo-actions"><button class="check-btn" onclick="toggleTodo(${index})"><i class="fas fa-check"></i></button><button class="delete-btn" onclick="deleteTodo(${index})"><i class="fas fa-trash"></i></button></div>`;
        elements.todoList.appendChild(li);

        if (!todo.completed) {
            const opt = document.createElement('option');
            opt.value = todo.text;
            opt.innerText = todo.text;
            elements.taskSelect.appendChild(opt);
        }
    });
    
    if (currentTask && elements.taskSelect.querySelector(`option[value="${currentTask}"]`)) {
        elements.taskSelect.value = currentTask;
    }
    localStorage.setItem('cozyTodos', JSON.stringify(state.todos));
}

window.toggleTodo = (i) => { state.todos[i].completed = !state.todos[i].completed; renderTodos(); };
window.deleteTodo = (i) => { state.todos.splice(i, 1); renderTodos(); };

function addTodo() {
    const text = elements.todoInput.value.trim();
    if (text) {
        state.todos.push({ text, completed: false });
        elements.todoInput.value = '';
        renderTodos();
    }
}
