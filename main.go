package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type Task struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"`
}

var db *sql.DB

func main() {
	initDB()

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.html")
	})

	http.HandleFunc("/tasks", tasksHandler)
	http.HandleFunc("/update-status", updateStatusHandler)

	fmt.Println("Server running at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./task.db")
	if err != nil {
		panic(err)
	}

	query := `
	CREATE TABLE IF NOT EXISTS tasks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		status TEXT NOT NULL
	);`
	_, err = db.Exec(query)
	if err != nil {
		panic(err)
	}
}

func tasksHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		tasks, err := getAllTasks()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(tasks)

	case "POST":
		var t Task
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if err := insertTask(t.Title); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(http.StatusCreated)
	}
}

func updateStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	var t Task
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	err := updateTaskStatus(t.ID, t.Status)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func getAllTasks() ([]Task, error) {
	rows, err := db.Query("SELECT id, title, status FROM tasks")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var t Task
		rows.Scan(&t.ID, &t.Title, &t.Status)
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func insertTask(title string) error {
	_, err := db.Exec("INSERT INTO tasks (title, status) VALUES (?, ?)", title, "Not Touched")
	return err
}

func updateTaskStatus(id int, status string) error {
	_, err := db.Exec("UPDATE tasks SET status = ? WHERE id = ?", status, id)
	return err
}
