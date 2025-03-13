// 1. ติดตั้ง package เพิ่มเติม
// npm install mongoose dotenv

// 2. สร้างไฟล์ .env ในโฟลเดอร์หลักของโปรเจค
// MONGODB_URI=mongodb://localhost:27017/realtime-chat
// หรือใช้ MongoDB Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/realtime-chat

// 3. สร้างไฟล์ models/Message.js
// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    text: String,
    file: {
        name: String,
        type: String,
        data: String
    },
    time: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // ลบข้อความเก่ากว่า 7 วัน (60 * 60 * 24 * 7 วินาที)
    }
});

export default mongoose.model('Message', messageSchema);