#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${EC2_HOST_1:-}" || -z "${EC2_HOST_2:-}" || -z "${EC2_SSH_USER:-}" || -z "${SSH_KEY_PATH:-}" ]]; then
  echo "Required env missing: EC2_HOST_1, EC2_HOST_2, EC2_SSH_USER, SSH_KEY_PATH"
  exit 1
fi

deploy_host() {
  local host="$1"
  echo "Deploying to ${host}"
  ssh -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "${EC2_SSH_USER}@${host}" "bash /opt/campus-pulse/ops/scripts/deploy-instance.sh"
}

deploy_host "$EC2_HOST_1"
deploy_host "$EC2_HOST_2"
