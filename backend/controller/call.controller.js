import Call from "../models/call.model.js";
import Conversation from "../models/conversation.model.js";

export const getCallLog = async (req, res) => {
    try {
    const newCall = new Call(req.body);
    await newCall.save();
    res.status(201).json(newCall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCallHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId)
      .populate("callHistory")
      .exec();

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.status(200).json(conversation.callHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



