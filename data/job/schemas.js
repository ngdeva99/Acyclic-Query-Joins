const schemas = {
    movie: {
      name: 'movie',
      attributes: ['id', 'title', 'year', 'budget', 'rating'],
      key: 'id'
    },
    cast: {
      name: 'cast',
      attributes: ['movie_id', 'actor_id', 'role', 'position'],
      key: 'id'
    },
    actor: {
      name: 'actor',
      attributes: ['id', 'name', 'gender', 'birth_year'],
      key: 'id'
    }
  };
  
  module.exports = schemas;