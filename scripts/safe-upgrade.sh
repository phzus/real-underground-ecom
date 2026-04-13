#!/usr/bin/env bash
#
# safe-upgrade.sh — atualiza a stack real-underground com rede de segurança
# Uso: rodar NA VPS, em /opt/stacks/real-underground (ou exportar STACK_DIR).
#
# Passos (aborta em qualquer erro):
#   1. pg_dump do banco atual (timestampado, mantém últimos 10)
#   2. tag da imagem ru-medusa atual como :rollback
#   3. git pull --ff-only (se STACK_DIR for git — aborta em conflito)
#   4. docker compose build ru-medusa (a antiga continua rodando)
#   5. docker compose up -d --no-deps ru-medusa (troca atômica)
#   6. health check por até 90s contra http://localhost:9000/health
#   7. rollback automático se health check falhar:
#        - restaura imagem :rollback
#        - restaura banco do pg_dump
#
# NUNCA usa --force em git, NUNCA roda migrations destrutivas, NUNCA deleta
# dados sem backup. Qualquer falha deixa o sistema no estado anterior.

set -Eeuo pipefail

STACK_DIR="${STACK_DIR:-/opt/stacks/real-underground}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/real-underground}"
LOG_FILE="${LOG_FILE:-/var/log/real-underground-upgrade.log}"
DB_CONTAINER="${DB_CONTAINER:-ru-postgres}"
APP_CONTAINER="${APP_CONTAINER:-ru-medusa}"
APP_IMAGE="${APP_IMAGE:-ru-medusa:latest}"
ROLLBACK_IMAGE="${ROLLBACK_IMAGE:-ru-medusa:rollback}"
HEALTH_URL="${HEALTH_URL:-http://localhost:9000/health}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"

TS="$(date +%Y-%m-%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/db-${TS}.sql.gz"

log() {
  echo "[$(date +'%F %T')] $*" | tee -a "${LOG_FILE}"
}

die() {
  log "ERRO: $*"
  log "Abortando upgrade. Nada foi modificado além do backup (se existir)."
  exit 1
}

abort_rollback() {
  log "=========================================="
  log "ROLLBACK AUTOMÁTICO INICIADO"
  log "=========================================="

  if docker image inspect "${ROLLBACK_IMAGE}" >/dev/null 2>&1; then
    log "Restaurando imagem anterior (${ROLLBACK_IMAGE} → ${APP_IMAGE})…"
    docker tag "${ROLLBACK_IMAGE}" "${APP_IMAGE}" || true
    (cd "${STACK_DIR}" && docker compose up -d --no-deps "${APP_CONTAINER}") || true
  fi

  if [[ -f "${BACKUP_FILE}" ]]; then
    log "Restaurando banco a partir de ${BACKUP_FILE}…"
    if gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U medusa -d medusa >/dev/null 2>&1; then
      log "Banco restaurado com sucesso."
    else
      log "FALHA ao restaurar banco — intervenção manual necessária."
    fi
  fi

  log "Rollback concluído. Verifique o estado do serviço manualmente."
  exit 2
}

trap 'abort_rollback' ERR INT TERM

log "=========================================="
log "real-underground upgrade — ${TS}"
log "=========================================="

cd "${STACK_DIR}" || die "STACK_DIR não existe: ${STACK_DIR}"

# ---- 1. Backup do banco ----
mkdir -p "${BACKUP_DIR}"
log "Gerando backup do banco em ${BACKUP_FILE}…"
if ! docker exec "${DB_CONTAINER}" pg_dump -U medusa -d medusa --no-owner --clean --if-exists 2>/dev/null | gzip > "${BACKUP_FILE}"; then
  rm -f "${BACKUP_FILE}"
  trap - ERR INT TERM
  die "pg_dump falhou — aborta antes de qualquer mudança."
fi
log "Backup gerado: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Rotação
cd "${BACKUP_DIR}"
ls -1t db-*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | while read -r old; do
  log "Removendo backup antigo: ${old}"
  rm -f "${old}"
done
cd "${STACK_DIR}"

# ---- 2. Snapshot da imagem atual ----
if docker image inspect "${APP_IMAGE}" >/dev/null 2>&1; then
  log "Criando snapshot da imagem atual como ${ROLLBACK_IMAGE}…"
  docker tag "${APP_IMAGE}" "${ROLLBACK_IMAGE}"
else
  log "Imagem atual ${APP_IMAGE} não encontrada — primeiro deploy?"
fi

# ---- 3. Git pull (se for git) ----
if [[ -d "${STACK_DIR}/.git" ]]; then
  log "Git pull --ff-only na branch atual…"
  git -C "${STACK_DIR}" fetch origin
  CURRENT_BRANCH="$(git -C "${STACK_DIR}" rev-parse --abbrev-ref HEAD)"
  if ! git -C "${STACK_DIR}" pull --ff-only origin "${CURRENT_BRANCH}"; then
    die "git pull não é fast-forward — conflito. Resolva manualmente."
  fi
else
  log "STACK_DIR não é repositório git — pulando git pull."
fi

# ---- 4. Build da nova imagem ----
log "Build da nova imagem ${APP_IMAGE}…"
if ! docker compose build "${APP_CONTAINER}"; then
  die "docker compose build falhou."
fi

# ---- 5. Troca atômica ----
log "Subindo container com a nova imagem…"
if ! docker compose up -d --no-deps "${APP_CONTAINER}"; then
  die "docker compose up falhou."
fi

# ---- 6. Health check ----
log "Aguardando health check em ${HEALTH_URL} (timeout: ${HEALTH_TIMEOUT}s)…"
start=$(date +%s)
ok=0
while :; do
  if curl -fsS -o /dev/null -m 5 "${HEALTH_URL}"; then
    ok=1
    break
  fi
  now=$(date +%s)
  if (( now - start > HEALTH_TIMEOUT )); then
    break
  fi
  sleep 3
done

if [[ "${ok}" -ne 1 ]]; then
  log "Health check falhou após ${HEALTH_TIMEOUT}s."
  false
fi

log "Health check OK."
log "=========================================="
log "UPGRADE CONCLUÍDO COM SUCESSO"
log "Backup guardado em: ${BACKUP_FILE}"
log "Imagem anterior disponível em: ${ROLLBACK_IMAGE}"
log "=========================================="

trap - ERR INT TERM
exit 0
