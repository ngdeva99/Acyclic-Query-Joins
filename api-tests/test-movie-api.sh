#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:3000/api/join"

# Test Movie Ratings Join
echo -e "${GREEN}Testing: Movies with Ratings${NC}"
echo "----------------------------------------"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "joinTree": {
      "relation": {
        "name": "title",
        "attributes": ["id", "title", "year"],
        "tuples": [
          [1, "The Shawshank Redemption", 1994],
          [2, "The Godfather", 1972],
          [3, "The Dark Knight", 2008]
        ]
      },
      "left": {
        "relation": {
          "name": "movie_info_idx",
          "attributes": ["movie_id", "info_type", "rating"],
          "tuples": [
            [1, "rating", 9.3],
            [2, "rating", 9.2],
            [3, "rating", 9.0]
          ]
        }
      }
    }
  }' \
  $BASE_URL | python3 -m json.tool
echo "----------------------------------------"

# Test Movie Genres and Ratings Join
echo -e "${GREEN}Testing: Movies with Genres and Ratings${NC}"
echo "----------------------------------------"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "joinTree": {
      "relation": {
        "name": "title",
        "attributes": ["id", "title", "year"],
        "tuples": [
          [1, "The Shawshank Redemption", 1994],
          [2, "The Godfather", 1972],
          [3, "The Dark Knight", 2008]
        ]
      },
      "left": {
        "relation": {
          "name": "movie_info",
          "attributes": ["movie_id", "info_type", "genre"],
          "tuples": [
            [1, "genre", "Drama"],
            [2, "genre", "Crime"],
            [3, "genre", "Action"]
          ]
        }
      },
      "right": {
        "relation": {
          "name": "movie_info_idx",
          "attributes": ["movie_id", "info_type", "rating"],
          "tuples": [
            [1, "rating", 9.3],
            [2, "rating", 9.2],
            [3, "rating", 9.0]
          ]
        }
      }
    }
  }' \
  $BASE_URL | python3 -m json.tool
echo "----------------------------------------"

# Test Movie Companies Join
echo -e "${GREEN}Testing: Movies with Production Companies${NC}"
echo "----------------------------------------"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "joinTree": {
      "relation": {
        "name": "title",
        "attributes": ["id", "title", "year"],
        "tuples": [
          [1, "The Dark Knight", 2008],
          [2, "Inception", 2010],
          [3, "Interstellar", 2014]
        ]
      },
      "left": {
        "relation": {
          "name": "movie_companies",
          "attributes": ["movie_id", "company_id"],
          "tuples": [
            [1, 101],
            [2, 101],
            [3, 101]
          ]
        }
      },
      "right": {
        "relation": {
          "name": "company_name",
          "attributes": ["id", "name", "country_code"],
          "tuples": [
            [101, "Warner Bros.", "US"]
          ]
        }
      }
    }
  }' \
  $BASE_URL | python3 -m json.tool
echo "----------------------------------------"

# Test Complex Movie Join
echo -e "${GREEN}Testing: Complex Movie Join${NC}"
echo "----------------------------------------"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "joinTree": {
      "relation": {
        "name": "title",
        "attributes": ["id", "title", "year"],
        "tuples": [
          [1, "Inception", 2010],
          [2, "The Dark Knight", 2008],
          [3, "Dunkirk", 2017]
        ]
      },
      "left": {
        "relation": {
          "name": "cast_info",
          "attributes": ["movie_id", "person_id", "role"],
          "tuples": [
            [1, 201, "Director"],
            [2, 201, "Director"],
            [3, 201, "Director"]
          ]
        }
      },
      "right": {
        "relation": {
          "name": "name",
          "attributes": ["id", "name", "gender"],
          "tuples": [
            [201, "Christopher Nolan", "M"]
          ]
        }
      }
    }
  }' \
  $BASE_URL | python3 -m json.tool
echo "----------------------------------------"

# Test Advanced Filter Join
echo -e "${GREEN}Testing: Advanced Filter Join${NC}"
echo "----------------------------------------"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "joinTree": {
      "relation": {
        "name": "title",
        "attributes": ["id", "title", "year"],
        "tuples": [
          [1, "The Dark Knight", 2008],
          [2, "Batman Begins", 2005],
          [3, "The Dark Knight Rises", 2012]
        ]
      },
      "left": {
        "relation": {
          "name": "movie_info",
          "attributes": ["movie_id", "info_type", "genre"],
          "tuples": [
            [1, "genre", "Action"],
            [2, "genre", "Action"],
            [3, "genre", "Action"]
          ]
        }
      },
      "right": {
        "relation": {
          "name": "movie_info_idx",
          "attributes": ["movie_id", "info_type", "rating"],
          "tuples": [
            [1, "rating", 9.0],
            [2, "rating", 8.2],
            [3, "rating", 8.4]
          ]
        }
      }
    }
  }' \
  $BASE_URL | python3 -m json.tool
echo "----------------------------------------"