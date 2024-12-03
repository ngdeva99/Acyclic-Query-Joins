#!/bin/bash

# Test data
curl -X POST http://localhost:3000/api/join \
-H "Content-Type: application/json" \
-d '{
  "joinTree": {
    "relation": {
      "name": "R1",
      "attributes": ["id", "value"],
      "tuples": [[1, "a"], [2, "b"], [3, "c"]]
    },
    "left": {
      "relation": {
        "name": "R2",
        "attributes": ["id", "other"],
        "tuples": [[1, "x"], [2, "y"], [4, "z"]]
      }
    },
    "right": {
      "relation": {
        "name": "R3",
        "attributes": ["id", "data"],
        "tuples": [[1, "p"], [2, "q"], [5, "r"]]
      }
    }
  }
}'