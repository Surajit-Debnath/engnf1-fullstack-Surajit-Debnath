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
  // ==================== BILLING ====================

  {
    externalId: "SEED-001",
    subject: "Duplicate payment deducted from bank account",
    body: "My subscription payment was deducted twice. Please refund the additional amount.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-002",
    subject: "Monthly invoice unavailable",
    body: "I cannot download the invoice for my latest subscription payment.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-003",
    subject: "Payment gateway failure affecting all customers",
    body: "Urgent! Customers cannot complete payments and production transactions are failing.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "URGENT",
    status: "OPEN",
  },
  {
    externalId: "SEED-004",
    subject: "Incorrect billing address on receipt",
    body: "Please update the billing address displayed on my payment receipt.",
    autoCategory: "BILLING",
    category: "BILLING",
    priority: "LOW",
    status: "OPEN",
  },

  // ==================== BUG ====================

  {
    externalId: "SEED-005",
    subject: "Application crashes while uploading documents",
    body: "The application crashes whenever I upload a PDF document larger than 5 MB.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-006",
    subject: "Internal server error while saving profile",
    body: "The profile update API returns a 500 error whenever I save my personal information.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-007",
    subject: "Dashboard charts display incorrect values",
    body: "The dashboard analytics chart shows incorrect totals after changing the date filter.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-008",
    subject: "Production application completely unavailable",
    body: "Urgent! Production is down and all users are receiving application errors.",
    autoCategory: "BUG",
    category: "BUG",
    priority: "URGENT",
    status: "OPEN",
  },

  // ==================== FEATURE REQUEST ====================

  {
    externalId: "SEED-009",
    subject: "Introduce dark mode",
    body: "Please add a dark mode option to improve readability during nighttime usage.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "LOW",
    status: "OPEN",
  },
  {
    externalId: "SEED-010",
    subject: "Export reports in CSV format",
    body: "I would like a feature to export monthly reports as CSV files for further analysis.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-011",
    subject: "Introduce bulk ticket assignment",
    body: "Please add a feature that allows administrators to assign multiple tickets to an agent simultaneously.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-012",
    subject: "Custom keyboard shortcuts",
    body: "It would be helpful to have configurable keyboard shortcuts for frequently used actions.",
    autoCategory: "FEATURE_REQUEST",
    category: "FEATURE_REQUEST",
    priority: "LOW",
    status: "OPEN",
  },

  // ==================== LOGIN ====================

  {
    externalId: "SEED-013",
    subject: "Password reset email not received",
    body: "I requested a password reset several times but have not received the reset email.",
    autoCategory: "LOGIN",
    category: "LOGIN",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-014",
    subject: "Multiple employees locked out of accounts",
    body: "Urgent! Our entire support team is unable to log in because their accounts are locked.",
    autoCategory: "LOGIN",
    category: "LOGIN",
    priority: "URGENT",
    status: "OPEN",
  },
  {
    externalId: "SEED-015",
    subject: "Two-factor authentication code rejected",
    body: "The login system rejects valid two-factor authentication codes generated by my authenticator.",
    autoCategory: "LOGIN",
    category: "LOGIN",
    priority: "HIGH",
    status: "OPEN",
  },

  // ==================== DELIVERY ====================

  {
    externalId: "SEED-016",
    subject: "Order not delivered within estimated date",
    body: "My package has not arrived even though the expected delivery date has passed.",
    autoCategory: "DELIVERY",
    category: "DELIVERY",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    externalId: "SEED-017",
    subject: "Shipment tracking information unavailable",
    body: "The tracking number provided for my shipment does not display any delivery information.",
    autoCategory: "DELIVERY",
    category: "DELIVERY",
    priority: "MEDIUM",
    status: "OPEN",
  },
  {
    externalId: "SEED-018",
    subject: "Request to change delivery instructions",
    body: "Please update my delivery instructions to leave the package at the reception desk.",
    autoCategory: "DELIVERY",
    category: "DELIVERY",
    priority: "LOW",
    status: "OPEN",
  },

  // ==================== HUMAN REVIEWED TICKETS ====================

  {
    externalId: "SEED-019",
    subject: "Refund processing page freezes",
    body: "Whenever I attempt to request a refund, the application freezes and displays an unexpected exception.",
    autoCategory: "BILLING",
    category: "BUG",
    priority: "HIGH",
    status: "IN_PROGRESS",
    isHumanOverride: true,
    isReviewed: true,
  },
  {
    externalId: "SEED-020",
    subject: "Delivery notification preferences",
    body: "I would like a new feature that allows customers to configure SMS and email notifications for package deliveries.",
    autoCategory: "DELIVERY",
    category: "FEATURE_REQUEST",
    priority: "MEDIUM",
    status: "OPEN",
    isHumanOverride: true,
    isReviewed: true,
  },
  {
    externalId: "SEED-021",
    subject: "Login blocked due to incorrect subscription charge",
    body: "My account access was suspended because the system incorrectly marked my paid subscription as unpaid.",
    autoCategory: "LOGIN",
    category: "LOGIN",
    priority: "HIGH",
    status: "IN_PROGRESS",
    isHumanOverride: false,
    isReviewed: true,
  },

  // ==================== XSS TEST TICKET ====================

  {
    externalId: "SEED-022",
    subject: "HTML rendering security test",
    body: 'Please investigate this message: <script>alert("XSS")</script><img src="x" onerror="alert(1)">',
    autoCategory: "BUG",
    category: "BUG",
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
