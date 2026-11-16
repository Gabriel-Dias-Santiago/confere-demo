#!/usr/bin/env bash
# Publica o Confere. em um repositório público novo, sem modificar repositórios existentes.
set -euo pipefail
REPO="Gabriel-Dias-Santiago/confere-demo"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

command -v git >/dev/null || { echo 'Instale o Git antes de continuar.' >&2; exit 1; }
command -v gh >/dev/null || { echo 'Instale GitHub CLI (gh): https://cli.github.com/ e entre com gh auth login.' >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo 'Faça login no GitHub com: gh auth login' >&2; exit 1; }
if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "O repositório $REPO já existe. Interrompendo para evitar sobrescrita." >&2
  exit 1
fi
if [[ -d .git ]]; then
  echo 'A pasta já possui histórico Git. Interrompendo para evitar alterações inesperadas.' >&2
  exit 1
fi

git init -b main
git add .
git commit -m "feat: publicar Confere demo com testes e materiais"
gh repo create "$REPO" --public --source=. --remote=origin --push
printf '\nProjeto publicado: https://github.com/%s\n' "$REPO"
printf 'Para habilitar a demonstração: Settings > Pages > Deploy from a branch > main / (root).\n'
