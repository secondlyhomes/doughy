#!/bin/bash

# Zone H: Find Unused Components Script
# Searches for components in src/features with no import references
# Conservative approach: flags for review, does NOT recommend deletion

echo "=============================================="
echo "Zone H: Unused Components Analysis"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""
echo "Searching for components with no import references..."
echo "Patterns: *Screen.tsx, *Card.tsx, *Button.tsx, *Modal.tsx, *Form.tsx, *List.tsx"
echo "Note: Components with 0 refs may still be used dynamically"
echo ""

# Counter for findings
total_components=0
unused_components=0

# Find component files matching common patterns
# Exclude test files and index files
for component_file in $(find src/features -type f \( \
  -name "*Screen.tsx" -o \
  -name "*Card.tsx" -o \
  -name "*Button.tsx" -o \
  -name "*Modal.tsx" -o \
  -name "*Form.tsx" -o \
  -name "*List.tsx" -o \
  -name "*View.tsx" -o \
  -name "*Panel.tsx" \
  \) ! -path "*/__tests__/*" ! -name "*.test.*" ! -name "index.*" 2>/dev/null); do

  # Extract component name from filename
  component_name=$(basename "$component_file" | sed 's/\.tsx$//')

  ((total_components++))

  # Count import references (excluding the definition file itself)
  ref_count=$(grep -r "import.*${component_name}" src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "$component_file" | grep -v "__tests__" | wc -l | tr -d ' ')

  # Also check for JSX usage (component as tag)
  jsx_count=$(grep -r "<${component_name}" src --include="*.tsx" 2>/dev/null | grep -v "$component_file" | grep -v "__tests__" | wc -l | tr -d ' ')

  total_refs=$((ref_count + jsx_count))

  if [ "$total_refs" -eq 0 ]; then
    ((unused_components++))
    echo "WARNING  ${component_name}"
    echo "         Location: ${component_file}"
    echo "         Import refs: $ref_count | JSX refs: $jsx_count"
    echo ""
  fi
done

echo "=============================================="
echo "Summary"
echo "=============================================="
echo "Total components scanned: $total_components"
echo "Components with 0 references: $unused_components"
echo ""
echo "IMPORTANT: Do NOT delete these automatically!"
echo "These components may be:"
echo "  - Entry points for navigation/routing"
echo "  - Dynamically loaded components"
echo "  - Used in exports/PDF generation"
echo "  - Part of public component library"
echo ""
echo "Next steps:"
echo "  1. Review each flagged component manually"
echo "  2. Check navigation/routing configuration"
echo "  3. Decide: KEEP, DEPRECATE, or DELETE"
echo "  4. Document decision in docs/DEPRECATED_CODE.md"
