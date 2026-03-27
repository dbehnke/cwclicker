#!/bin/bash
# Optimized Fork Workflow Helper for AI Agents
# Usage: source scripts/git-fork-workflow.sh

# Configuration
UPSTREAM_REMOTE="origin"
FORK_REMOTE="fork"
DEFAULT_BRANCH="main"

# Sync fork with upstream
git-sync-upstream() {
  echo "🔄 Syncing fork with upstream..."
  git fetch $UPSTREAM_REMOTE
  git checkout $DEFAULT_BRANCH
  git rebase $UPSTREAM_REMOTE/$DEFAULT_BRANCH
  git push $FORK_REMOTE $DEFAULT_BRANCH --force-with-lease
  echo "✅ Fork synced with upstream"
}

# Create feature branch and push
git-feature() {
  local branch_name=$1
  if [ -z "$branch_name" ]; then
    echo "❌ Usage: git-feature <branch-name>"
    return 1
  fi
  
  echo "🚀 Creating feature branch: $branch_name"
  git checkout -b "$branch_name"
  echo "✅ Branch created. Make your changes, then run: git-push-feature $branch_name"
}

# Push feature branch to fork
git-push-feature() {
  local branch_name
  branch_name=$(git branch --show-current)
  echo "📤 Pushing $branch_name to fork..."
  git push -u $FORK_REMOTE "$branch_name"
  echo "✅ Pushed to fork. Create PR with: git-pr"
}

# Create PR using gh CLI
git-pr() {
  local branch_name
  branch_name=$(git branch --show-current)
  local repo="dbehnke/cwclicker"
  
  echo "📋 Creating PR for $branch_name..."
  gh pr create \
    --repo "$repo" \
    --base "$DEFAULT_BRANCH" \
    --head "trinity-ai-agent:$branch_name" \
    --fill \
    --web
}

# Quick status check
git-fork-status() {
  echo "📊 Fork Workflow Status"
  echo "======================="
  echo "Current branch: $(git branch --show-current)"
  echo "Upstream: $UPSTREAM_REMOTE ($(git remote get-url $UPSTREAM_REMOTE))"
  echo "Fork: $FORK_REMOTE ($(git remote get-url $FORK_REMOTE))"
  echo ""
  echo "Uncommitted changes:"
  git status --short
  echo ""
  echo "Commits ahead of upstream:"
  git log --oneline $UPSTREAM_REMOTE/$DEFAULT_BRANCH..HEAD 2>/dev/null || echo "None"
}

# Complete workflow: sync, branch, push, PR
git-fork-workflow() {
  local branch_name=$1
  
  if [ -z "$branch_name" ]; then
    echo "❌ Usage: git-fork-workflow <branch-name>"
    echo ""
    echo "This command:"
    echo "  1. Syncs fork with upstream"
    echo "  2. Creates feature branch"
    echo "  3. Pushes to fork"
    echo "  4. Opens PR creation page"
    return 1
  fi
  
  git-sync-upstream && \
  git-feature "$branch_name" && \
  echo "" && \
  echo "📝 Make your changes now, then run:" && \
  echo "   git add . && git commit -m 'your message' && git-push-feature && git-pr"
}

echo "🎯 Fork Workflow Commands Loaded:"
echo "  git-sync-upstream  - Sync fork with upstream/main"
echo "  git-feature <name> - Create feature branch"
echo "  git-push-feature   - Push current branch to fork"
echo "  git-pr             - Create PR on upstream repo"
echo "  git-fork-status    - Check workflow status"
echo "  git-fork-workflow <name> - Complete workflow (sync → branch → ready)"
echo ""
echo "💡 Quick start: git-fork-workflow my-feature-branch"
