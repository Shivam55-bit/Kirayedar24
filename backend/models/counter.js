// models/Counter.js

import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Document ID (e.g., 'userSerialId')
    seq: { type: Number, default: 0 }, // The sequential number
});

export default mongoose.model("Counter", CounterSchema);