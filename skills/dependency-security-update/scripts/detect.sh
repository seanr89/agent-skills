#!/usr/bin/env bash
# Detect Node and .NET dependency manifests, lockfiles, and Snyk availability.
# Usage: bash detect.sh [repo-root]
set -u
ROOT="${1:-.}"
cd "$ROOT" || exit 1
EXCL=(-not -path "*/node_modules/*" -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/.git/*")

echo "== Node =="
find . "${EXCL[@]}" \( -name package.json -o -name package-lock.json -o -name npm-shrinkwrap.json -o -name yarn.lock -o -name pnpm-lock.yaml -o -name pnpm-workspace.yaml -o -name .nvmrc -o -name .npmrc \) 2>/dev/null | sort
echo "Package manager hint:"
[ -f pnpm-lock.yaml ] && echo "  pnpm"
[ -f yarn.lock ] && echo "  yarn ($( [ -f .yarnrc.yml ] && echo berry || echo classic ))"
[ -f package-lock.json ] && echo "  npm"

echo; echo "== .NET =="
find . "${EXCL[@]}" \( -name "*.sln" -o -name "*.slnx" -o -name "*.csproj" -o -name "*.fsproj" -o -name "*.vbproj" -o -name Directory.Packages.props -o -name Directory.Build.props -o -name global.json -o -name nuget.config -o -name NuGet.Config -o -name packages.lock.json \) 2>/dev/null | sort
[ -f Directory.Packages.props ] && echo "Central Package Management: yes"

echo; echo "== Snyk =="
if command -v snyk >/dev/null 2>&1; then
  echo "snyk CLI: $(snyk --version 2>/dev/null)"
else
  echo "snyk CLI: not found"
fi
if [ -n "${SNYK_TOKEN:-}" ]; then echo "SNYK_TOKEN: set"; else echo "SNYK_TOKEN: not set (may still be authenticated via snyk auth)"; fi
[ -f .snyk ] && echo ".snyk policy file present (do not override ignores)"

echo; echo "== Toolchain =="
command -v node >/dev/null 2>&1 && echo "node $(node --version)"
command -v npm >/dev/null 2>&1 && echo "npm $(npm --version)"
command -v pnpm >/dev/null 2>&1 && echo "pnpm $(pnpm --version)"
command -v yarn >/dev/null 2>&1 && echo "yarn $(yarn --version)"
command -v dotnet >/dev/null 2>&1 && echo "dotnet $(dotnet --version)"
exit 0
