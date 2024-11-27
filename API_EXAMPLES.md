# Yannakakis Algorithm API Examples

## Create a Relation

```bash
curl -X POST http://localhost:3000/api/relations \
-H "Content-Type: application/json" \
-d '{
  "name": "Movies",
  "attributes": ["id", "title", "year"],
  "tuples": [
    {"key": "1", "values": [1, "The Matrix", 1999]},
    {"key": "2", "values": [2, "Inception", 2010]}
  ]
}'
```

## Perform a Join

```bash
curl -X POST http://localhost:3000/api/join \
-H "Content-Type: application/json" \
-d '{
  "relations": ["rel_123", "rel_456"],
  "joinConditions": [{
    "relations": ["Movies", "Actors"],
    "attributes": {
      "Movies": "id",
      "Actors": "movie_id"
    }
  }]
}'
```

## Load a Dataset

```bash
curl -X POST http://localhost:3000/api/datasets/load \
-H "Content-Type: application/json" \
-d '{
  "dataset": "JOB",
  "tables": ["movie", "cast", "actor"]
}'
```

## Analyze Performance

```bash
curl -X POST http://localhost:3000/api/analyze/performance \
-H "Content-Type: application/json" \
-d '{
  "joinId": "join_123456789"
}'
```

For more examples and detailed API documentation, visit `/documentation` after starting the server.