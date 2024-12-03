

# Download latest DBLP XML data using curl
echo "Downloading DBLP dataset..."
curl -o dblp.xml.gz https://dblp.org/xml/dblp.xml.gz

# Extract the data
echo "Extracting dataset..."
gunzip dblp.xml.gz

echo "DBLP data setup complete"