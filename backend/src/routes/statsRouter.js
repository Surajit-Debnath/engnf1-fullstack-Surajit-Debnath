const { Router } = require('express');
const statsRouter = Router();
const { sendError } = require('../utils/apiResponse');
const Ticket = require('../models/Ticket');

const CATEGORIES = ['BILLING', 'BUG', 'FEATURE_REQUEST', 'LOGIN', 'DELIVERY'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function formatCounts(results, allowedValues) {
  const counts = Object.fromEntries(allowedValues.map((value) => [value, 0]));
  for (const item of results) {
    counts[item._id] = item.count;
  }
  return counts;
}

async function getTicketStats() {
  const [result] = await Ticket.aggregate([
    {
      $facet: {
        byCategory: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
            },
          },
        ],

        byPriority: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ],

        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],

        reviewStats: [
          {
            $match: {
              isReviewed: true,
            },
          },
          {
            $group: {
              _id: null,
              reviewedCount: { $sum: 1 },
              agreementCount: {
                $sum: {
                  $cond: [{ $eq: ['$category', '$autoCategory'] }, 1, 0],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  const reviewStats = result.reviewStats[0] || {
    reviewedCount: 0,
    agreementCount: 0,
  };

  const modelAgreementRate =
    reviewStats.reviewedCount === 0
      ? 0
      : Number(
          (
            (reviewStats.agreementCount / reviewStats.reviewedCount) *
            100
          ).toFixed(2)
        );

  return {
    byCategory: formatCounts(result.byCategory, CATEGORIES),
    byPriority: formatCounts(result.byPriority, PRIORITIES),
    byStatus: formatCounts(result.byStatus, STATUSES),
    reviewedCount: reviewStats.reviewedCount,
    modelAgreementRate,
  };
}

statsRouter.get('/', async (req, res) => {
  try {
    const stats = await getTicketStats();

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get ticket stats error:', error);

    return sendError(
      res,
      500,
      'INTERNAL_SERVER_ERROR',
      'Internal Server Error'
    );
  }
});

module.exports = {
  statsRouter: statsRouter,
};
