const { z } = require("zod");
const {
  createAlert,
  markEmailDelivered,
  listRecentAlerts,
} = require("./alertStore");
const { sendHighPriorityFallbackEmail } = require("./emailService");

const alertSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(3),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  channel: z.string().default("campus:global"),
  recipient_email: z.string().email().optional(),
});

async function publishAlert(io, payload) {
  const parsed = alertSchema.parse(payload);
  const alert = await createAlert(parsed);

  io.to(parsed.channel).emit("alert:new", {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    priority: alert.priority,
    createdAt: alert.created_at,
  });

  if (parsed.priority === "HIGH" && parsed.recipient_email) {
    const onlineCount = io.sockets.adapter.rooms.get(parsed.channel)?.size || 0;

    if (onlineCount === 0) {
      const subject = `[CampusPulse HIGH Alert] ${parsed.title}`;
      const body = `${parsed.message}\n\nThis is an email fallback because no active WebSocket subscribers were found.`;
      const result = await sendHighPriorityFallbackEmail({
        to: parsed.recipient_email,
        subject,
        body,
      });

      if (result.delivered) {
        await markEmailDelivered(alert.id);
      }
    }
  }

  return alert;
}

module.exports = { publishAlert, listRecentAlerts };
