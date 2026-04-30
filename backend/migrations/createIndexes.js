import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function createIndexes() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    console.log("\n📊 Creating indexes...\n");

    // ── Message Indexes ───────────────────────────────────────────────────────
    console.log("Creating message indexes...");
    
    // Text search index
    try {
      await db.collection("messages").createIndex(
        { message: "text" },
        { name: "message_text_search_index" }
      );
      console.log("✅ Message text search index created");
    } catch (error) {
      console.log("⚠️  Message text search index already exists");
    }

    // Compound index for efficient queries
    try {
      await db.collection("messages").createIndex(
        { senderId: 1, receiverId: 1, createdAt: -1 },
        { name: "message_conversation_index" }
      );
      console.log("✅ Message conversation index created");
    } catch (error) {
      console.log("⚠️  Message conversation index already exists");
    }

    // Seen messages index
    try {
      await db.collection("messages").createIndex(
        { receiverId: 1, seen: 1, createdAt: -1 },
        { name: "message_seen_index" }
      );
      console.log("✅ Message seen index created");
    } catch (error) {
      console.log("⚠️  Message seen index already exists");
    }

    // ── MessageExtended Indexes ───────────────────────────────────────────────
    console.log("\nCreating message extended indexes...");

    try {
      await db.collection("messageextendeds").createIndex(
        { messageId: 1 },
        { unique: true, name: "message_extended_unique_index" }
      );
      console.log("✅ MessageExtended unique index created");
    } catch (error) {
      console.log("⚠️  MessageExtended unique index already exists");
    }

    try {
      await db.collection("messageextendeds").createIndex(
        { replyTo: 1 },
        { sparse: true, name: "message_extended_reply_index" }
      );
      console.log("✅ MessageExtended reply index created");
    } catch (error) {
      console.log("⚠️  MessageExtended reply index already exists");
    }

    // TTL index for disappearing messages
    try {
      await db.collection("messageextendeds").createIndex(
        { expiresAt: 1 },
        {
          expireAfterSeconds: 0,
          partialFilterExpression: { isDisappearing: true },
          name: "disappearing_messages_ttl_index",
        }
      );
      console.log("✅ Disappearing messages TTL index created");
    } catch (error) {
      console.log("⚠️  Disappearing messages TTL index already exists");
    }

    // Reactions index
    try {
      await db.collection("messageextendeds").createIndex(
        { "reactions.userId": 1 },
        { sparse: true, name: "message_reactions_index" }
      );
      console.log("✅ Message reactions index created");
    } catch (error) {
      console.log("⚠️  Message reactions index already exists");
    }

    // ── OfflineQueue Indexes ──────────────────────────────────────────────────
    console.log("\nCreating offline queue indexes...");

    try {
      await db.collection("offlinequeues").createIndex(
        { userId: 1, status: 1, priority: -1, createdAt: 1 },
        { name: "offline_queue_processing_index" }
      );
      console.log("✅ Offline queue processing index created");
    } catch (error) {
      console.log("⚠️  Offline queue processing index already exists");
    }

    try {
      await db.collection("offlinequeues").createIndex(
        { status: 1, nextRetryAt: 1 },
        { name: "offline_queue_retry_index" }
      );
      console.log("✅ Offline queue retry index created");
    } catch (error) {
      console.log("⚠️  Offline queue retry index already exists");
    }

    // TTL index for expired queue items
    try {
      await db.collection("offlinequeues").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "offline_queue_ttl_index" }
      );
      console.log("✅ Offline queue TTL index created");
    } catch (error) {
      console.log("⚠️  Offline queue TTL index already exists");
    }

    // ── NotificationPreference Indexes ────────────────────────────────────────
    console.log("\nCreating notification preference indexes...");

    try {
      await db.collection("notificationpreferences").createIndex(
        { userId: 1 },
        { unique: true, name: "notification_preference_user_index" }
      );
      console.log("✅ Notification preference user index created");
    } catch (error) {
      console.log("⚠️  Notification preference user index already exists");
    }

    try {
      await db.collection("notificationpreferences").createIndex(
        { "mutedConversations.conversationId": 1 },
        { sparse: true, name: "notification_muted_conversations_index" }
      );
      console.log("✅ Notification muted conversations index created");
    } catch (error) {
      console.log("⚠️  Notification muted conversations index already exists");
    }

    // ── ChatBackup Indexes ────────────────────────────────────────────────────
    console.log("\nCreating chat backup indexes...");

    try {
      await db.collection("chatbackups").createIndex(
        { userId: 1, status: 1, createdAt: -1 },
        { name: "backup_user_status_index" }
      );
      console.log("✅ Chat backup user status index created");
    } catch (error) {
      console.log("⚠️  Chat backup user status index already exists");
    }

    try {
      await db.collection("chatbackups").createIndex(
        { "schedule.nextBackupAt": 1 },
        { sparse: true, name: "backup_schedule_index" }
      );
      console.log("✅ Chat backup schedule index created");
    } catch (error) {
      console.log("⚠️  Chat backup schedule index already exists");
    }

    // TTL index for expired backups
    try {
      await db.collection("chatbackups").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "backup_ttl_index" }
      );
      console.log("✅ Chat backup TTL index created");
    } catch (error) {
      console.log("⚠️  Chat backup TTL index already exists");
    }

    // ── Conversation Indexes ──────────────────────────────────────────────────
    console.log("\nCreating conversation indexes...");

    try {
      await db.collection("conversations").createIndex(
        { members: 1, updatedAt: -1 },
        { name: "conversation_members_index" }
      );
      console.log("✅ Conversation members index created");
    } catch (error) {
      console.log("⚠️  Conversation members index already exists");
    }

    // ── User Indexes ──────────────────────────────────────────────────────────
    console.log("\nCreating user indexes...");

    try {
      await db.collection("users").createIndex(
        { email: 1 },
        { unique: true, name: "user_email_index" }
      );
      console.log("✅ User email index created");
    } catch (error) {
      console.log("⚠️  User email index already exists");
    }

    try {
      await db.collection("users").createIndex(
        { fullname: "text", email: "text" },
        { name: "user_search_index" }
      );
      console.log("✅ User search index created");
    } catch (error) {
      console.log("⚠️  User search index already exists");
    }

    console.log("\n✅ All indexes created successfully!");
    console.log("\n📊 Index Summary:");

    // List all indexes
    const collections = [
      "messages",
      "messageextendeds",
      "offlinequeues",
      "notificationpreferences",
      "chatbackups",
      "conversations",
      "users",
    ];

    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`\n${collectionName}: ${indexes.length} indexes`);
        indexes.forEach((index) => {
          console.log(`  - ${index.name}`);
        });
      } catch (error) {
        console.log(`\n${collectionName}: Collection not found (will be created on first use)`);
      }
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating indexes:", error);
    process.exit(1);
  }
}

createIndexes();
