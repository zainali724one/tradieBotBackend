const { catchAsyncError } = require("../middlewares/catchAsyncError");
const History = require("../models/History");
const { ErrorHandler } = require("../utils/ErrorHandler");

exports.getHistory = catchAsyncError(async (req, res,next) => {
    const { telegramId } = req.params;
    if (!telegramId) {
      next(new ErrorHandler("telegram uid is required", 400));
    }

    const historyData = await History.aggregate([
      {
        $match: { refererId: telegramId }  
      },
      {
        $lookup: {
          from: 'users',
          
          localField: 'userId',    
          foreignField: 'telegramId',  
          as: 'userDetails'           
        }
      }
    ]);

    if (!historyData) {
      res.status(200).json({ data: [], message: "data not found" });
    }

    res
      .status(200)
      .json({ data: historyData, message: "data found successfuly" });
  
});
