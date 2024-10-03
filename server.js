require("dotenv").config();
const { MongoClient } = require("mongodb");

// Load URIs from .env
const SOURCE_MONGODB_URI = process.env.SOURCE_MONGODB_URI;
const DEST_MONGODB_URI = process.env.DEST_MONGODB_URI;

// Database name
const sourceDbName = "al-application-system-production";

// Function to generate backup database name with current date and time
function getBackupDbName() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 19).replace(/[-T:]/g, ""); // Format: YYYYMMDDHHMMSS
  return `backup-al-app-${dateStr}`; // Shortened to fit within the 38-byte limit
}
// Function to copy data from one database to another
async function copyDatabase() {
  const sourceClient = new MongoClient(SOURCE_MONGODB_URI);
  const destClient = new MongoClient(DEST_MONGODB_URI);

  try {
    // Connect to both clusters
    await sourceClient.connect();
    await destClient.connect();

    console.log("Connected to both databases.");

    const sourceDb = sourceClient.db(sourceDbName);
    const destDbName = getBackupDbName();
    const destDb = destClient.db(destDbName);

    console.log(`Destination database name: ${destDbName}`);

    // Get all collections in the source database
    const collections = await sourceDb.collections();

    for (const collection of collections) {
      const data = await collection.find({}).toArray();
      if (data.length > 0) {
        const destCollection = destDb.collection(collection.collectionName);
        await destCollection.insertMany(data);
        console.log(
          `Copied ${data.length} documents from collection ${collection.collectionName}`
        );
      }
    }
  } catch (err) {
    console.error("Error copying database:", err);
  } finally {
    await sourceClient.close();
    await destClient.close();
    console.log("Database copy completed.");
  }
}

copyDatabase();
