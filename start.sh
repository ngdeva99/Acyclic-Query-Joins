// start.sh
#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test

# Start the server
echo "Starting server..."
npm start