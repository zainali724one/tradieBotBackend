const Job = require("../models/job");
const User = require("../models/User");
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const { ErrorHandler } = require("../utils/ErrorHandler");
const { createCalendarEvent } = require("../utils/googleCalendar");
const { combineDateTime } = require("../utils/combineDateTime");

exports.addJob = catchAsyncError(async (req, res, next) => {
  const { customerName, jobDescription, date, time, telegramId, userId } =
    req.body;

  const isEmpty = (value) => !value || value.toString().trim() === "";

  if (isEmpty(customerName))
    return next(new ErrorHandler("Customer Name is required", 400));
  if (isEmpty(jobDescription))
    return next(new ErrorHandler("Job Description is required", 400));
  if (isEmpty(date)) return next(new ErrorHandler("Date is required", 400));
  if (isEmpty(time)) return next(new ErrorHandler("Time is required", 400));
  if (isEmpty(telegramId))
    return next(new ErrorHandler("Telegram ID is required", 400));
  if (isEmpty(userId))
    return next(new ErrorHandler("User ID is required", 400));

  if (isNaN(Date.parse(date))) {
    return next(
      new ErrorHandler(
        "Invalid date format. Please use YYYY-MM-DD or ISO format.",
        400
      )
    );
  }
  const userExists = await User.findOne({ telegramId });
  if (!userExists) {
    return next(new ErrorHandler("No user found with this Telegram ID", 404));
  }
  const startTime = combineDateTime(date, time);
  const endTime = combineDateTime(date, time); // simple 1-hour duration
  const endTimeISO = new Date(
    new Date(endTime).getTime() + 60 * 60 * 1000
  ).toISOString();
  await createCalendarEvent(
    { ...userExists },
    {
      customerName,
      jobDescription,
      startTime,
      endTime: endTimeISO,
    }
  );
  const newJob = new Job({
    customerName,
    jobDescription,
    date,
    time,
    telegramId,
    userId,
  });

  await newJob.save();

  res.status(201).json({
    success: true,
    message: "Job created successfully",
    job: newJob,
  });
});

exports.getHistory = catchAsyncError(async (req, res, next) => {
  const { telegramId } = req.query;

  if (!telegramId || telegramId.toString().trim() === "") {
    return next(new ErrorHandler("Telegram ID is required", 400));
  }

  const jobs = await Job.find({ telegramId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: jobs.length,
    history: jobs,
  });
});
