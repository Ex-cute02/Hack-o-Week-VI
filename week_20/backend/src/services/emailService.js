const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const env = require("../config/env");

const ses = new SESClient({ region: env.AWS_REGION });

async function sendHighPriorityFallbackEmail({ to, subject, body }) {
  if (!env.SES_FROM_EMAIL || !to) {
    return { delivered: false, reason: "SES_FROM_EMAIL or recipient missing" };
  }

  try {
    await ses.send(
      new SendEmailCommand({
        Source: env.SES_FROM_EMAIL,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: body } },
        },
      }),
    );

    return { delivered: true };
  } catch (error) {
    return { delivered: false, reason: error.message };
  }
}

module.exports = { sendHighPriorityFallbackEmail };
