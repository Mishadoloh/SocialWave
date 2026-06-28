FROM golang:1.21-alpine AS builder

WORKDIR /build

# Copy files
COPY main.go ./

# Initialize module and fetch dependencies
RUN go mod init go-service
RUN go get modernc.org/sqlite

# Compile CGO_ENABLED=0 pure-Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o go-service-bin main.go

# Minimal runner
FROM alpine:3.18
WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/go-service-bin /app/go-service-bin

# Default environment variables
ENV PORT=8080
ENV DATABASE_PATH=/app/db.sqlite3

EXPOSE 8080

CMD ["/app/go-service-bin"]
