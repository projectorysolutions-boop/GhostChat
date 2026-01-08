const socket = io();
let myRoom = "";

// ... Keep toggleTheme, createRoom, joinRoom, etc. as they are ...

function showPreview() {
    const file = document.getElementById('fileInput').files[0];
    if(file) {
        document.getElementById('preview-bar').classList.remove('hidden');
        // Show filename and formatted size
        const size = (file.size / 1024).toFixed(1) + " KB";
        document.getElementById('file-name').innerText = `${file.name} (${size})`;
    }
}

function send() {
    const msg = document.getElementById('msgInput').value;
    const file = document.getElementById('fileInput').files[0];
    if(!msg && !file) return;

    const data = { room: myRoom, message: msg, senderId: socket.id };

    if(file) {
        const reader = new FileReader();
        document.getElementById('progress-container').classList.remove('hidden');
        document.getElementById('progress-bar').style.width = "100%";
        
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Add file metadata to the payload
            data.fileData = reader.result; 
            data.fileName = file.name;
            data.fileType = file.type;

            socket.emit('send-content', data);
            setTimeout(() => document.getElementById('progress-container').classList.add('hidden'), 500);
            resetInputs();
        };
    } else {
        socket.emit('send-content', data);
        resetInputs();
    }
}

socket.on('receive-content', (data) => {
    if(data.type === 'system') {
        addSysMsg(data.message);
        return;
    }
    
    const isMe = data.senderId === socket.id;
    const chatContainer = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble max-w-[88%] md:max-w-[70%] p-3.5 md:p-4 text-[13px] md:text-sm shadow-sm ${isMe ? 'my-msg' : 'friend-msg'}`;
    
    let content = `<p class="leading-relaxed whitespace-pre-wrap">${data.message || ''}</p>`;

    // Check if there is an attachment
    if(data.fileData) {
        const isImage = data.fileType && data.fileType.startsWith('image/');
        
        if(isImage) {
            // Render Image Preview
            content += `<img src="${data.fileData}" onclick="zoomImage(this.src)" class="mt-3 rounded-xl max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity">`;
        } else {
            // Render Downloadable File Card
            content += `
                <a href="${data.fileData}" download="${data.fileName}" class="mt-3 flex items-center gap-3 p-3 rounded-xl bg-black/10 dark:bg-white/10 border border-white/5 hover:bg-black/20 transition-all no-underline text-inherit">
                    <div class="bg-blue-500/20 p-2 rounded-lg">
                        <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div class="overflow-hidden">
                        <div class="font-bold truncate text-[12px]">${data.fileName}</div>
                        <div class="text-[9px] opacity-60 font-black uppercase tracking-wider">Click to Download</div>
                    </div>
                </a>`;
        }
    }

    bubble.innerHTML = content;
    chatContainer.appendChild(bubble);
    scrollDown();
});

