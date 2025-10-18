#!/usr/bin/env bash
set -e

PACKAGE_NAME="@gnar-engine/cli"
TARGET_DIR="$HOME/.gnarengine"

echo "Installing $PACKAGE_NAME locally for user $USER..."

# Create the global config directory
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# Install the package
npm install "$PACKAGE_NAME" --no-audit --no-fund

# Get the local bin path
BIN_PATH="$TARGET_DIR/node_modules/.bin"

# Add to shell PATH if not already present
if ! grep -q "$BIN_PATH" "$HOME/.bashrc" 2>/dev/null; then
  echo "export PATH=\"$BIN_PATH:\$PATH\"" >> "$HOME/.bashrc"
  echo "Added $BIN_PATH to PATH in ~/.bashrc"
fi

# For zsh users (macOS default)
if [ -f "$HOME/.zshrc" ] && ! grep -q "$BIN_PATH" "$HOME/.zshrc"; then
  echo "export PATH=\"$BIN_PATH:\$PATH\"" >> "$HOME/.zshrc"
  echo "Added $BIN_PATH to PATH in ~/.zshrc"
fi

echo "G n a r  E n g i n e - Installation complete! Please restart your terminal and run 'gnar --help' to verify."

