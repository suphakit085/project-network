
let selectedFile = null;
const socket = io(window.location.origin);

const msginput = document.querySelector('#message');
const nameinput = document.querySelector('#name');
const chatRoom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');



attachBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
        selectedFile = fileInput.files[0];
        
        // ตรวจสอบขนาดไฟล์ (จำกัดที่ 2MB)
        if (selectedFile.size > 2 * 1024 * 1024) {
            // แสดง toast error
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            toast.textContent = "File size must be less than 2MB";
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 500);
            }, 3000);
            
            // รีเซ็ตไฟล์
            selectedFile = null;
            fileInput.value = '';
            return;
        }
        
        // แสดงชื่อไฟล์
        fileName.textContent = selectedFile.name;
        filePreview.classList.remove('hidden');
    }
});
removeFile.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.add('hidden');
});


function sendMessage(e) {
    e.preventDefault();
    const messageText = msginput.value.trim();
    const userName = nameinput.value.trim();
    const roomName = chatRoom.value.trim();

    // ตรวจสอบว่ามีข้อความหรือไฟล์ รวมถึงชื่อผู้ใช้และห้อง
    if ((!messageText && !selectedFile) || !userName || !roomName) {
        // แสดง toast แจ้งเตือน
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = "Please enter a message or attach a file";
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
        return;
    }

    if (selectedFile) {
        // อ่านไฟล์เป็น base64
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = e.target.result;
            
            // ส่งข้อมูลไฟล์ไปยังเซิร์ฟเวอร์
            socket.emit('fileMessage', {
                name: userName,
                text: messageText, // ข้อความที่แนบมากับไฟล์ (ถ้ามี)
                room: roomName,
                file: {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    data: fileData
                }
            });
            
            // รีเซ็ตฟอร์ม
            msginput.value = '';
            selectedFile = null;
            fileInput.value = '';
            filePreview.classList.add('hidden');
            msginput.focus();
        };
        reader.readAsDataURL(selectedFile);
    } else {
        // ส่งข้อความธรรมดา
        socket.emit('message', {
            name: userName,
            text: messageText,
            room: roomName
        });
        
        msginput.value = '';
        msginput.focus();
    }
}
function enterRoom(e) {
    e.preventDefault();
    
    const userName = nameinput.value;
    const roomName = chatRoom.value;
    
    if (userName && roomName) {
        // เคลียร์หน้าจอแสดงข้อความก่อนเข้าห้องใหม่
        chatDisplay.innerHTML = "";
        
        socket.emit('enterRoom', {
            name: userName,
            room: roomName
        });
    }
}

// เพิ่ม event listener สำหรับการรับประวัติการสนทนา
socket.on('chatHistory', ({ messages, room }) => {
    console.log(`Received chat history: ${messages.length} messages for room: ${room}`);
    
    // ตรวจสอบว่าห้องที่รับมาตรงกับห้องปัจจุบันหรือไม่
    const currentRoom = chatRoom.value;
    if (room && room !== currentRoom) {
        console.log(`Ignoring messages for room ${room} because we're in room ${currentRoom}`);
        return; // ถ้าไม่ตรงกัน ไม่แสดงข้อความ
    }
    
    // เคลียร์หน้าจอก่อนแสดงประวัติ
    chatDisplay.innerHTML = '';
    
    // แสดงข้อความประวัติทั้งหมด
    messages.forEach(data => {
        if (data.file) {
            // ถ้าเป็นข้อความที่มีไฟล์
            const { name, text, time, file } = data;
            
            // สร้าง element สำหรับข้อความ
            const el = document.createElement('div');
            
            // เตรียมเนื้อหา HTML สำหรับการแสดงไฟล์
            let fileContent = '';
            
            // ตรวจสอบประเภทไฟล์
            if (file.type.startsWith('image/')) {
                // ถ้าเป็นรูปภาพ
                fileContent = `<img src="${file.data}" alt="${file.name}" class="max-w-full rounded-lg mb-2 max-h-60">`;
            } else {
                // ถ้าเป็นไฟล์อื่นๆ
                fileContent = `
                    <div class="bg-gray-600 rounded-lg p-3 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <a href="${file.data}" download="${file.name}" class="text-indigo-300 hover:text-indigo-200 truncate max-w-[200px]">
                            ${file.name}
                        </a>
                    </div>
                `;
            }
            
            // สร้าง HTML ตามผู้ส่ง
            if (name === nameinput.value) {
                // ข้อความของตัวเอง
                el.className = 'flex justify-end mb-2';
                el.innerHTML = `
                    <div class="max-w-xs lg:max-w-md">
                        ${fileContent}
                        ${text ? `<div class="bg-indigo-600 text-white px-4 py-2 rounded-t-lg rounded-bl-lg">
                            ${text}
                        </div>` : ''}
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
                        ${fileContent}
                        ${text ? `<div class="bg-gray-700 text-white px-4 py-2 rounded-t-lg rounded-br-lg">
                            ${text}
                        </div>` : ''}
                        <div class="text-gray-400 text-xs mt-1">
                            ${time}
                        </div>
                    </div>
                `;
            }
            
            chatDisplay.appendChild(el);
        } else {
            // ถ้าเป็นข้อความธรรมดา
            const { name, text, time } = data;
            
            // สร้าง element สำหรับข้อความ
            const el = document.createElement('div');
            
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
        }
    });
    
    // เลื่อนไปที่ข้อความล่าสุด
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    
    // แสดงข้อความว่าโหลดประวัติเรียบร้อย
    if (messages.length > 0) {
        const historyNotice = document.createElement('div');
        historyNotice.className = 'flex justify-center my-4';
        historyNotice.innerHTML = `
            <div class="bg-gray-800 text-gray-400 px-4 py-1 rounded-full text-xs">
                แสดงประวัติการสนทนา (${messages.length} ข้อความ)
            </div>
        `;
        chatDisplay.appendChild(historyNotice);
    }
});

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
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.add('hidden');
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
// เพิ่ม socket event listener สำหรับการรับข้อความไฟล์
socket.on('fileMessage', (data) => {
    activity.textContent = '';
    
    const { name, text, time, file } = data;
    
    // สร้าง element สำหรับข้อความ
    const el = document.createElement('div');
    
    // เตรียมเนื้อหา HTML สำหรับการแสดงไฟล์
    let fileContent = '';
    
    // ตรวจสอบประเภทไฟล์
    if (file.type.startsWith('image/')) {
        // ถ้าเป็นรูปภาพ
        fileContent = `<img src="${file.data}" alt="${file.name}" class="max-w-full rounded-lg mb-2 max-h-60">`;
    } else {
        // ถ้าเป็นไฟล์อื่นๆ
        fileContent = `
            <div class="bg-gray-600 rounded-lg p-3 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <a href="${file.data}" download="${file.name}" class="text-indigo-300 hover:text-indigo-200 truncate max-w-[200px]">
                    ${file.name}
                </a>
            </div>
        `;
    }
    
    // สร้าง HTML ตามผู้ส่ง
    if (name === nameinput.value) {
        // ข้อความของตัวเอง
        el.className = 'flex justify-end mb-2';
        el.innerHTML = `
            <div class="max-w-xs lg:max-w-md">
                ${fileContent}
                ${text ? `<div class="bg-indigo-600 text-white px-4 py-2 rounded-t-lg rounded-bl-lg">
                    ${text}
                </div>` : ''}
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
                ${fileContent}
                ${text ? `<div class="bg-gray-700 text-white px-4 py-2 rounded-t-lg rounded-br-lg">
                    ${text}
                </div>` : ''}
                <div class="text-gray-400 text-xs mt-1">
                    ${time}
                </div>
            </div>
        `;
    }
    
    chatDisplay.appendChild(el);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});
socket.on('chatHistory', ({ messages }) => {
    console.log('Received chat history:', messages.length, 'messages');
    
    // เคลียร์หน้าจอก่อนแสดงประวัติ
    chatDisplay.innerHTML = '';
    
    // วนลูปแสดงข้อความทั้งหมด
    messages.forEach(data => {
        if (data.file) {
            // ถ้าข้อความมีไฟล์แนบ
            const { name, text, time, file } = data;
            
            // สร้าง element สำหรับข้อความ
            const el = document.createElement('div');
            
            // เตรียมเนื้อหา HTML สำหรับการแสดงไฟล์
            let fileContent = '';
            
            // ตรวจสอบประเภทไฟล์
            if (file.type.startsWith('image/')) {
                // ถ้าเป็นรูปภาพ
                fileContent = `<img src="${file.data}" alt="${file.name}" class="max-w-full rounded-lg mb-2 max-h-60">`;
            } else {
                // ถ้าเป็นไฟล์อื่นๆ
                fileContent = `
                    <div class="bg-gray-600 rounded-lg p-3 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <a href="${file.data}" download="${file.name}" class="text-indigo-300 hover:text-indigo-200 truncate max-w-[200px]">
                            ${file.name}
                        </a>
                    </div>
                `;
            }
            
            // สร้าง HTML ตามผู้ส่ง
            if (name === nameinput.value) {
                // ข้อความของตัวเอง
                el.className = 'flex justify-end mb-2';
                el.innerHTML = `
                    <div class="max-w-xs lg:max-w-md">
                        ${fileContent}
                        ${text ? `<div class="bg-indigo-600 text-white px-4 py-2 rounded-t-lg rounded-bl-lg">
                            ${text}
                        </div>` : ''}
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
                        ${fileContent}
                        ${text ? `<div class="bg-gray-700 text-white px-4 py-2 rounded-t-lg rounded-br-lg">
                            ${text}
                        </div>` : ''}
                        <div class="text-gray-400 text-xs mt-1">
                            ${time}
                        </div>
                    </div>
                `;
            }
            
            chatDisplay.appendChild(el);
        } else {
            // ถ้าเป็นข้อความธรรมดา
            const { name, text, time } = data;
            
            // สร้าง element สำหรับข้อความ
            const el = document.createElement('div');
            
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
        }
    });
    
    // เลื่อนไปที่ข้อความล่าสุด
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    
    // แสดงข้อความว่าโหลดประวัติเรียบร้อย
    const historyNotice = document.createElement('div');
    historyNotice.className = 'flex justify-center my-4';
    historyNotice.innerHTML = `
        <div class="bg-gray-800 text-gray-400 px-4 py-1 rounded-full text-xs">
            Showing message history (${messages.length} messages)
        </div>
    `;
    chatDisplay.appendChild(historyNotice);
});

// เมื่อออกจากห้อง ให้รีเซ็ตข้อมูลไฟล์ด้วย
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
    
    // รีเซ็ตข้อมูลไฟล์
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.add('hidden');
}

// ส่วนของโค้ดเดิมต่อ
document.querySelector('.form-msg').addEventListener('submit', sendMessage);
document.querySelector('.form-join').addEventListener('submit', enterRoom);
document.querySelector("#leaveBtn").addEventListener("click", leaveRoom);

msginput.addEventListener('keypress', () => {
    socket.emit('activity', nameinput.value);
});