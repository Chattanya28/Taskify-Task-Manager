const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const progressPath = document.getElementById('progress-path');
const progressText = document.getElementById('progress-text');
const taskCountEl = document.getElementById('task-count');
const clearCompleted = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function calculateProgress() {
  if (tasks.length === 0) {
    progressPath.setAttribute('stroke-dasharray', '0, 100');
    progressText.textContent = '0%';
    return;
  }
  const completed = tasks.filter(t => t.completed).length;
  const percent = Math.round((completed / tasks.length) * 100);
  progressPath.setAttribute('stroke-dasharray', `${percent}, 100`);
  progressText.textContent = `${percent}%`;
}

function updateTaskCount() {
  const active = tasks.filter(t => !t.completed).length;
  const completed = tasks.length - active;
  taskCountEl.textContent = `${tasks.length} tasks • ${completed} completed`;
}

function renderTasks() {
  taskList.innerHTML = '';

  const filtered = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  if (filtered.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <h3>No tasks yet</h3>
        <p>Add a new task to get started</p>
      </div>`;
    calculateProgress();
    updateTaskCount();
    return;
  }

  filtered.forEach((task, globalIndex) => {
    const index = tasks.indexOf(task); // real index in array

    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.draggable = true;
    li.dataset.index = index;

    li.innerHTML = `
      <div class="priority-dot priority-${task.priority || 'medium'}"></div>
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-index="${index}">
        ${task.completed ? '<i class="fas fa-check"></i>' : ''}
      </div>
      <div class="task-text">
        <span>${task.text}</span>
        <div style="margin-top:6px; font-size:13px; display:flex; gap:10px; flex-wrap:wrap;">
          ${task.dueDate ? `<span class="due-date">📅 ${task.dueDate}</span>` : ''}
          <span style="color:#777;">#${task.category || 'Personal'}</span>
        </div>
      </div>
      <button class="delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
    `;

    taskList.appendChild(li);
  });

  calculateProgress();
  updateTaskCount();
}

// Add task
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    text,
    completed: false,
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('due-date').value || null,
    category: document.getElementById('category').value
  });

  taskInput.value = '';
  saveTasks();
  renderTasks();
}

// Drag and Drop reordering
taskList.addEventListener('dragstart', e => {
  if (e.target.classList.contains('task-item')) {
    e.target.classList.add('dragging');
  }
});

taskList.addEventListener('dragend', e => {
  e.target.classList.remove('dragging');
  const draggedIndex = parseInt(e.target.dataset.index);
  // Reorder tasks array based on new DOM order
  const newOrder = Array.from(taskList.children).map(item => parseInt(item.dataset.index));
  tasks = newOrder.map(i => tasks[i]);
  saveTasks();
  renderTasks();
});

taskList.addEventListener('dragover', e => {
  e.preventDefault();
  const dragging = document.querySelector('.dragging');
  const afterElement = getDragAfterElement(taskList, e.clientY);
  if (afterElement == null) {
    taskList.appendChild(dragging);
  } else {
    taskList.insertBefore(dragging, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Event listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });

taskList.addEventListener('click', e => {
  const index = e.target.closest('[data-index]')?.dataset.index;
  if (!index) return;

  if (e.target.closest('.task-checkbox')) {
    tasks[index].completed = !tasks[index].completed;
  }
  if (e.target.closest('.delete-btn')) {
    if (confirm('Delete this task?')) tasks.splice(index, 1);
  }
  saveTasks();
  renderTasks();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Init
function init() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  renderTasks();
}

init();