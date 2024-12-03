// test/api/imdb-tests.js

// Test Case 1: Find movies with their ratings
const movieRatingsJoin = {
    "joinTree": {
      "relation": {
        "name": "title",
        "attributes": ["id", "title", "year"],
        "tuples": [
          [1, "The Shawshank Redemption", 1994],
          [2, "The Godfather", 1972],
          [3, "The Dark Knight", 2008],
          [4, "Pulp Fiction", 1994],
          [5, "Forrest Gump", 1994]
        ]
      },
      "left": {
        "relation": {
          "name": "movie_info_idx",
          "attributes": ["movie_id", "info_type", "rating"],
          "tuples": [
            [1, "rating", 9.3],
            [2, "rating", 9.2],
            [3, "rating", 9.0],
            [4, "rating", 8.9],
            [5, "rating", 8.8]
          ]
        }
      }
    }
  };
  
  // Test Case 2: Find movies with their genres and ratings
  const movieGenreRatingJoin = {
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
  };
  
  // Test Case 3: Find movies with production companies
  const movieCompanyJoin = {
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
            [101, "Warner Bros.", "US"],
            [102, "Paramount Pictures", "US"],
            [103, "Universal Pictures", "US"]
          ]
        }
      }
    }
  };
  
  // Test Case 4: Complex join - Movies with cast, companies, and ratings
  const complexMovieJoin = {
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
            [201, "Christopher Nolan", "M"],
            [202, "Steven Spielberg", "M"],
            [203, "Martin Scorsese", "M"]
          ]
        }
      }
    }
  };
  
  // Test Case 5: Find all movies of a specific genre in a year range with minimum rating
  const advancedFilterJoin = {
    "joinTree": {
      "relation": {
        "name": "title",
        "attributes": ["id", "title", "year"],
        "tuples": [
          [1, "The Dark Knight", 2008],
          [2, "Batman Begins", 2005],
          [3, "The Dark Knight Rises", 2012],
          [4, "Joker", 2019],
          [5, "Batman v Superman", 2016]
        ]
      },
      "left": {
        "relation": {
          "name": "movie_info",
          "attributes": ["movie_id", "info_type", "genre"],
          "tuples": [
            [1, "genre", "Action"],
            [2, "genre", "Action"],
            [3, "genre", "Action"],
            [4, "genre", "Drama"],
            [5, "genre", "Action"]
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
            [3, "rating", 8.4],
            [4, "rating", 8.4],
            [5, "rating", 6.4]
          ]
        }
      }
    }
  };
  
  module.exports = {
    movieRatingsJoin,
    movieGenreRatingJoin,
    movieCompanyJoin,
    complexMovieJoin,
    advancedFilterJoin
  };