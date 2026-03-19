#!/bin/bash
cd /tmp/cc-agent/57926599/project
npx tsc -p tsconfig.app.json --noEmit 2>&1
echo "EXIT_CODE=$?"
