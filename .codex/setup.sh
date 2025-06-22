#!/bin/bash
set -e
if ! command -v node >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y nodejs npm
fi
npm ci
