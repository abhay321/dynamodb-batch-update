// import the necessary packages and configure AWS SDK to use your credentials:
const { DynamoDBClient, TransactWriteItemsCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// This function retrieves all items from the table, handling pagination as needed.
const scanTable = async (tableName) => {
  let items = [];
  let lastEvaluatedKey = null;

  do {
      const params = {
          TableName: tableName,
          ProjectionExpression: "#PK, #SK, #PD",
          ExpressionAttributeNames: {
              "#PK": "partitionKey",
              "#SK": "sortKey",
              "#PD": "previousDegrees"
          },
          ExclusiveStartKey: lastEvaluatedKey
      };

      const response = await client.send(new ScanCommand(params));
      items = items.concat(response.Items);
      lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
};

// This function prepares the list of update requests for DynamoDB transactions.
const constructTransactItems = (items, tableName) => {
  const currentTimestamp = new Date().toISOString();

  return items.map(item => {
      const isExpert = !item.previousDegrees; // Determine if the student is an expert

      return {
          Update: {
              TableName: tableName,
              Key: {
                  partitionKey: { S: item.partitionKey.S },
                  sortKey: { S: item.sortKey.S }
              },
              UpdateExpression: `SET #IS = :is_expert, #UPD = :updated_at`,
              ExpressionAttributeNames: {
                  "#IS": "isExpert",
                  "#UPD": "updatedAt"
              },
              ExpressionAttributeValues: {
                  ":is_expert": { BOOL: isExpert },
                  ":updated_at": { M: {
                      "updatedTime": { S: currentTimestamp },
                      "updateBy": { S: "Batch update migration" }
                  }}
              }
          }
      };
  });
};

// This function handles sending the batch updates with retry logic for handling errors
const performBatchUpdate = async (transactItems) => {
  const batchSize = 25; // Maximum number of items per transaction

  for (let i = 0; i < transactItems.length; i += batchSize) {
      const batch = transactItems.slice(i, i + batchSize);
      const params = { TransactItems: batch };
      let success = false;

      while (!success) {
          try {
              await client.send(new TransactWriteItemsCommand(params));
              success = true;
          } catch (error) {
              console.error('Error performing batch update:', error);
              await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i / batchSize))); // Exponential backoff
          }
      }
  }
};

// This function coordinates the entire bulk update process.

const bulkUpdateItems = async () => {
  try {
      const tableName = process.env.DYNAMODB_TABLE_NAME; // Add table name from .env

      const items = await scanTable(tableName);
      const transactItems = constructTransactItems(items, tableName);
      await performBatchUpdate(transactItems);

      console.log('Batch update completed successfully.');
  } catch (error) {
      console.error('Error updating items:', error);
  }
};

bulkUpdateItems()
  .then(() => console.log('Bulk updates complete'))
  .catch(err => console.error('Error in bulk update process:', err));