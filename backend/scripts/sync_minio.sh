#!/bin/bash
# Sync MinIO bucket từ máy nguồn (A) về local dev
# Dùng: ./scripts/sync_minio.sh <A_IP> [A_PORT=9000]

set -euo pipefail
SRC_IP="${1:-}"; SRC_PORT="${2:-9000}"
[ -z "$SRC_IP" ] && { echo "Usage: $0 <SOURCE_IP> [SOURCE_PORT]"; exit 1; }

USER="minio"; PASS="minio12345"; BUCKET="ecommerce"

docker run --rm --network host minio/mc sh -c "
  mc alias set src http://$SRC_IP:$SRC_PORT $USER $PASS &&
  mc alias set dst http://127.0.0.1:9000 $USER $PASS &&
  mc mb -p dst/$BUCKET || true &&
  echo '🔄 Mirroring src/$BUCKET -> dst/$BUCKET ...' &&
  mc mirror --overwrite src/$BUCKET dst/$BUCKET &&
  echo '✅ MinIO sync done.'
"
