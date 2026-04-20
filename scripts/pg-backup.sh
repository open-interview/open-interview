#!/bin/bash
set -e

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

if [ -n "$DATABASE_URL" ]; then
  export PGHOST=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:[^@]*@\([^:/]*\).*|\1|p')
  export PGPORT=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:[^@]*@[^:]*:\([0-9]*\).*|\1|p')
  export PGDATABASE=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
  export PGUSER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
  export PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
fi

backup() {
  TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
  BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
  pg_dump | gzip > "$BACKUP_FILE"
  echo "Backup created: $BACKUP_FILE"
  
  # Keep only last 7 backups
  ls -t "$BACKUP_DIR"/backup_*.sql.gz | tail -n +8 | xargs -r rm
}

restore() {
  [ -z "$1" ] && echo "Usage: $0 restore <backup_file>" && exit 1
  [ ! -f "$1" ] && echo "File not found: $1" && exit 1
  
  if [[ "$1" == *.gz ]]; then
    gunzip -c "$1" | psql
  else
    psql < "$1"
  fi
  echo "Restore completed from: $1"
}

list() {
  echo "Available backups:"
  ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}' || echo "No backups found"
}

case "$1" in
  backup) backup ;;
  restore) restore "$2" ;;
  list) list ;;
  *) echo "Usage: $0 {backup|restore <file>|list}" && exit 1 ;;
esac
