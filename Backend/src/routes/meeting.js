const express = require("express");
const router = express.Router();
const { Meeting } = require("../models/meeting.js");
const { verifyToken } = require("../middleware.js");
router.post("/", verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    console.log(code);
    if (!code) {
      return res.status(400).json({ error: "please generate the code" });
    }
    
    await Meeting.create({ user_id: req.user.id, meetingCode: code });
    res.status(201).json({
      success: "Meeting has been added to the database!",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/", verifyToken, async (req, res) => {
    try{
        let meetings = await Meeting.find({user_id:req.user.id});
        res.status(200).json({data:meetings});
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});
module.exports = { router };