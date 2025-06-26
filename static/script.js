document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  setupCalendarNavigation();
});

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function loadTasks(filterDate = null) {
  fetch("/tasks")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    })
    .then(tasks => {
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      const createdDates = [];

      tasks.forEach(task => {
        if (!filterDate || new Date(task.created_at).toDateString() === filterDate.toDateString()) {
          renderTask(task);
        }
        if (task.created_at) createdDates.push(task.created_at);
      });

      renderCalendar(createdDates);
    })
    .catch(err => {
      console.error("Error loading tasks:", err);
      alert("Could not load tasks. Please check your server.");
    });
}

function renderCalendar(taskDates) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "<div class='calendar-grid'></div>";
  const grid = calendar.querySelector(".calendar-grid");

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const creationDates = new Set(taskDates.map(d => new Date(d).toDateString()));

  document.getElementById("currentMonthYear").textContent = `${new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} ${currentYear}`;

  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-day empty";
    grid.appendChild(emptyDiv);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toDateString();

    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = day;

    if (creationDates.has(dateStr)) {
      dayDiv.classList.add("has-task");
    }

    if (date.toDateString() === new Date().toDateString()) {
      dayDiv.classList.add("today");
    }

    dayDiv.onclick = () => loadTasks(date);

    grid.appendChild(dayDiv);
  }
}

function setupCalendarNavigation() {
  document.getElementById("prevMonth").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    loadTasks();
  };

  document.getElementById("nextMonth").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    loadTasks();
  };
}

function addTask() {
  const titleInput = document.getElementById("taskTitle");
  const descriptionInput = document.getElementById("taskDescription");
  const ownerInput = document.getElementById("taskOwner");

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const owner = ownerInput.value.trim();

  if (!title || !description || !owner) {
    alert("Please fill out all fields.");
    return;
  }

  fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, owner })
  }).then(() => {
    titleInput.value = "";
    descriptionInput.value = "";
    ownerInput.value = "";
    loadTasks();
  });
}

function renderTask(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  if (task.status === "Completed") card.classList.add("completed");

  card.innerHTML = `
    <div class="task-content">
      <div class="task-text">
        <strong>Title:</strong> ${task.title}<br>
        <strong>Description:</strong> ${task.description}<br>
        <strong>Owner:</strong> ${task.owner}<br>
        <div class="task-date"><strong>Created:</strong> ${new Date(task.created_at).toLocaleDateString()}</div>
      </div>
    </div>
    <div class="task-buttons">
      <button class="complete-button">Complete</button>
      <button class="delete-button">Delete</button>
    </div>
  `;

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

  document.getElementById("taskList").appendChild(card);
}
