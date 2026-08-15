#!/bin/bash

# 启动所有子应用
cd "$(dirname "$0")"

echo "==============================="
echo "  微前端 Demo 启动脚本"
echo "==============================="
echo ""
echo "启动主应用 (port 9000)..."
cd main-app && pnpm dev --port 9000 &

echo "启动 React Next.js 子应用 (port 9001)..."
cd sub-app-react-next && pnpm dev --port 9001 &

echo "启动 Vue3 子应用 (port 9002)..."
cd sub-app-vue3 && pnpm dev --port 9002 &

echo "启动 React SPA 子应用 (port 9003)..."
cd sub-app-react-spa && pnpm dev --port 9003 &

echo ""
echo "所有应用已启动!"
echo "主应用: http://localhost:9000"
echo "Next.js: http://localhost:9001"
echo "Vue3: http://localhost:9002"
echo "React SPA: http://localhost:9003"
echo ""
echo "按 Ctrl+C 停止所有应用"
wait
