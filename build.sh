#!/bin/bash

# Build the React app
npm run build

rm -rf deploy
# Create deployment package
mkdir -p deploy
cp -r dist deploy/
cp -r server/* deploy/
cp -r .ebextensions deploy/
cp server/package.json deploy/package.json
cp .env deploy/
cp Procfile deploy/Procfile

# Install production dependencies
cd deploy
rm -rf node_modules
rm news.db
zip -r ../deploy_zip/deploy_18.zip .
cd ..