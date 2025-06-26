document.addEventListener("DOMContentLoaded", loadTasks);

function loadTasks() {
  fetch("/tasks")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    })
    .then(tasks => {
      if (!Array.isArray(tasks)) throw new Error("Invalid tasks data");

      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      const createdDates = [];

      tasks.forEach(task => {
        renderTask(task);
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
  if (!calendar) return;
  
  calendar.innerHTML = "<h3>Task Calendar</h3><div class='calendar-grid'></div>";
  const calendarGrid = calendar.querySelector('.calendar-grid');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const creationDates = new Set(taskDates.map(d => new Date(d).getDate()));

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-day empty";
    calendarGrid.appendChild(emptyDiv);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = day;

    if (creationDates.has(day)) {
      dayDiv.classList.add("has-task");
    }

    calendarGrid.appendChild(dayDiv);
  }
}

function addTask() {
  const titleInput = document.getElementById("taskTitle");
  const descriptionInput = document.getElementById("taskDescription");
  const ownerInput = document.getElementById("taskOwner");

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const owner = ownerInput.value.trim();

  if (title === "" || description === "" || owner === "") {
    alert("Please fill out all fields.");
    return;
  }

  fetch("/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
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

  card.querySelector('.complete-button').onclick = () => {
    const newStatus = task.status === "Completed" ? "Not Touched" : "Completed";
    fetch("/update-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: newStatus })
    }).then(loadTasks);
  };

  card.querySelector('.delete-button').onclick = () => {
    fetch("/delete-task", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id })
    }).then(loadTasks);
  };

  document.getElementById("taskList").appendChild(card);
}