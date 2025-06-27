document.addEventListener("DOMContentLoaded", () => {
  initCalendar();
  loadTasks();
});

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allTasks = [];

function loadTasks() {
  fetch("/tasks")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    })
    .then(tasks => {
      if (!Array.isArray(tasks)) throw new Error("Invalid tasks data");
      allTasks = tasks;
      renderTasks(tasks);
      renderCalendar(currentMonth, currentYear, tasks);
    })
    .catch(err => {
      console.error("Error loading tasks:", err);
      alert("Could not load tasks. Please check your server.");
    });
}

function renderTasks(tasks) {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  document.getElementById("filteredLabel").textContent =
    tasks.length === allTasks.length
      ? "All Tasks"
      : `Filtered Tasks (${tasks.length})`;

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-card";
    if (task.status === "Completed") card.classList.add("completed");
    else if (task.status === "In Progress") card.classList.add("in-progress");

    card.innerHTML = `
      <div class="task-content">
        <div class="task-text">
          <strong>Title:</strong> ${task.title}<br>
          <strong>Description:</strong> ${task.description}<br>
          <strong>Owner:</strong> ${task.owner}<br>
          <div class="task-date">
            <strong>Created:</strong> ${new Date(task.created_at).toLocaleDateString()}<br>
            <strong>Status:</strong> ${task.status}
          </div>
        </div>
      </div>
      <div class="task-buttons">
        <button class="in-progress-button">In Progress</button>
        <button class="complete-button">Complete</button>
        <button class="delete-button">Delete</button>
      </div>
    `;

    card.querySelector(".in-progress-button").onclick = () => {
      fetch("/update-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: "In Progress" })
      }).then(loadTasks);
    };

    card.querySelector(".complete-button").onclick = () => {
      const newStatus = task.status === "Completed" ? "Not Touched" : "Completed";
      fetch("/update-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus })
      }).then(loadTasks);
    };

    card.querySelector(".delete-button").onclick = () => {
      fetch("/delete-task", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id })
      }).then(loadTasks);
    };

    taskList.appendChild(card);
  });
}

function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const owner = document.getElementById("taskOwner").value.trim();

  if (!title || !description || !owner) {
    alert("Please fill out all fields.");
    return;
  }

  fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, owner })
  }).then(() => {
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDescription").value = "";
    document.getElementById("taskOwner").value = "";
    loadTasks();
  });
}

function initCalendar() {
  document.getElementById("prevMonth").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear, allTasks);
  };

  document.getElementById("nextMonth").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear, allTasks);
  };

  document.getElementById("showAllBtn").onclick = showAllTasks;
}

function showAllTasks() {
  renderTasks(allTasks);
}

function renderCalendar(month, year, tasks) {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const calendar = document.getElementById("calendar");
  const calendarMonth = document.getElementById("calendarMonth");

  if (calendarMonth) {
    calendarMonth.textContent = `${monthNames[month]} ${year}`;
  }

  calendar.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const createdDates = new Map();

  tasks.forEach(task => {
    const created = new Date(task.created_at);
    const key = `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`;
    createdDates.set(key, true);
  });

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day";
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${month}-${day}`;
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = day;

    if (createdDates.has(dateKey)) {
      dayDiv.classList.add("red");
    }

    dayDiv.onclick = () => {
      const filtered = allTasks.filter(task => {
        const c = new Date(task.created_at);
        return c.getFullYear() === year &&
               c.getMonth() === month &&
               c.getDate() === day;
      });
      renderTasks(filtered);
    };

    calendar.appendChild(dayDiv);
  }
}
