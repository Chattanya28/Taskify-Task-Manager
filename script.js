// Task Manager Application
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    this.focusMode = false;
    this.streak = this.calculateStreak();
    this.dragStartIndex = null;
    
    this.init();
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.render();
    this.applyTheme();
    this.showToast('Welcome to Taskify! ✨', 2000);
  }

  cacheDom() {
    this.taskList = document.getElementById('task-list');
    this.taskInput = document.getElementById('task-input');
    this.addBtn = document.getElementById('add-btn');
    this.prioritySelect = document.getElementById('priority');
    this.dueDateInput = document.getElementById('due-date');
    this.categorySelect = document.getElementById('category');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.clearCompletedBtn = document.getElementById('clear-completed');
    this.themeToggle = document.getElementById('theme-toggle');
    this.focusBtn = document.getElementById('focus-mode-btn');
    this.searchInput = document.getElementById('search-input');
    this.progressPath = document.getElementById('progress-path');
    this.progressText = document.getElementById('progress-text');
    this.taskCountSpan = document.getElementById('task-count');
    this.activeTasksSpan = document.getElementById('active-tasks-count');
    this.streakSpan = document.getElementById('streak-count');
  }

  bindEvents() {
    this.addBtn.addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
    this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.focusBtn.addEventListener('click', () => this.toggleFocusMode());
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.render();
    });
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentFilter = btn.dataset.filter;
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.render();
      });
    });
    
    // Drag and drop for reordering
    this.taskList.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('task-item')) {
        this.dragStartIndex = parseInt(e.target.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
      }
    });
    
    this.taskList.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    
    this.taskList.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetItem = e.target.closest('.task-item');
      if (targetItem && this.dragStartIndex !== null) {
        const dragEndIndex = parseInt(targetItem.dataset.index);
        if (this.dragStartIndex !== dragEndIndex) {
          this.reorderTasks(this.dragStartIndex, dragEndIndex);
        }
      }
      this.dragStartIndex = null;
    });
  }

  reorderTasks(from, to) {
    const [movedTask] = this.tasks.splice(from, 1);
    this.tasks.splice(to, 0, movedTask);
    this.saveTasks();
    this.render();
    this.showToast('Task reordered', 1000);
  }

  addTask() {
    const text = this.taskInput.value.trim();
    if (!text) {
      this.showToast('Please enter a task!', 1500);
      return;
    }

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      priority: this.prioritySelect.value,
      dueDate: this.dueDateInput.value,
      category: this.categorySelect.value,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.taskInput.value = '';
    this.dueDateInput.value = '';
    this.render();
    this.showToast('Task added! 🎯', 1000);
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveTasks();
    this.render();
    this.showToast('Task deleted', 800);
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
      
      // Update streak if task completed today
      if (task.completed) {
        this.updateStreak();
      }
    }
  }

  clearCompleted() {
    const completedCount = this.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      this.showToast('No completed tasks', 1000);
      return;
    }
    this.tasks = this.tasks.filter(task => !task.completed);
    this.saveTasks();
    this.render();
    this.showToast(`Cleared ${completedCount} completed tasks`, 1500);
  }

  calculateStreak() {
    const savedStreak = localStorage.getItem('taskStreak');
    const lastActive = localStorage.getItem('lastActiveDate');
    const today = new Date().toDateString();
    
    if (lastActive === today) {
      return parseInt(savedStreak) || 0;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActive === yesterday.toDateString()) {
      const newStreak = (parseInt(savedStreak) || 0) + 1;
      localStorage.setItem('taskStreak', newStreak);
      localStorage.setItem('lastActiveDate', today);
      return newStreak;
    }
    
    localStorage.setItem('taskStreak', 0);
    localStorage.setItem('lastActiveDate', today);
    return 0;
  }

  updateStreak() {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('lastActiveDate');
    
    if (lastActive !== today) {
      this.streak = this.calculateStreak();
      if (this.streakSpan) this.streakSpan.textContent = this.streak;
      this.showToast(`🔥 ${this.streak} day streak!`, 1500);
    }
  }

  getFilteredTasks() {
    let filtered = [...this.tasks];
    
    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(task => 
        task.text.toLowerCase().includes(this.searchQuery) ||
        task.category.toLowerCase().includes(this.searchQuery)
      );
    }
    
    // Apply status filter
    switch (this.currentFilter) {
      case 'active':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate).toDateString() === today;
        });
        break;
    }
    
    return filtered;
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active = total - completed;
    const percentage = total === 0 ? 0 : (completed / total) * 100;
    
    const circumference = 100;
    const dashArray = (percentage / 100) * circumference;
    this.progressPath.style.strokeDasharray = `${dashArray}, ${circumference}`;
    this.progressText.textContent = `${Math.round(percentage)}%`;
    this.taskCountSpan.textContent = `${total} tasks • ${completed} completed`;
    this.activeTasksSpan.textContent = active;
    
    if (this.streakSpan) this.streakSpan.textContent = this.streak;
  }

  isOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
  }

  render() {
    const filteredTasks = this.getFilteredTasks();
    
    if (filteredTasks.length === 0) {
      this.taskList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <p>No tasks found</p>
          <small>Add a new task to get started!</small>
        </div>
      `;
      this.updateStats();
      return;
    }
    
    this.taskList.innerHTML = filteredTasks.map((task, idx) => {
      const originalIndex = this.tasks.findIndex(t => t.id === task.id);
      const isOverdue = this.isOverdue(task.dueDate) && !task.completed;
      
      return `
        <li class="task-item ${task.completed ? 'completed' : ''}" 
            draggable="true" 
            data-index="${originalIndex}">
          <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
               onclick="taskManager.toggleComplete(${task.id})">
            ${task.completed ? '<i class="fas fa-check"></i>' : ''}
          </div>
          <div class="task-text">${this.escapeHtml(task.text)}</div>
          <div class="task-meta">
            <span class="priority-dot priority-${task.priority}"></span>
            <span class="category-badge">${task.category}</span>
            ${task.dueDate ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">
              <i class="far fa-calendar-alt"></i> ${new Date(task.dueDate).toLocaleDateString()}
            </span>` : ''}
          </div>
          <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </li>
      `;
    }).join('');
    
    this.updateStats();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode);
    this.applyTheme();
    this.showToast(this.darkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 1000);
  }

  applyTheme() {
    if (this.darkMode) {
      document.body.classList.add('dark');
      this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('dark');
      this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  toggleFocusMode() {
    this.focusMode = !this.focusMode;
    if (this.focusMode) {
      document.body.classList.add('focus-mode');
      this.focusBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      this.showToast('Focus mode enabled - stay productive! 🎯', 1500);
    } else {
      document.body.classList.remove('focus-mode');
      this.focusBtn.innerHTML = '<i class="fas fa-eye"></i>';
      this.showToast('Focus mode disabled', 1000);
    }
  }

  showToast(message, duration = 2000) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  loadTasks() {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }
}

// Initialize app
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
  taskManager = new TaskManager();
  window.taskManager = taskManager;
});
