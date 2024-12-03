#!/bin/bash

echo "Testing simple join..."
curl -X POST http://localhost:3000/api/join \
-H "Content-Type: application/json" \
-d @test/api/simple-join.json

echo -e "\n\nTesting complex join..."
curl -X POST http://localhost:3000/api/join \
-H "Content-Type: application/json" \
-d @test/api/complex-join.json