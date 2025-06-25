document.addEventListener("DOMContentLoaded", loadTasks);

function loadTasks() {
  fetch("/tasks")
    .then(res => res.json())
    .then(tasks => {
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";
      tasks.forEach(task => renderTask(task));
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

function renderTask(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  if (task.status === "Completed") card.classList.add("completed");

  const text = document.createElement("div");
  text.className = "task-text";
  text.innerHTML = `
    <strong>Title:</strong> ${task.title}<br>
    <strong>Description:</strong> ${task.description}<br>
    <strong>Owner:</strong> ${task.owner}
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "task-buttons";

  const completeBtn = document.createElement("button");
  completeBtn.textContent = "Complete";
  completeBtn.className = "complete-button";
  completeBtn.onclick = () => {
    const newStatus = task.status === "Completed" ? "Not Touched" : "Completed";
    fetch("/update-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: newStatus })
    }).then(loadTasks);
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-button";
  deleteBtn.onclick = () => {
    fetch("/delete-task", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id })
    })
      .then(res => {
        if (!res.ok) {
          console.error("Failed to delete task");
          alert("Could not delete task. Server error.");
        } else {
          loadTasks(); // Refresh task list
        }
      });
  };

  buttonContainer.appendChild(completeBtn);
  buttonContainer.appendChild(deleteBtn);
  card.appendChild(text);
  card.appendChild(buttonContainer);

  document.getElementById("taskList").appendChild(card);
}
