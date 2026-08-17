const { z } = require("zod");

const { MENSTRUAL_RECORD_SOURCES, MENSTRUAL_STATUS } = require("../utils/constants");

const upsertRecordSchema = z.object({
  date: z.iso.date("date must be YYYY-MM-DD"),
  isPeriodDay: z.boolean().optional().default(false),
  isPeriodEnd: z.boolean().optional().default(false),
  status: z.enum(MENSTRUAL_STATUS, { message: `status must be one of: ${MENSTRUAL_STATUS.join(", ")}` }).optional(),
  flowLevel: z.string().trim().min(1).max(40).optional(),
  symptoms: z.array(z.string().trim().min(1).max(40)).optional().default([]),
  mood: z.string().trim().min(1).max(40).optional(),
  notes: z.string().max(1000).optional().default(""),
  source: z.enum(MENSTRUAL_RECORD_SOURCES, { message: `source must be one of: ${MENSTRUAL_RECORD_SOURCES.join(", ")}` }),
});

module.exports = { upsertRecordSchema };
