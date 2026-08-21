#!/bin/bash

# SEC Cricket Club Backend & Admin Deployment Script
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

exec "$ROOT_DIR/deploy.sh" "$@"
