const socket = io('http://localhost:3500') 

 

const msginput = document.querySelector('#message') 
const nameinput = document.querySelector('#name') 
const chatRoom = document.querySelector('#room') 
const activity = document.querySelector('.activity') 
const usersList = document.querySelector('.user-list') 
const roomList = document.querySelector('.room-list') 
const chatDisplay = document.querySelector('.chat-display') 

 

function sendMessage(e) {
    e.preventDefault();
    const messageText = msginput.value.trim(); // ลบช่องว่างหน้า-หลัง
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


 

function enterRoom(e) { 

    e.preventDefault() 

    if (nameinput.value && chatRoom.value) { 

        socket.emit('enterRoom', { 

            name: nameinput.value, 

            room: chatRoom.value 

        }) 

    } 
    socket.on('errorMessage', (message) => {
        alert(message);  // หรือคุณอาจจะเพิ่มการแสดงข้อความผิดพลาดใน UI ตามที่ต้องการ
    });
    
} 

document.querySelector("#leaveBtn").addEventListener("click", leaveRoom);

function leaveRoom() {
    const userName = nameinput.value;
    const roomName = chatRoom.value;

    if (!userName || !roomName) return;

    socket.emit("leaveRoom", { name: userName, room: roomName });

    // ✅ แสดงข้อความออกจากห้องใน UI
    const leaveMessage = document.createElement('div');
    leaveMessage.className = 'leave-container';
    
    // ✅ ล้างประวัติการสนทนา
    chatDisplay.innerHTML = "";  
    chatDisplay.appendChild(leaveMessage);

    // ✅ รีเซตรายการผู้ใช้
    usersList.innerHTML = "";  

    // ✅ ล้างค่าห้องและอินพุตข้อความ
    chatRoom.value = "";
    msginput.value = "";

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}



document.querySelector('.form-msg') 
    .addEventListener('submit', sendMessage) 

 

document.querySelector('.form-join') 
    .addEventListener('submit', enterRoom) 

 

    msginput.addEventListener('keypress', () => { 
        socket.emit('activity', nameinput.value); 
    })


socket.on('message', (data) => {
    activity.textContent = '';

    const { name, text, time } = data;
    const el = document.createElement('li');

    // 🛠 กำหนด className ตามผู้ส่ง
    if (name === nameinput.value) {
        el.className = 'post post--left'; // ✅ ข้อความของคุณ → ชิดขวา
    } else if (name !== 'Admin') {
        el.className = 'post post--right'; // ✅ ข้อความจากผู้ใช้คนอื่น → ชิดซ้าย
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

 

 

socket.on('userList', ({ users }) => { 

    showUsers(users) 

}) 

socket.on('roomList', ({ rooms }) => { 

    showRooms(rooms) 

}) 

 

function showUsers(users) {
    usersList.innerHTML = ''; // ล้างค่าก่อน

    if (users.length > 0) {
        const container = document.createElement('div');
        container.className = "user-container";

        // ✅ สร้างกล่องสำหรับ Amount
        const amountLabel = document.createElement('div');
        amountLabel.className = "amount-label";
        amountLabel.textContent = `Amount : ${users.length}`;
        container.appendChild(amountLabel);

        // ✅ สร้างกล่องสำหรับ "Users in Room1"
        const usersRow = document.createElement('div');
        usersRow.className = "users-row"; // ใช้ Flexbox ควบคุม
        container.appendChild(usersRow);

        const label = document.createElement('span');
        label.className = "label";
        label.textContent = `Users in ${chatRoom.value} Room : `;
        usersRow.appendChild(label);

        // ✅ วนลูปสร้าง userSpan เพื่อให้เรียงต่อกัน
        users.forEach((user) => {
            const userSpan = document.createElement('span');
            userSpan.className = "user";
            userSpan.textContent = user.name;
            usersRow.appendChild(userSpan);
        });

        usersList.appendChild(container);
    }
}


 

function showRooms(rooms) {
    roomList.innerHTML = ''; // ล้างค่าก่อน

    if (rooms.length > 0) {
        const container = document.createElement('div');
        container.className = "room-container";

        // ✅ สร้าง Label สำหรับจำนวนห้อง
        const amountLabel = document.createElement('div');
        amountLabel.className = "room-amount-label";
        amountLabel.textContent = `Active Rooms : ${rooms.length}`;
        container.appendChild(amountLabel);

        // ✅ สร้างกล่องเก็บรายชื่อห้อง
        const roomsRow = document.createElement('div');
        roomsRow.className = "rooms-row"; // ใช้ Flexbox ให้เรียงต่อกัน
        container.appendChild(roomsRow);

        // ✅ สร้าง Label "Active Room :"
        const label = document.createElement('span');
        label.className = "room-label";
        label.textContent = "Rooms : ";
        roomsRow.appendChild(label);

        // ✅ วนลูปเพิ่มรายชื่อห้อง
        rooms.forEach((room) => {
            const roomSpan = document.createElement('span');
            roomSpan.className = "room";
            roomSpan.textContent = room;
            roomsRow.appendChild(roomSpan);
        });

        roomList.appendChild(container);
    }
}


 

function buildMsg(name, text, isAdmin = false) { 

    return { 

      name: isAdmin ? undefined : name, // ถ้าเป็นแอดมิน ไม่ต้องใส่ name (หรือจะใส่ "admin" ก็ได้) 

      text, 

      isAdmin, 

      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 

    }; 

  } 

   

  let hasDisplayedWelcomeMessage = false; // ตัวแปรเพื่อป้องกันการแสดงข้อความซ้ำ 

 

  socket.on('welcomeMessage', (data) => { 

    const { text, time } = data; 

    const chatDisplay = document.querySelector('.chat-display'); // ดึง chat-display มาใช้งาน 

   

    // ตรวจสอบว่าเคยแสดงข้อความนี้ไปแล้วหรือยัง 

    if (hasDisplayedWelcomeMessage) return; 

   

    const el = document.createElement('div'); 

    el.className = 'welcome-container'; 

    el.innerHTML = `<span class="welcome-time">${time}</span> 

                    <span class="welcome-msg">${text}</span>`; 

   

    // ตั้งค่าให้ป้องกันไม่ให้แสดงข้อความซ้ำ 

    hasDisplayedWelcomeMessage = true; 

  }); 

   

 

  socket.on('welcomeMessage', (data) => { 

    const { text, time } = data; 

    const chatDisplay = document.querySelector('.chat-display'); // ดึง chat-display มาใช้งาน 

   

    const el = document.createElement('div'); 

    el.className = 'welcome-container'; // ใช้คลาสนี้เพื่อจัดตำแหน่ง 

    el.innerHTML = `<span class="welcome-time">${time}</span> 

                    <span class="welcome-msg">${text}</span>`; 

   

    // หน่วงเวลา 370ms เพื่อให้แสดงข้อความหลังจากข้อความเก่า 

    setTimeout(() => { 

      chatDisplay.appendChild(el); // ใช้ appendChild แทน prepend เพื่อให้ข้อความใหม่ไปอยู่ท้ายสุด 

    }, 370); 

 

    // เลื่อนลงไปที่ข้อความล่าสุด 

    chatDisplay.scrollTop = chatDisplay.scrollHeight; 

}); 

 

socket.on('leaveRoomMessage', (data) => { 

    const { text, time } = data; 

    const chatDisplay = document.querySelector('.chat-display'); // ดึง chat-display มาใช้งาน 

 

    // สร้าง element สำหรับการแสดงข้อความ 

    const el = document.createElement('div'); 

    el.className = 'leave-container';  

    el.innerHTML = `<span class="leave-time">${time}</span> 

                    <span class="leave-msg">${text}</span>`; 

   

    // หน่วงเวลา 370ms เพื่อให้แสดงข้อความหลังจากข้อความเก่า 

    setTimeout(() => { 

      chatDisplay.appendChild(el); // ใช้ appendChild แทน prepend เพื่อให้ข้อความใหม่ไปอยู่ท้ายสุด 

    }, 370); 

 

    // เลื่อนลงไปที่ข้อความล่าสุด 

    chatDisplay.scrollTop = chatDisplay.scrollHeight; 

}); 
