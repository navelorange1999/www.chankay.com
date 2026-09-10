#!/bin/sh

set -eu

keep_secret=0
if [ "${1:-}" = "--keep-secret" ]; then
  keep_secret=1
  shift
fi

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 [--keep-secret] /path/to/wechat-relay.env" >&2
  exit 64
fi

env_file="$1"
env_dir=$(dirname "$env_file")

if [ ! -d "$env_dir" ]; then
  echo "Environment directory does not exist: $env_dir" >&2
  exit 1
fi

umask 077
secret=""
if [ "$keep_secret" -eq 0 ]; then
  secret=$(openssl rand -hex 32)
fi
temp_file=$(mktemp "${env_file}.tmp.XXXXXX")

cleanup() {
  rm -f "$temp_file"
}
trap cleanup EXIT HUP INT TERM

found_secret=0
found_host=0
found_port=0
{
  if [ -f "$env_file" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        WECHAT_RELAY_SHARED_SECRET=*)
          if [ "$found_secret" -eq 0 ]; then
            if [ "$keep_secret" -eq 1 ]; then
              printf '%s\n' "$line"
            else
              printf 'WECHAT_RELAY_SHARED_SECRET=%s\n' "$secret"
            fi
            found_secret=1
          fi
          ;;
        WECHAT_RELAY_HOST=*)
          if [ "$found_host" -eq 0 ]; then
            printf 'WECHAT_RELAY_HOST=127.0.0.1\n'
            found_host=1
          fi
          ;;
        WECHAT_RELAY_PORT=*)
          if [ "$found_port" -eq 0 ]; then
            printf 'WECHAT_RELAY_PORT=8787\n'
            found_port=1
          fi
          ;;
        *)
          printf '%s\n' "$line"
          ;;
      esac
    done < "$env_file"
  fi

  if [ "$found_secret" -eq 0 ]; then
    secret=$(openssl rand -hex 32)
    printf 'WECHAT_RELAY_SHARED_SECRET=%s\n' "$secret"
  fi
  if [ "$found_host" -eq 0 ]; then
    printf 'WECHAT_RELAY_HOST=127.0.0.1\n'
  fi
  if [ "$found_port" -eq 0 ]; then
    printf 'WECHAT_RELAY_PORT=8787\n'
  fi
} > "$temp_file"

chmod 600 "$temp_file"
mv "$temp_file" "$env_file"
trap - EXIT HUP INT TERM

if [ "$keep_secret" -eq 1 ]; then
  echo "Updated relay runtime defaults in $env_file (secret preserved and not displayed)."
else
  echo "Updated relay configuration in $env_file (secret value not displayed)."
fi
