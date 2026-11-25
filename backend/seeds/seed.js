require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const Resource = require("../src/models/Resource");
const Ticket = require("../src/models/Ticket");
const TicketEvent = require("../src/models/TicketEvent");
const Booking = require("../src/models/Booking");
// --------------------------------------------------
// 1. USERS
// --------------------------------------------------

const users = [
  {
    name: "Admin Lead",
    email: "admin@triagesync.test",
    password: "Admin@123",
    role: "ADMIN",
  },
  {
    name: "Agent Demo",
    email: "user@triagesync.test",
    password: "User@123",
    role: "USER",
  },
];

// --------------------------------------------------
// 2. RESOURCES
// --------------------------------------------------

const resources = [
  {
    name: "Conference Room A",
    type: "ROOM",
    capacity: 20,
    description: "Meeting room for team discussions",
    isActive: true,
  },
  {
    name: "Training Room B",
    type: "ROOM",
    capacity: 35,
    description: "Room for training sessions",
    isActive: true,
  },
  {
    name: "Computer Lab A",
    type: "LAB",
    capacity: 40,
    description: "Computer programming laboratory",
    isActive: true,
  },
  {
    name: "Electronics Lab",
    type: "LAB",
    capacity: 25,
    description: "Electronics testing laboratory",
    isActive: true,
  },
  {
    name: "Projector Epson",
    type: "EQUIPMENT",
    capacity: 5,
    description: "HD projector for presentations",
    isActive: true,
  },
  {
    name: "Network Testing Kit",
    type: "EQUIPMENT",
    capacity: 10,
    description: "Network testing equipment",
    isActive: false,
  },
];

// --------------------------------------------------
// 3. INITIAL TICKETS
// --------------------------------------------------

const tickets = [
  // BILLING
  {
    externalId: "SEED-001",
    subject: "Refund request for duplicate payment",
    body: "I was charged twice and need a refund.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-002",
    subject: "Invoice not generated",
    body: "Please generate my missing invoice.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-003",
    subject: "Urgent payment issue",
    body: "Urgent! Production down because payment processing is failing.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "URGENT",
    status: "IN_PROGRESS",
  },
  {
    externalId: "SEED-004",
    subject: "Incorrect charge on account",
    body: "There is an incorrect charge on my account.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "LOW",
    status: "RESOLVED",
  },

  // BUG
  {
    externalId: "SEED-005",
    subject: "Application crashes on login",
    body: "The application crashes with an exception.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-006",
    subject: "Server returns 500 error",
    body: "The API returns a 500 error.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "HIGH",
    status: "IN_PROGRESS",
  },
  {
    externalId: "SEED-007",
    subject: "Broken dashboard",
    body: "The dashboard is broken after the latest update.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-008",
    subject: "Production down due to application error",
    body: "Urgent production down issue. The application is broken.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "URGENT",
    status: "IN_PROGRESS",
  },

  // FEATURE REQUEST
  {
    externalId: "SEED-009",
    subject: "Add dark mode",
    body: "Please add a dark mode option to the dashboard.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "LOW",
    status: "OPEN",
  },
  {
    externalId: "SEED-010",
    subject: "Export reports feature",
    body: "I would like to export reports as PDF files.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-011",
    subject: "Add dashboard analytics",
    body: "Please add more analytics to the dashboard.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "HIGH",
    status: "RESOLVED",
  },
  {
    externalId: "SEED-012",
    subject: "Add keyboard shortcuts",
    body: "It would be useful to have keyboard shortcuts.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "MEDIUM",
    status: "CLOSED",
  },

  // LOGIN
  {
    externalId: "SEED-013",
    subject: "Password reset not working",
    body: "I cannot reset my password.",
    autoCategory: "LOGIN",
    category: "LOGIN",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-014",
    subject: "Account locked out",
    body: "I am locked out of my account.",
    autoCategory: "LOGIN",
    category: "LOGIN",
    priority: "URGENT",
    status: "IN_PROGRESS",
  },
  {
    externalId: "SEED-015",
    subject: "Two factor authentication problem",
    body: "My 2FA verification is failing.",
    autoCategory: "LOGIN",
    category: "LOGIN",
    priority: "HIGH",
    status: "OPEN",
  },

  // DELIVERY
  {
    externalId: "SEED-016",
    subject: "Package has not arrived",
    body: "My package has not arrived yet.",
    autoCategory: "DELIVERY",
    category: "DELIVERY",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-017",
    subject: "Shipping tracking unavailable",
    body: "The tracking information is unavailable.",
    autoCategory: "DELIVERY",
    category: "DELIVERY",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
  },
  {
    externalId: "SEED-018",
    subject: "Delivery status update",
    body: "Please provide a delivery status update.",
    autoCategory: "DELIVERY",
    category: "DELIVERY",
    priority: "LOW",
    status: "RESOLVED",
  },

  // HUMAN REVIEWED TICKETS
  {
    externalId: "SEED-019",
    subject: "Refund request classified incorrectly",
    body: "My refund is pending. Please investigate.",
    autoCategory: "BILLING",
    category: "BUG",
    priority: "HIGH",
    status: "IN_PROGRESS",
    isHumanOverride: true,
    isReviewed: true,
  },
  {
    externalId: "SEED-020",
    subject: "Package tracking issue reviewed",
    body: "The tracking page returns an error.",
    autoCategory: "DELIVERY",
    category: "BUG",
    priority: "MEDIUM",
    status: "RESOLVED",
    isHumanOverride: true,
    isReviewed: true,
  },
  {
    externalId: "SEED-021",
    subject: "Login issue reviewed by agent",
    body: "The login screen is broken.",
    autoCategory: "LOGIN",
    category: "BUG",
    priority: "HIGH",
    status: "IN_PROGRESS",
    isHumanOverride: true,
    isReviewed: true,
  },

  // XSS TEST TICKET
  {
    externalId: "SEED-022",
    subject: "HTML rendering security test",
    body: 'Please investigate this message: <script>alert("XSS")</script><img src="x" onerror="alert(1)">',
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "MEDIUM",
    status: "OPEN",
  },
];

// --------------------------------------------------
// SEED HELPER: USERS
// --------------------------------------------------

async function seedUsers() {
  console.log("\nSeeding users...");

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    await User.findOneAndUpdate(
      { email: userData.email.toLowerCase() },
      {
        $set: {
          name: userData.name,
          email: userData.email.toLowerCase(),
          passwordHash,
          role: userData.role,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log(`User seeded: ${userData.email} (${userData.role})`);
  }
}

// --------------------------------------------------
// SEED HELPER: RESOURCES
// --------------------------------------------------

async function seedResources() {
  console.log("\nSeeding resources...");

  for (const resource of resources) {
    const escapedName = resource.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    await Resource.findOneAndUpdate(
      {
        name: {
          $regex: `^${escapedName}$`,
          $options: "i",
        },
      },
      {
        $setOnInsert: resource,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log(`Resource seeded: ${resource.name}`);
  }
}

// --------------------------------------------------
// SEED HELPER: TICKETS
// --------------------------------------------------

async function seedTickets() {
  console.log("\nSeeding tickets...");

  const admin = await User.findOne({
    email: "admin@triagesync.test",
  });

  if (!admin) {
    throw new Error("Seed ADMIN user was not created");
  }

  const agent = await User.findOne({
    email: "user@triagesync.test",
  });

  if (!agent) {
    throw new Error("Seed USER account was not created");
  }

  const reviewedIds = [];

  for (const ticketData of tickets) {
    const ticket = await Ticket.findOneAndUpdate(
      { externalId: ticketData.externalId },
      {
        $setOnInsert: {
          ...ticketData,
          isHumanOverride: ticketData.isHumanOverride || false,
          isReviewed: ticketData.isReviewed || false,
          assigneeId: agent._id,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log(`Ticket seeded: ${ticketData.externalId}`);

    if (ticketData.isReviewed) {
      reviewedIds.push({
        ticket,
        originalCategory: ticketData.autoCategory,
      });
    }
  }

  // Create audit events for the three reviewed tickets.
  for (const item of reviewedIds) {
    const { ticket, originalCategory } = item;

    await TicketEvent.updateOne(
      {
        ticketId: ticket._id,
        field: "category",
        actor: admin.email,
        newValue: ticket.category,
      },
      {
        $setOnInsert: {
          ticketId: ticket._id,
          field: "category",
          oldValue: originalCategory,
          newValue: ticket.category,
          actor: admin.email,
        },
      },
      {
        upsert: true,
        runValidators: true,
      }
    );
  }

  console.log(`Reviewed tickets seeded: ${reviewedIds.length}`);
}

async function clearDatabase() {
  console.log("\nDeleting previous application data...");

  const bookings = await Booking.deleteMany({});
  const events = await TicketEvent.deleteMany({});
  const tickets = await Ticket.deleteMany({});
  const resources = await Resource.deleteMany({});
  const users = await User.deleteMany({});

  console.table({
    bookings: bookings.deletedCount,
    ticketEvents: events.deletedCount,
    tickets: tickets.deletedCount,
    resources: resources.deletedCount,
    users: users.deletedCount,
  });

  console.log("Previous application data deleted successfully.");
}
// --------------------------------------------------
// MAIN SEED FUNCTION
// --------------------------------------------------

async function seedDatabase() {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL is missing from .env");
    }

    const shouldReset = process.argv.includes("--reset");

    await mongoose.connect(process.env.MONGODB_URL);

    console.log("MongoDB connected");
    console.log("Database:", mongoose.connection.name);

    if (shouldReset) {
      await clearDatabase();
    }

    await seedUsers();
    await seedResources();
    await seedTickets();

    console.log("\n================================");
    console.log("DATABASE SEEDING COMPLETED");
    console.log("================================");

    console.table({
      users: await User.countDocuments(),
      resources: await Resource.countDocuments(),
      tickets: await Ticket.countDocuments(),
      reviewedTickets: await Ticket.countDocuments({
        isReviewed: true,
      }),
      ticketEvents: await TicketEvent.countDocuments(),
      bookings: await Booking.countDocuments(),
    });

  } catch (error) {
    console.error("\nDatabase seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}
seedDatabase();
