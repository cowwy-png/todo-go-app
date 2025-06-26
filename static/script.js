let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allTasks = [];

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  document.getElementById("prevMonth").onclick = () => { currentMonth--; adjustMonth(); loadTasks(); };
  document.getElementById("nextMonth").onclick = () => { currentMonth++; adjustMonth(); loadTasks(); };
});

function adjustMonth() {
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
}

function loadTasks() {
  fetch("/tasks")
    .then(res => res.json())
    .then(tasks => {
      allTasks = tasks;
      renderCalendar(tasks);
      renderTaskList(tasks);
    });
}

function renderCalendar(tasks) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const monthLabel = document.getElementById("calendarMonth");
  monthLabel.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const creationMap = {};
  const dueMap = {};

  tasks.forEach(task => {
    const created = new Date(task.created_at);
    const due = task.due_date ? new Date(task.due_date) : null;

    const createdDay = created.getFullYear() === currentYear && created.getMonth() === currentMonth ? created.getDate() : null;
    const dueDay = due && due.getFullYear() === currentYear && due.getMonth() === currentMonth ? due.getDate() : null;

    if (createdDay) creationMap[createdDay] = true;
    if (dueDay) dueMap[dueDay] = true;
  });

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    div.textContent = day;

    const hasCreated = creationMap[day];
    const hasDue = dueMap[day];

    if (hasCreated && hasDue) div.classList.add("red-blue");
    else if (hasCreated) div.classList.add("red");
    else if (hasDue) div.classList.add("blue");

    div.onclick = () => {
      const dateStr = new Date(currentYear, currentMonth, day).toDateString();
      const filtered = allTasks.filter(t =>
        new Date(t.created_at).toDateString() === dateStr ||
        (t.due_date && new Date(t.due_date).toDateString() === dateStr)
      );
      document.getElementById("filteredLabel").textContent = `Tasks for ${dateStr}`;
      renderTaskList(filtered);
    };

    calendar.appendChild(div);
  }
}

function renderTaskList(tasks) {
  const container = document.getElementById("taskList");
  container.innerHTML = "";

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-card";
    if (task.status === "Completed") card.classList.add("completed");

    card.innerHTML = `
      <div><strong>Title:</strong> ${task.title}</div>
      <div><strong>Description:</strong> ${task.description}</div>
      <div><strong>Owner:</strong> ${task.owner}</div>
      <div><strong>Created:</strong> ${new Date(task.created_at).toLocaleDateString()}</div>
      ${task.due_date ? `<div><strong>Due:</strong> ${new Date(task.due_date).toLocaleDateString()}</div>` : ""}
      <div class="task-buttons">
        <button onclick="toggleStatus(${task.id}, '${task.status}')">Complete</button>
        <button onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const owner = document.getElementById("taskOwner").value.trim();
  const due_date = document.getElementById("taskDueDate").value;

  if (!title || !description || !owner) {
    alert("Please fill out all fields.");
    return;
  }

  fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, owner, due_date })
  }).then(loadTasks);
}

function toggleStatus(id, status) {
  const newStatus = status === "Completed" ? "Not Touched" : "Completed";
  fetch("/update-status", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status: newStatus })
  }).then(loadTasks);
}

function deleteTask(id) {
  fetch("/delete-task", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  }).then(loadTasks);
}
