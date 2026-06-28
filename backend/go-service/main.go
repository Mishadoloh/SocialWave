package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	_ "modernc.org/sqlite"
)

type Metrics struct {
	TotalUsers    int `json:"total_users"`
	TotalPosts    int `json:"total_posts"`
	TotalComments int `json:"total_comments"`
	TotalLikes    int `json:"total_likes"`
}

type ExplorePost struct {
	ID         int    `json:"id"`
	Content    string `json:"content"`
	Image      string `json:"image_url"`
	Video      string `json:"video_url"`
	CreatedAt  string `json:"created_at"`
	Username   string `json:"username"`
	LikesCount int    `json:"likes_count"`
}

var db *sql.DB

func main() {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "../db.sqlite3" // fallback local
	}

	var err error
	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Failed to open SQLite database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping SQLite database: %v", err)
	}
	log.Printf("Successfully connected to SQLite database at %s", dbPath)

	http.HandleFunc("/api/go/metrics", handleMetrics)
	http.HandleFunc("/api/go/explore", handleExplore)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Go service starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("HTTP server failed: %v", err)
	}
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	var metrics Metrics

	// Query counts
	err := db.QueryRow("SELECT COUNT(*) FROM users_user").Scan(&metrics.TotalUsers)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT COUNT(*) FROM posts_post").Scan(&metrics.TotalPosts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT COUNT(*) FROM posts_comment").Scan(&metrics.TotalComments)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT COUNT(*) FROM posts_like").Scan(&metrics.TotalLikes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func handleExplore(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	rows, err := db.Query(`
		SELECT p.id, p.content, COALESCE(p.image, ''), COALESCE(p.video, ''), p.created_at, u.username,
		       (SELECT COUNT(*) FROM posts_like WHERE post_id = p.id) as likes_count
		FROM posts_post p
		JOIN users_user u ON p.author_id = u.id
		ORDER BY likes_count DESC
		LIMIT 12
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []ExplorePost
	for rows.Next() {
		var p ExplorePost
		err := rows.Scan(&p.ID, &p.Content, &p.Image, &p.Video, &p.CreatedAt, &p.Username, &p.LikesCount)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// Format image/video URLs to absolute path if not empty
		if p.Image != "" {
			p.Image = "/media/" + p.Image
		}
		if p.Video != "" {
			p.Video = "/media/" + p.Video
		}
		posts = append(posts, p)
	}

	w.Header().Set("Content-Type", "application/json")
	if posts == nil {
		posts = []ExplorePost{}
	}
	json.NewEncoder(w).Encode(posts)
}
