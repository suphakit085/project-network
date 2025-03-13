
const socket = io(window.location.origin);

const msginput = document.querySelector('#message');
const nameinput = document.querySelector('#name');
const chatRoom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');

function sendMessage(e) {
    e.preventDefault();
    const messageText = msginput.value.trim();
    const userName = nameinput.value.trim();
    const roomName = chatRoom.value.trim();

    if (!userName || !messageText || !roomName) {
        // เปลี่ยนจาก alert ธรรมดา เป็นการแสดง toast notification แบบเดียวกับที่ใช้ใน errorMessage
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = "Text can't be Empty";
        document.body.appendChild(toast);
        
        // ให้ toast หายไปหลังจาก 3 วินาที
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
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
    e.preventDefault();
    if (nameinput.value && chatRoom.value) {
        socket.emit('enterRoom', {
            name: nameinput.value,
            room: chatRoom.value
        });
    }
}

// เพิ่ม event listener สำหรับการรับข้อความข้อผิดพลาด
socket.on('errorMessage', (message) => {
    // สร้าง toast แจ้งเตือนแบบสวยงาม
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // ให้ toast หายไปหลังจาก 3 วินาที
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
});

function leaveRoom() {
    const userName = nameinput.value;
    const roomName = chatRoom.value;

    if (!userName || !roomName) return;

    socket.emit("leaveRoom", { name: userName, room: roomName });

    // ล้างประวัติการสนทนา
    chatDisplay.innerHTML = "";

    // รีเซตรายการผู้ใช้
    usersList.innerHTML = "";

    // ล้างค่าห้องและอินพุตข้อความ
    chatRoom.value = "";
    msginput.value = "";
}

document.querySelector('.form-msg').addEventListener('submit', sendMessage);
document.querySelector('.form-join').addEventListener('submit', enterRoom);
document.querySelector("#leaveBtn").addEventListener("click", leaveRoom);

msginput.addEventListener('keypress', () => {
    socket.emit('activity', nameinput.value);
});

socket.on('message', (data) => {
    activity.textContent = '';

    const { name, text, time } = data;
    
    // สร้าง element สำหรับข้อความ
    const el = document.createElement('div');
    
    // ตรวจสอบว่าเป็นข้อความของตัวเองหรือไม่
    if (name === 'Admin') {
        // ข้อความของ Admin
        el.className = 'flex justify-center';
        el.innerHTML = `
            <div class="bg-gray-700 text-gray-200 px-4 py-2 rounded-full text-sm">
                ${text}
            </div>
        `;
    } else if (name === nameinput.value) {
        // ข้อความของตัวเอง
        el.className = 'flex justify-end mb-2';
        el.innerHTML = `
            <div class="max-w-xs lg:max-w-md">
                <div class="bg-indigo-600 text-white px-4 py-2 rounded-t-lg rounded-bl-lg">
                    ${text}
                </div>
                <div class="text-gray-400 text-xs mt-1 text-right">
                    ${time}
                </div>
            </div>
        `;
    } else {
        // ข้อความจากคนอื่น
        el.className = 'flex justify-start mb-2';
        el.innerHTML = `
            <div class="max-w-xs lg:max-w-md">
                <div class="flex items-center">
                    <span class="text-gray-300 text-sm font-medium mr-2">${name}</span>
                </div>
                <div class="bg-gray-700 text-white px-4 py-2 rounded-t-lg rounded-br-lg">
                    ${text}
                </div>
                <div class="text-gray-400 text-xs mt-1">
                    ${time}
                </div>
            </div>
        `;
    }

    chatDisplay.appendChild(el);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

socket.on('userList', ({ users }) => {
    showUsers(users);
});

socket.on('roomList', ({ rooms }) => {
    showRooms(rooms);
});

function showUsers(users) {
    usersList.innerHTML = '';

    if (users.length > 0) {
        // สร้างหัวข้อรายการ
        const header = document.createElement('div');
        header.className = 'text-indigo-300 font-bold mb-2';
        
        // เปลี่ยนจาก "Users in 1" เป็น "Users in room [ชื่อห้อง]"
        header.innerHTML = `Users in room ${chatRoom.value} <span class="bg-indigo-600 text-white rounded-full px-2 py-0.5 text-xs ml-1">${users.length}</span>`;
        
        usersList.appendChild(header);

        // สร้างรายการผู้ใช้
        users.forEach((user) => {
            const userDiv = document.createElement('div');
            userDiv.className = 'flex items-center mb-2 bg-gray-700 rounded-lg px-3 py-2';
            userDiv.innerHTML = `
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span class="truncate">${user.name}</span>
            `;
            usersList.appendChild(userDiv);
        });
    } else {
        usersList.innerHTML = '<div class="text-gray-500 text-center">No users in this room</div>';
    }
}

function showRooms(rooms) {
    roomList.innerHTML = '';

    if (rooms.length > 0) {
        // สร้างหัวข้อรายการ
        const header = document.createElement('div');
        header.className = 'text-indigo-300 font-bold mb-2';
        header.innerHTML = `Active Rooms <span class="bg-indigo-600 text-white rounded-full px-2 py-0.5 text-xs ml-1">${rooms.length}</span>`;
        roomList.appendChild(header);

        // สร้างรายการห้อง
        const roomsContainer = document.createElement('div');
        roomsContainer.className = 'flex flex-wrap gap-2';
        
        rooms.forEach((room) => {
            const roomDiv = document.createElement('div');
            roomDiv.className = 'bg-gray-700 text-sm rounded-lg px-3 py-1';
            roomDiv.textContent = room;
            roomsContainer.appendChild(roomDiv);
        });
        
        roomList.appendChild(roomsContainer);
    } else {
        roomList.innerHTML = '<div class="text-gray-500 text-center">No active rooms</div>';
    }
}

// Handler สำหรับ welcomeMessage
socket.on('welcomeMessage', (data) => {
    const { text, time } = data;
    
    const el = document.createElement('div');
    el.className = 'flex justify-center my-2';
    el.innerHTML = `
        <div class="bg-indigo-900/50 text-indigo-200 px-4 py-2 rounded-full text-sm">
            ${text}
        </div>
    `;
    
    setTimeout(() => {
        chatDisplay.appendChild(el);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }, 300);
});

// Handler สำหรับ leaveRoomMessage
socket.on('leaveRoomMessage', (data) => {
    const { text, time } = data;
    
    const el = document.createElement('div');
    el.className = 'flex justify-center my-2';
    el.innerHTML = `
        <div class="bg-red-900/50 text-red-200 px-4 py-2 rounded-full text-sm">
            ${text}
        </div>
    `;
    
    setTimeout(() => {
        chatDisplay.appendChild(el);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }, 300);
});