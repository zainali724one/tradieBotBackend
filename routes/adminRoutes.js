const express = require("express");
const {
  adminLogin,
  addAdmin,
  getAllUsers,
  getSingleUser,
  deleteUser,
  getAllUsersPending,
  getSingleUserPending,
  deletePendingUser,updateUser,
  setOrUpdateWelcomeMessage,
  updateUserApprovalStatus,
  updateAdmin,
  getUserStats

} = require("../controllers/adminPanelController");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/getAllUsers", getAllUsers);
router.put("/updateUserData/:id", updateUser);

router.get("/total-users", getUserStats);
router.get("/getSingleUser", getSingleUser);
router.delete("/deleteUser", deleteUser);
router.get("/getAllUsersPending", getAllUsersPending);

router.get("/getSingleUserPending", getSingleUserPending);
router.delete("/deletePendingUser", deletePendingUser);

router.post("/welcome-message", setOrUpdateWelcomeMessage); 
router.post("/update-status", updateUserApprovalStatus); 




router.post("/addAdmin", addAdmin);
router.post("/update-Admin", updateAdmin);

module.exports = router;
