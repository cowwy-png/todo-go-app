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
  const taskInput = document.getElementById("taskInput");
  const title = taskInput.value.trim();
  if (title === "") {
    alert("Please input a task.");
    return;
  }

  fetch("/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title: title })
  }).then(() => {
    taskInput.value = "";
    loadTasks();
  });
}

function renderTask(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  if (task.status === "Completed") card.classList.add("completed");

  const text = document.createElement("div");
  text.className = "task-text";
  text.textContent = task.title;

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

  // Optional: Delete Button (you can remove this block if not needed)
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-button";
  deleteBtn.onclick = () => {
    fetch("/delete-task", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id })
    }).then(loadTasks);
  };

  buttonContainer.appendChild(completeBtn);
  buttonContainer.appendChild(deleteBtn);
  card.appendChild(text);
  card.appendChild(buttonContainer);

  document.getElementById("taskList").appendChild(card);
}
