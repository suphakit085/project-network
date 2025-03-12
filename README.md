# บทนำเสนอ: การทำงานฝั่ง Client ของแอปพลิเคชันแชท

## บทนำ

สวัสดีครับ/ค่ะ วันนี้ผม/ดิฉันจะนำเสนอเกี่ยวกับการทำงานฝั่ง Client ของแอปพลิเคชันแชทที่พัฒนาขึ้น โดยใช้เทคโนโลยี WebSocket ผ่านไลบรารี Socket.IO เพื่อสร้างการสื่อสารแบบ Real-time

## โครงสร้างพื้นฐาน

แอปพลิเคชันของเราประกอบด้วยส่วนสำคัญดังนี้:

1. **การเชื่อมต่อ Socket.IO**: เชื่อมต่อกับเซิร์ฟเวอร์ผ่าน WebSocket
2. **ส่วนจัดการการแสดงผล**: แสดงข้อความแชท, รายชื่อผู้ใช้ และห้องแชทที่ใช้งานอยู่
3. **ส่วนรับข้อมูลจากผู้ใช้**: ฟอร์มสำหรับส่งข้อความและเข้าร่วมห้องแชท

## 1. การเชื่อมต่อ Socket.IO

```javascript
const socket = io('http://localhost:3500')
```

- เราเชื่อมต่อกับเซิร์ฟเวอร์ที่รันอยู่บน port 3500
- การเชื่อมต่อนี้เป็นแบบ Real-time ทำให้ข้อความส่งถึงผู้รับทันที
- ไม่จำเป็นต้องรีเฟรชหน้าเว็บเพื่อรับข้อความใหม่

## 2. องค์ประกอบหลักของ UI

```javascript
const msginput = document.querySelector('#message') 
const nameinput = document.querySelector('#name') 
const chatRoom = document.querySelector('#room') 
const activity = document.querySelector('.activity') 
const usersList = document.querySelector('.user-list') 
const roomList = document.querySelector('.room-list') 
const chatDisplay = document.querySelector('.chat-display')
```

- เราดึงองค์ประกอบต่างๆ จาก DOM เพื่อใช้ในการแสดงผลและรับข้อมูล
- แต่ละองค์ประกอบมีหน้าที่เฉพาะในการทำงานของแอปพลิเคชัน

## 3. การส่งข้อความ

```javascript
function sendMessage(e) {
    e.preventDefault();
    const messageText = msginput.value.trim();
    const userName = nameinput.value.trim();
    const roomName = chatRoom.value.trim();

    if (!userName || !messageText || !roomName) {
        alert("Text can't be Empty");
        return;
    }

    socket.emit('message', {
        name: userName,
        text: messageText,
        room: roomName
    });

    msginput.value = '';
    msginput.focus();
}
```

- ฟังก์ชัน `sendMessage` จะทำงานเมื่อผู้ใช้กดส่งแบบฟอร์ม
- มีการตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
- ส่งข้อมูลไปยังเซิร์ฟเวอร์ด้วย `socket.emit()`
- ล้างช่องข้อความและเน้นที่ช่องข้อความเพื่อความสะดวกในการพิมพ์ข้อความต่อไป

## 4. การเข้าร่วมห้องแชท

```javascript
function enterRoom(e) { 
    e.preventDefault() 
    if (nameinput.value && chatRoom.value) { 
        socket.emit('enterRoom', { 
            name: nameinput.value, 
            room: chatRoom.value 
        }) 
    } 
    socket.on('errorMessage', (message) => {
        alert(message);
    });
}
```

- ผู้ใช้ต้องระบุชื่อและห้องแชทก่อนเข้าร่วม
- ข้อมูลจะถูกส่งไปยังเซิร์ฟเวอร์ด้วย `socket.emit('enterRoom')`
- มีการรับข้อความแจ้งเตือนหากเกิดข้อผิดพลาด

## 5. การออกจากห้องแชท

```javascript
function leaveRoom() {
    const userName = nameinput.value;
    const roomName = chatRoom.value;

    if (!userName || !roomName) return;

    socket.emit("leaveRoom", { name: userName, room: roomName });

    // แสดงข้อความออกจากห้องใน UI
    const leaveMessage = document.createElement('div');
    leaveMessage.className = 'leave-container';
    
    // ล้างประวัติการสนทนา
    chatDisplay.innerHTML = "";  
    chatDisplay.appendChild(leaveMessage);

    // รีเซตรายการผู้ใช้
    usersList.innerHTML = "";  

    // ล้างค่าห้องและอินพุตข้อความ
    chatRoom.value = "";
    msginput.value = "";

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}
```

- ผู้ใช้สามารถออกจากห้องแชทได้ด้วยปุ่ม "Leave Room"
- มีการล้างประวัติการสนทนาและรายชื่อผู้ใช้ในห้อง
- แอปจะรีเซตค่าต่างๆ เพื่อให้พร้อมเข้าห้องใหม่

## 6. การแสดงข้อความแชท

```javascript
socket.on('message', (data) => {
    activity.textContent = '';

    const { name, text, time } = data;
    const el = document.createElement('li');

    // กำหนด className ตามผู้ส่ง
    if (name === nameinput.value) {
        el.className = 'post post--left'; // ข้อความของคุณ → ชิดขวา
    } else if (name !== 'Admin') {
        el.className = 'post post--right'; // ข้อความจากผู้ใช้คนอื่น → ชิดซ้าย
    }

    if (name !== 'Admin') {
        el.innerHTML = `
            <div class="post__header ${name === nameinput.value ? 'post__header--user' : 'post__header--reply'}">
                <span class="post__header--name">${name}</span>
                <span class="post__header--time">${time}</span>
            </div>
            <div class="post__text">${text}</div>
        `;
    } else {
        el.innerHTML = `<div class="post__text">${text}</div>`;
    }

    chatDisplay.appendChild(el);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
})
```

- เมื่อได้รับข้อความใหม่จากเซิร์ฟเวอร์ จะสร้าง Element ใหม่เพื่อแสดงข้อความ
- มีการแยกรูปแบบตามประเภทผู้ส่ง: ข้อความของตัวเอง, ข้อความจากผู้อื่น, และข้อความจาก Admin
- แต่ละข้อความจะแสดงชื่อผู้ส่ง, เวลา, และเนื้อหาข้อความ
- มีการเลื่อนหน้าจอไปที่ข้อความล่าสุดโดยอัตโนมัติ

## 7. การแสดงรายชื่อผู้ใช้ในห้อง

```javascript
function showUsers(users) {
    usersList.innerHTML = ''; // ล้างค่าก่อน

    if (users.length > 0) {
        const container = document.createElement('div');
        container.className = "user-container";

        // สร้างกล่องสำหรับ Amount
        const amountLabel = document.createElement('div');
        amountLabel.className = "amount-label";
        amountLabel.textContent = `Amount : ${users.length}`;
        container.appendChild(amountLabel);

        // สร้างกล่องสำหรับ "Users in Room1"
        const usersRow = document.createElement('div');
        usersRow.className = "users-row"; // ใช้ Flexbox ควบคุม
        container.appendChild(usersRow);

        const label = document.createElement('span');
        label.className = "label";
        label.textContent = `Users in ${chatRoom.value} Room : `;
        usersRow.appendChild(label);

        // วนลูปสร้าง userSpan เพื่อให้เรียงต่อกัน
        users.forEach((user) => {
            const userSpan = document.createElement('span');
            userSpan.className = "user";
            userSpan.textContent = user.name;
            usersRow.appendChild(userSpan);
        });

        usersList.appendChild(container);
    }
}
```

- เมื่อมีการอัปเดตรายชื่อผู้ใช้จากเซิร์ฟเวอร์ ฟังก์ชันนี้จะแสดงข้อมูลใหม่
- แสดงจำนวนผู้ใช้ทั้งหมดในห้อง
- แสดงรายชื่อผู้ใช้ทั้งหมดเรียงต่อกัน
- ใช้ Flexbox ในการจัดวางองค์ประกอบให้ดูเป็นระเบียบ

## 8. การแสดงรายชื่อห้องแชทที่ใช้งานอยู่

```javascript
function showRooms(rooms) {
    roomList.innerHTML = ''; // ล้างค่าก่อน

    if (rooms.length > 0) {
        const container = document.createElement('div');
        container.className = "room-container";

        // สร้าง Label สำหรับจำนวนห้อง
        const amountLabel = document.createElement('div');
        amountLabel.className = "room-amount-label";
        amountLabel.textContent = `Active Rooms : ${rooms.length}`;
        container.appendChild(amountLabel);

        // สร้างกล่องเก็บรายชื่อห้อง
        const roomsRow = document.createElement('div');
        roomsRow.className = "rooms-row"; // ใช้ Flexbox ให้เรียงต่อกัน
        container.appendChild(roomsRow);

        // สร้าง Label "Active Room :"
        const label = document.createElement('span');
        label.className = "room-label";
        label.textContent = "Rooms : ";
        roomsRow.appendChild(label);

        // วนลูปเพิ่มรายชื่อห้อง
        rooms.forEach((room) => {
            const roomSpan = document.createElement('span');
            roomSpan.className = "room";
            roomSpan.textContent = room;
            roomsRow.appendChild(roomSpan);
        });

        roomList.appendChild(container);
    }
}
```

- คล้ายกับการแสดงรายชื่อผู้ใช้ แต่เป็นการแสดงรายชื่อห้องแชทที่ใช้งานอยู่
- แสดงจำนวนห้องทั้งหมดที่มีคนใช้งานอยู่
- แสดงรายชื่อห้องทั้งหมดเรียงต่อกัน

## 9. ข้อความแจ้งเตือนพิเศษ

แอปมีการแสดงข้อความพิเศษในกรณีต่างๆ:

### ข้อความต้อนรับ

```javascript
socket.on('welcomeMessage', (data) => { 
    const { text, time } = data; 
    const chatDisplay = document.querySelector('.chat-display');
   
    const el = document.createElement('div'); 
    el.className = 'welcome-container';
    el.innerHTML = `<span class="welcome-time">${time}</span> 
                    <span class="welcome-msg">${text}</span>`;
   
    setTimeout(() => { 
      chatDisplay.appendChild(el);
    }, 370); 
 
    chatDisplay.scrollTop = chatDisplay.scrollHeight; 
});
```

### ข้อความออกจากห้อง

```javascript
socket.on('leaveRoomMessage', (data) => { 
    const { text, time } = data; 
    const chatDisplay = document.querySelector('.chat-display');
 
    const el = document.createElement('div'); 
    el.className = 'leave-container';  
    el.innerHTML = `<span class="leave-time">${time}</span> 
                    <span class="leave-msg">${text}</span>`;
   
    setTimeout(() => { 
      chatDisplay.appendChild(el);
    }, 370); 
 
    chatDisplay.scrollTop = chatDisplay.scrollHeight; 
});
```

- ข้อความพิเศษเหล่านี้มีรูปแบบที่แตกต่างจากข้อความแชทปกติ
- ใช้การหน่วงเวลาเล็กน้อยเพื่อให้การแสดงผลมีความต่อเนื่อง

## สรุป

จุดเด่นของแอปพลิเคชันแชทฝั่ง Client:

1. **การสื่อสารแบบ Real-time**: ใช้ Socket.IO เพื่อสื่อสารกับเซิร์ฟเวอร์แบบทันที
2. **UI ที่เป็นมิตรกับผู้ใช้**: แยกแสดงข้อความของตนเองและผู้อื่นอย่างชัดเจน
3. **การแสดงข้อมูลเพิ่มเติม**: แสดงรายชื่อผู้ใช้และห้องแชทที่ใช้งานอยู่
4. **การจัดการข้อความพิเศษ**: มีรูปแบบเฉพาะสำหรับข้อความระบบและการแจ้งเตือน

ด้วยการออกแบบนี้ ผู้ใช้สามารถสื่อสารกับผู้อื่นได้อย่างสะดวกและมีประสิทธิภาพผ่านเว็บแอปพลิเคชัน

## คำถามและข้อเสนอแนะ

ขอบคุณสำหรับความสนใจ มีคำถามหรือข้อเสนอแนะเพิ่มเติมไหมครับ/คะ?
