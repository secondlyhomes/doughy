#!/bin/bash

# Zone H: Find Unused Hooks Script
# Searches for custom hooks in src/features with no import references
# Conservative approach: flags for review, does NOT recommend deletion

echo "=============================================="
echo "Zone H: Unused Hooks Analysis"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""
echo "Searching for hooks with no import references..."
echo "Note: Hooks with 0 refs may still be useful utilities"
echo ""

# Counter for findings
total_hooks=0
unused_hooks=0

# Find all hook files (use*.ts or use*.tsx) in src/features
# Exclude test files
for hook_file in $(find src/features -type f \( -name "use*.ts" -o -name "use*.tsx" \) ! -path "*/__tests__/*" ! -name "*.test.*" 2>/dev/null); do
  # Extract hook name from filename
  hook_name=$(basename "$hook_file" | sed 's/\.tsx\?$//')

  ((total_hooks++))

  # Count import references (excluding the definition file itself)
  # Look for: import { hookName } or import hookName
  ref_count=$(grep -r "import.*${hook_name}" src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "$hook_file" | grep -v "__tests__" | wc -l | tr -d ' ')

  if [ "$ref_count" -eq 0 ]; then
    ((unused_hooks++))
    echo "WARNING  ${hook_name}"
    echo "         Location: ${hook_file}"
    echo "         References: 0 (excluding definition)"
    echo ""
  fi
done

echo "=============================================="
echo "Summary"
echo "=============================================="
echo "Total hooks scanned: $total_hooks"
echo "Hooks with 0 references: $unused_hooks"
echo ""
echo "IMPORTANT: Do NOT delete these automatically!"
echo "These hooks may be:"
echo "  - Utility hooks for future features"
echo "  - Part of public API/exports"
echo "  - Used dynamically (not detectable via static analysis)"
echo ""
echo "Next steps:"
echo "  1. Review each flagged hook manually"
echo "  2. Check if exported from index files"
echo "  3. Decide: KEEP, DEPRECATE, or DELETE"
echo "  4. Document decision in docs/DEPRECATED_CODE.md"
