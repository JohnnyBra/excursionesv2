#!/bin/bash

# Script de Instalación y Actualización para SchoolTripManager Pro
# Este script descarga los últimos cambios, instala dependencias y construye la aplicación.

echo "=================================================="
echo "   SchoolTripManager Pro - Setup Script"
echo "=================================================="

# 1. Actualizar código desde GitHub
echo ""
echo "🔄 [1/3] Buscando actualizaciones en GitHub..."
git pull
if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: No se pudo ejecutar 'git pull'. Asegúrate de que git está instalado y tienes conexión."
    echo "   Continuando con la instalación local..."
else
    echo "✅ Código actualizado correctamente."
fi

# 2. Instalar dependencias
echo ""
echo "📦 [2/3] Instalando dependencias..."

echo "   > Instalando dependencias del Frontend (Raíz)..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias del frontend."
    exit 1
fi

echo "   > Instalando dependencias del Backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias del backend."
    cd ..
    exit 1
fi
cd ..
echo "✅ Dependencias instaladas."

# 3. Construir proyecto
echo ""
echo "🏗️  [3/3] Construyendo aplicación para producción..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en la construcción (build)."
    exit 1
fi
echo "✅ Construcción completada."

echo ""
echo "=================================================="
echo "   ¡Instalación/Actualización Completada! 🚀"
echo "=================================================="
echo ""
echo "Para iniciar la aplicación:"
echo "   Modo Desarrollo:  npm run dev"
echo "   Modo Producción:  Sigue las instrucciones de PM2 en el README."
echo ""
