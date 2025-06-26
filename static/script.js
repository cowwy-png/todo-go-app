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
      tasks.forEach(task => renderTask(task));
    })
    .catch(err => {
      console.error("Error loading tasks:", err);
      alert("Could not load tasks. Please check your server.");
    });
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

  // Create inner HTML safely
  const taskHTML = `
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

  card.innerHTML = taskHTML;

  // Button event listeners
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
