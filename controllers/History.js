const { catchAsyncError } = require("../middlewares/catchAsyncError");
const History = require("../models/History");
const { ErrorHandler } = require("../utils/ErrorHandler");
const mongoose = require("mongoose");




exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete history id:", id);

    // Validate Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid history id" });
    }

    const deleted = await History.findByIdAndDelete(id);
    console.log("Deleted history:", deleted);

    if (!deleted) {
      return res.status(404).json({ error: "History not found" });
    }
    console.log("History deleted successfully:", deleted);

    return res.status(200).json({
      message: "History deleted successfully",
      id: deleted._id,
    });
    console.log("History deleted successfully:", deleted);
  } catch (err) {
    console.error("Delete history error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



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
