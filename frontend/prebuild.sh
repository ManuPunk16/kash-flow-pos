#!/bin/bash

# Limpiar cache
rm -rf node_modules/@tailwindcss/oxide
rm -rf node_modules/.bin

# Reinstalar con --force
npm install --force

# Rebuild binarios nativos
npm rebuild