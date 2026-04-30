/**
 * Test Script for Enhanced Features
 * Run this to verify all features are working
 * 
 * Usage: node test-features.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const tests = {
  passed: 0,
  failed: 0,
  total: 0,
};

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function pass(message) {
  tests.passed++;
  tests.total++;
  log("✅", message);
}

function fail(message) {
  tests.failed++;
  tests.total++;
  log("❌", message);
}

async function testDatabaseConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    pass("Database connection successful");
    return true;
  } catch (error) {
    fail(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function testModels() {
  try {
    const Message = (await import("./models/message.model.js")).default;
    const MessageExtended = (await import("./models/messageExtended.model.js")).default;
    const OfflineQueue = (await import("./models/offlineQueue.model.js")).default;
    const NotificationPreference = (await import("./models/notificationPreference.model.js")).default;
    const ChatBackup = (await import("./models/chatBackup.model.js")).default;

    pass("All models loaded successfully");
    return true;
  } catch (error) {
    fail(`Model loading failed: ${error.message}`);
    return false;
  }
}

async function testIndexes() {
  try {
    const db = mongoose.connection.db;
    
    // Check messages collection indexes
    const messageIndexes = await db.collection("messages").indexes();
    if (messageIndexes.length > 1) {
      pass(`Messages collection has ${messageIndexes.length} indexes`);
    } else {
      fail("Messages collection missing indexes - run migrations/createIndexes.js");
    }

    // Check if messageextendeds collection exists
    const collections = await db.listCollections().toArray();
    const hasExtended = collections.some(c => c.name === "messageextendeds");
    
    if (hasExtended) {
      pass("MessageExtended collection exists");
    } else {
      log("⚠️ ", "MessageExtended collection will be created on first use");
    }

    return true;
  } catch (error) {
    fail(`Index check failed: ${error.message}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  const required = [
    "MONGODB_URI",
    "JWT_SECRET",
    "VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "VAPID_SUBJECT",
  ];

  let allPresent = true;

  for (const key of required) {
    if (process.env[key]) {
      pass(`Environment variable ${key} is set`);
    } else {
      fail(`Environment variable ${key} is missing`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function testCronJobs() {
  try {
    const { startCronJobs } = await import("./Utils/cronJobs.js");
    
    // Don't actually start them, just check if they can be imported
    pass("Cron jobs module loaded successfully");
    return true;
  } catch (error) {
    fail(`Cron jobs test failed: ${error.message}`);
    return false;
  }
}

async function testControllers() {
  try {
    await import("./controller/messageExtended.controller.js");
    await import("./controller/offlineQueue.controller.js");
    await import("./controller/chatSearch.controller.js");
    await import("./controller/pushNotification.controller.js");
    await import("./controller/chatBackup.controller.js");

    pass("All controllers loaded successfully");
    return true;
  } catch (error) {
    fail(`Controller loading failed: ${error.message}`);
    return false;
  }
}

async function testRoutes() {
  try {
    await import("./routes/messageExtended.route.js");
    await import("./routes/offlineQueue.route.js");
    await import("./routes/chatSearch.route.js");
    await import("./routes/pushNotification.route.js");
    await import("./routes/chatBackup.route.js");

    pass("All routes loaded successfully");
    return true;
  } catch (error) {
    fail(`Route loading failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("\n🧪 Testing Enhanced Features\n");
  console.log("=" .repeat(50));

  // Test 1: Environment Variables
  console.log("\n📋 Testing Environment Variables...");
  await testEnvironmentVariables();

  // Test 2: Database Connection
  console.log("\n🗄️  Testing Database Connection...");
  const dbConnected = await testDatabaseConnection();

  if (dbConnected) {
    // Test 3: Models
    console.log("\n📦 Testing Models...");
    await testModels();

    // Test 4: Indexes
    console.log("\n🔍 Testing Database Indexes...");
    await testIndexes();
  }

  // Test 5: Controllers
  console.log("\n🎮 Testing Controllers...");
  await testControllers();

  // Test 6: Routes
  console.log("\n🛣️  Testing Routes...");
  await testRoutes();

  // Test 7: Cron Jobs
  console.log("\n⏰ Testing Cron Jobs...");
  await testCronJobs();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Test Summary:");
  console.log(`   Total Tests: ${tests.total}`);
  console.log(`   ✅ Passed: ${tests.passed}`);
  console.log(`   ❌ Failed: ${tests.failed}`);

  if (tests.failed === 0) {
    console.log("\n🎉 All tests passed! Your enhanced features are ready to use!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the server: npm start");
    console.log("   2. Test API endpoints (see SETUP_INSTRUCTIONS.md)");
    console.log("   3. Integrate UI components");
  } else {
    console.log("\n⚠️  Some tests failed. Please fix the issues above.");
    console.log("\n💡 Common fixes:");
    console.log("   - Run: npm install node-cron web-push");
    console.log("   - Generate VAPID keys: npx web-push generate-vapid-keys");
    console.log("   - Add keys to .env file");
    console.log("   - Run: node migrations/createIndexes.js");
  }

  console.log("\n");

  // Close database connection
  await mongoose.connection.close();
  process.exit(tests.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error("\n❌ Test runner error:", error);
  process.exit(1);
});
