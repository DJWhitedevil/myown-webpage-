const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'codemint';

if (!uri) {
  throw new Error('MONGODB_URI is not configured');
}

let clientPromise = globalThis.__codemintMongoClientPromise;

if (!clientPromise) {
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000
  });
  clientPromise = client.connect();
  globalThis.__codemintMongoClientPromise = clientPromise;
}

async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

module.exports = { getDatabase };
