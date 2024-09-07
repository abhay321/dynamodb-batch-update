# DynamoDB Batch Update Multiple Items

This project demonstrates how to batch update multiple items in a DynamoDB table using Node.js. The solution leverages DynamoDB's `transactWriteItems` API to handle multiple updates efficiently in a single transaction.

## Overview

In this repository, you'll find a practical guide to implementing batch updates in DynamoDB. This includes setting up your Node.js environment, configuring DynamoDB, and executing batch updates with retry logic.

## Features

- **Batch Update Items:** Efficiently update multiple items in DynamoDB using the `transactWriteItems` API.
- **Pagination Handling:** Retrieves all items from the table, handling pagination as needed.
- **Retry Logic:** Implements retry logic to handle errors and ensure reliable operations.

## Setup Instructions

### Prerequisites

- Node.js
- AWS SDK for JavaScript
- AWS Credentials (access key, secret key, and region)

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/abhay321/dynamodb-batch-update.git
   cd dynamodb-batch-update
   ```

2. **Install Dependencies:**
  Install the required npm packages listed in package.json by running:
   
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
  Rename sample.env to .env and update records

4. **Run the Script:**
  Execute the script to perform the batch update:

  ```bash
   node index.js
  ```
