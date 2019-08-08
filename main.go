package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/pusher/pusher-http-go"
	"golang.org/x/xerrors"
)

var (
	client *pusher.Client
)

type User struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	IsAdmin bool   `json:"-"`
}

var userMap = map[string]*User{
	"123456789": {1, "James", false},
	"223456789": {2, "Shin", false},
	"323456789": {3, "Emmanuel", false},
	"423456789": {4, "Admin", true},
}

func main() {
	client = &pusher.Client{
		AppID:      "836189",
		Key:        os.Getenv("SUPPORT_PUSHER_KEY"),
		Secret:     os.Getenv("SUPPORT_PUSHER_SECRET"),
		Cluster:    "ap3",
		Secure:     true,
		HTTPClient: &http.Client{Timeout: time.Second * 10},
	}

	router := chi.NewRouter()
	router.Use(
		middleware.Logger,
		middleware.Recoverer,
		middleware.RedirectSlashes,
		middleware.RequestID,
	)

	staticPath, _ := filepath.Abs("./client/")
	fs := http.FileServer(http.Dir(staticPath))
	router.Handle("/*", fs)

	router.Post("/pusher/auth", pusherAuth)
	router.Post("/message", messageHandler)
	router.Post("/response", responseHandler)

	log.Fatal(http.ListenAndServe(":8080", router))
}

func getUser(r *http.Request) (*User, error) {
	sessionTokenHeader := "Session-Token"
	token := r.Header.Get(sessionTokenHeader)
	if len(token) != 9 {
		return nil, xerrors.New("invalid session token")
	}
	user, ok := userMap[token]
	if !ok || user == nil {
		return nil, xerrors.New("invalid session token")
	}
	return user, nil
}

func pusherAuth(w http.ResponseWriter, r *http.Request) {
	user, err := getUser(r)
	if err != nil {
		ErrorResponse(http.StatusForbidden, xerrors.New("invalid session token"), w)
		return
	}

	if err := r.ParseForm(); err != nil {
		ErrorResponse(http.StatusUnprocessableEntity, xerrors.Errorf("empty values: %w", err), w)
		return
	}

	channelName := r.PostForm.Get("channel_name")
	socketID := r.PostForm.Get("socket_id")

	if channelName == "" || socketID == "" {
		ErrorResponse(http.StatusUnprocessableEntity, xerrors.New("empty values"), w)
		return
	}

	resp, err := sendAuthRequest(channelName, []byte(r.PostForm.Encode()), user)
	if err != nil {
		ErrorResponse(http.StatusUnprocessableEntity, xerrors.Errorf("failed to send auth request: %w", err), w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(resp); err != nil {
		ErrorResponse(http.StatusInternalServerError, err, w)
	}
}

func sendAuthRequest(channelName string, params []byte, user *User) ([]byte, error) {
	const PresenceChannelPrefix = "presence-"
	const PrivateChannelPrefix = "private-"

	switch {
	case strings.HasPrefix(channelName, PresenceChannelPrefix):
		presenceData := pusher.MemberData{
			UserID: fmt.Sprintf("%d", user.ID),
			UserInfo: map[string]string{
				"name": user.Name,
			},
		}
		return client.AuthenticatePresenceChannel(params, presenceData)
	case strings.HasPrefix(channelName, PrivateChannelPrefix):
		isOwnChannel := strings.Split(channelName, "-")[1] == fmt.Sprintf("%d", user.ID)
		if !isOwnChannel && !user.IsAdmin {
			return nil, errors.New("not authorised to join this channel")
		}
		return client.AuthenticatePrivateChannel(params)
	}
	return nil, xerrors.New("unrecognised channel")
}

func messageHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUser(r)
	if err != nil {
		ErrorResponse(http.StatusForbidden, xerrors.New("invalid session token"), w)
		return
	}

	type msg struct {
		UserID string `json:"userId"`
		Text   string `json:"text"`
	}
	var m msg
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		ErrorResponse(http.StatusUnprocessableEntity, err, w)
		return
	}
	m.UserID = fmt.Sprintf("%d", user.ID)

	if err := client.Trigger(fmt.Sprintf("private-%d", user.ID), "user-message", m); err != nil {
		log.Fatal(err)
	}

	w.WriteHeader(http.StatusNoContent)
}

func responseHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUser(r)
	if err != nil {
		ErrorResponse(http.StatusForbidden, xerrors.New("invalid session token"), w)
		return
	}
	if user.ID != 4 {
		ErrorResponse(http.StatusForbidden, xerrors.New("must be an operator"), w)
		return
	}

	type msg struct {
		UserID int64  `json:"user_id"`
		Text   string `json:"text"`
	}
	var m msg
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		ErrorResponse(http.StatusUnprocessableEntity, err, w)
		return
	}

	if err := client.Trigger(fmt.Sprintf("private-%d", m.UserID), "operator-message", m); err != nil {
		log.Fatal(err)
	}

	w.WriteHeader(http.StatusNoContent)
}

func ErrorResponse(statusCode int, err error, w http.ResponseWriter) {
	type errorResponse struct {
		Message string `json:"message"`
		Trace   string `json:"trace"`
	}

	fmt.Printf("%+v\n", err)
	resp := errorResponse{
		Message: err.Error(),
		Trace:   fmt.Sprintf("%+v", err),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(&resp); err != nil {
		fmt.Printf("failed to encode JSON: %+v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}
