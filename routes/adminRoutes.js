const express = require("express");
const {
  adminLogin,
  addAdmin,
  getAllUsers,
  getSingleUser,
  deleteUser,
} = require("../controllers/adminPanelController");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/getAllUsers", getAllUsers);
router.get("/getSingleUser", getSingleUser);
router.delete("/deleteUser", deleteUser);

router.post("/addAdmin", addAdmin);

module.exports = router;
