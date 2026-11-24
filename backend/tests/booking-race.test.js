
require("dotenv").config();

const API_URL = process.env.API_URL || "http://localhost:3000";
const JWT_TOKEN = process.env.JWT_TOKEN;
const RESOURCE_ID = process.env.RESOURCE_ID;

const REQUEST_COUNT = 10;

if (!JWT_TOKEN || !RESOURCE_ID) {
  throw new Error("JWT_TOKEN and RESOURCE_ID must be set in .env");
}

// Generate a future 60-minute slot, aligned to the UTC 30-minute grid.
function generateTimeSlot() {
  const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  start.setUTCMinutes(
    Math.ceil(start.getUTCMinutes() / 30) * 30,
    0,
    0
  );

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

async function sendBookingRequest(body, index) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token:JWT_TOKEN,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    return {
      request: index + 1,
      status: response.status,
      durationMs: Date.now() - startTime,
      response: result,
    };
  } catch (error) {
    return {
      request: index + 1,
      status: "NETWORK_ERROR",
      message: error.message,
    };
  }
}

async function runRaceTest() {
  const timeSlot = generateTimeSlot();

  const bookingBody = {
    resourceId: RESOURCE_ID,
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    purpose: "Race safety concurrency test",
  };

  console.log("Starting race safety test...");
  console.log("Requests:", REQUEST_COUNT);
  console.log("Resource:", RESOURCE_ID);
  console.log("Time slot:", timeSlot);

  // All requests are started concurrently.
  const results = await Promise.all(
    Array.from(
      { length: REQUEST_COUNT },
      (_, index) => sendBookingRequest(bookingBody, index)
    )
  );

  console.table(
    results.map(({ request, status, durationMs }) => ({
      request,
      status,
      durationMs,
    }))
  );

  const successCount = results.filter(
    (result) => result.status === 201
  ).length;

  const conflictCount = results.filter(
    (result) => result.status === 409
  ).length;

  const unexpectedCount = results.filter(
    (result) => ![201, 409].includes(result.status)
  ).length;

  console.log("\n========== RACE TEST RESULT ==========");
  console.log("Successful bookings:", successCount);
  console.log("Conflicts:", conflictCount);
  console.log("Unexpected responses:", unexpectedCount);

  if (
    successCount === 1 &&
    conflictCount === REQUEST_COUNT - 1 &&
    unexpectedCount === 0
  ) {
    console.log("\nPASS: Race safety test successful!");
  } else {
    console.log("\nFAIL: Expected exactly one 201 and nine 409 responses.");

    for (const result of results) {
      if (![201, 409].includes(result.status)) {
        console.log(`Request ${result.request}:`, result.response || result.message);
      }
    }

    process.exitCode = 1;
  }
}

runRaceTest();
