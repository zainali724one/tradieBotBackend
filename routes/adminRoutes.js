const express = require("express");
const {
  adminLogin,
  addAdmin,
  getAllUsers,
  getSingleUser,
  deleteUser,
  getAllUsersPending,
  getSingleUserPending,
  deletePendingUser,
} = require("../controllers/adminPanelController");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/getAllUsers", getAllUsers);
router.get("/getSingleUser", getSingleUser);
router.delete("/deleteUser", deleteUser);
router.get("/getAllUsersPending", getAllUsersPending);

router.get("/getSingleUserPending", getSingleUserPending);
router.delete("/deletePendingUser", deletePendingUser);



router.post("/addAdmin", addAdmin);

module.exports = router;
