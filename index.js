import express from 'express' 

import { Server } from 'socket.io' 

import path from 'path' 

import { fileURLToPath } from 'url' 

 

const __filename = fileURLToPath(import.meta.url) 

const __dirname = path.dirname(__filename) 

 

const PORT = process.env.PORT || 3500 

const ADMIN = "" 

 

const app = express() 

 

app.use(express.static(path.join(__dirname, "public"))) 

 

const expressServer = app.listen(PORT, () => { 

    console.log(`listening on port ${PORT}`) 

}) 

 

const UsersState = { 

    users: [], 

    setUsers: function(newUsersArray) { 

        this.users = newUsersArray 

    } 

} 

 

const io = new Server(expressServer, { 

    cors: { 

        origin: ["http://localhost:3000", "http://localhost:5500", "http://127.0.0.1:5500"] 

    } 

}) 

 

io.on('connection', (socket) => { 

    console.log(`user ${socket.id} connected`);

 

    // ส่งข้อความต้อนรับเมื่อผู้ใช้เชื่อมต่อเข้ามาครั้งแรก 

    socket.emit('welcomeMessage', buildMsg(ADMIN, "Welcome to RealTimeChat!", true)); 

 

    socket.on('enterRoom', ({ name, room }) => {
        if (!name.trim() || !room.trim()) {
            socket.emit('errorMessage', "Name and room cannot be empty.");
            return;
        }
    
        // ตรวจสอบชื่อผู้ใช้ซ้ำในห้องเดียวกัน
        const existingUser = UsersState.users.find(user => user.name === name && user.room === room);
        if (existingUser) {
            socket.emit('errorMessage', "This name is already taken in this room.");
            return;
        }
    
        // หากผู้ใช้ไม่ซ้ำ, ดำเนินการเข้าห้อง
        const prevRoom = getUser(socket.id)?.room;
        if (prevRoom) {
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`));
        }
    
        const user = activateUser(socket.id, name, room);
        socket.join(user.room);
    
        socket.emit('welcomeMessage', buildMsg(ADMIN, `You have joined the ${user.room} room`));
        socket.broadcast.to(user.room).emit('welcomeMessage', buildMsg(ADMIN, `${user.name} has joined the room`));
    
        io.to(user.room).emit('userList', { users: getUserInRoom(user.room) });
        io.emit('roomList', { rooms: getAllActiveRoom() });

        console.log(`✅ user ${name} joined room : ${room}`);
    });   

    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        userLeaveApp(socket.id);  // ลบผู้ใช้จากสถานะ
    
        if (user) {
            const disconnectMessage = buildMsg(ADMIN, `${user.name} has left the room`);
            socket.emit('leaveRoomMessage', disconnectMessage);
            socket.broadcast.to(user.room).emit('leaveRoomMessage', disconnectMessage);
            io.to(user.room).emit('userList', { users: getUserInRoom(user.room) });
            io.emit('roomList', { rooms: getAllActiveRoom() });
        }
    
        console.log(`User ${socket.id} disconnected`);
    });

    socket.on("leaveRoom", ({ name, room }) => {
        const user = getUser(socket.id);  // หาผู้ใช้จาก socket.id
        
        if (user) {
            socket.leave(room); // ออกจากห้อง แต่ไม่ตัดการเชื่อมต่อ
            userLeaveApp(socket.id); // ลบข้อมูลผู้ใช้จากเซิร์ฟเวอร์
        
            // 1. สำหรับผู้ที่ออกจากห้อง (แสดงข้อความ "You have left the room" บนหน้าจอของตัวเอง)
            socket.emit('leaveRoomMessage', buildMsg("You", "You have left the room"));
        
            // 2. สำหรับผู้ใช้อื่นๆ ในห้อง (แสดงข้อความ "User has left the chat room" สำหรับผู้ใช้อื่น)
            socket.broadcast.to(room).emit('leaveRoomMessage', buildMsg("user", `${user.name} has left the chat room`));
        
            // อัปเดตรายชื่อผู้ใช้ในห้อง
            io.to(room).emit("userList", { users: getUserInRoom(room) });
        
            // อัปเดตรายชื่อห้อง
            io.emit("roomList", { rooms: getAllActiveRoom() });
        
            console.log(`❌ ${name} left room : ${room}`);
        }
    });
    
    socket.on('message', ({ name, text, room }) => {
        if (!room) return;
        const msg = buildMsg(name, text);
        
        io.to(room).emit('message', msg); // ✅ ส่งข้อความไปยังห้องที่ถูกต้อง
    
        // ✅ แสดงข้อความใน Terminal
        console.log(`💬 [Room ${room}] ${name}: ${text}`);
    });
    

}); 


 

function buildMsg(name, text) { 

    if (name === "admin") { 

        return { 

            name: "admin", // ✅ เพิ่มให้แน่ใจว่ามี name เสมอ 

            text,  

            time: new Intl.DateTimeFormat('default', { 

                hour: 'numeric', 

                minute: 'numeric', 

            }).format(new Date()) 

        }; 

    } 

    return { 

        name, 

        text, 

        time: new Intl.DateTimeFormat('default', { 

            hour: 'numeric', 

            minute: 'numeric', 

        }).format(new Date()) 

    }; 

} 

function activateUser(id, name, room) { 

    const user = { id, name, room } 

    UsersState.setUsers([ 

        ...UsersState.users.filter(user => user.id !== id), // ✅ ใช้ UsersState.users 

        user 

    ]) 

    return user 

} 

 

function userLeaveApp(id) { 

    UsersState.setUsers( 

        UsersState.users.filter(user => user.id !== id) // ✅ แก้ชื่อ UsersState 

    ) 

} 

 

function getUser(id) { 

    return UsersState.users.find(user => user.id === id) 

} 

 

function getUserInRoom(room) { 

    return UsersState.users.filter(user => user.room === room) 

} 

 

function getAllActiveRoom() { 

    return Array.from(new Set(UsersState.users.map(user => user.room))) // ✅ แก้ .filter.map → .map 

} 

 