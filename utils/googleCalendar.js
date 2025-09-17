const { google } = require("googleapis");

/**
 * Save job as a Google Calendar Event
 */
async function createCalendarEvent(user, jobData) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Build event details
    const event = {
      summary: `Job for ${jobData.customerName}`,
      description: `Job Description: ${jobData.jobDescription}`,
      start: {
        dateTime: jobData.startTime, // e.g. "2025-09-18T10:00:00-07:00"
        timeZone: "UTC", // or user’s local tz
      },
      end: {
        dateTime: jobData.endTime, // e.g. "2025-09-18T11:00:00-07:00"
        timeZone: "UTC",
      },
      attendees: jobData.customerEmail
        ? [{ email: jobData.customerEmail }]
        : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 10 }, // 10 min before
        ],
      },
    };

    // Insert event
    const response = await calendar.events.insert({
      calendarId: "primary", // main Google Calendar
      resource: event,
    });

    console.log("✅ Calendar event created:", response.data.htmlLink);
    return response.data;
  } catch (err) {
    console.error("❌ Error creating calendar event:", err.message);
    throw err;
  }
}

module.exports = { createCalendarEvent };
