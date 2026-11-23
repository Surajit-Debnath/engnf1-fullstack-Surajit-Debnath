
const CATEGORY_RULES = [
  {
    category: "BILLING",
    keywords: ["refund", "invoice", "charge", "payment"],
  },
  {
    category: "LOGIN",
    keywords: ["password", "2fa", "sign in", "locked out", "login"],
  },
  {
    category: "DELIVERY",
    keywords: ["package", "arrived", "shipping", "tracking", "delivery"],
  },
  {
    category: "BUG",
    keywords: ["crash", "error", "500", "exception", "broken"],
  },
];

const PRIORITY_RULES = [
  {
    priority: "URGENT",
    keywords: ["urgent", "production down", "locked out"],
  },
  {
    priority: "HIGH",
    keywords: ["error", "refund", "not arrived"],
  },
];

function containsKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

function classifyTicket(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();

  let autoCategory = "FEATURE_REQUEST";

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => containsKeyword(text, keyword))) {
      autoCategory = rule.category;
      break;
    }
  }

  let priority = "MEDIUM";

  for (const rule of PRIORITY_RULES) {
    if (rule.keywords.some((keyword) => containsKeyword(text, keyword))) {
      priority = rule.priority;
      break;
    }
  }

  return {
    autoCategory,
    priority,
  };
}

module.exports = {
  classifyTicket,
};
