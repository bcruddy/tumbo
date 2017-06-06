let tumbo = window.tumbo || {};

tumbo = {
    elements: {
        chatForm: document.getElementById('chat-form'),
        chatList: document.getElementById('server-response'),
        currentUserName: document.getElementById('current-user'),
        videoWrapper: document.getElementById('video-windows')
    },

    init: function () {
        const chatConnections = {},
            userName = prompt('Enter username'),
            socket = io();

        this.elements.currentUserName.textContent = userName;
        this.createWebcamVideo(socket, userName);

        this.elements.chatForm.addEventListener('submit', (event) => {
            event.preventDefault();

            let message = document.getElementById('m'),
                data = JSON.stringify({
                    user: userName,
                    message: message.value,
                    date: new Date()
                });

            socket.emit('chat message', data);

            message.value = '';

            return false;
        });

        socket.on('chat message', msg => {
            this.elements.chatList.appendChild(this.createChatItem(msg));
            this.elements.chatList.scrollTop = this.elements.chatList.scrollHeight; // scroll to bottom of chat
        });

        socket.on('ascii video', (data) => {
            var videoWindow;

            if (!(data.id in chatConnections)) {
                chatConnections[data.id] = socket;

                var row = document.createElement('div');
                row.classList.add('row');
                var col = document.createElement('div');
                row.classList.add('col-md-12');

                videoWindow = document.createElement('pre');

                videoWindow.setAttribute('data-socket-id', data.id);
                videoWindow.classList.add('video-pane');

                col.appendChild(videoWindow);
                row.appendChild(col);

                this.elements.videoWrapper.appendChild(row);
            } else {
                videoWindow = document.querySelector(`.video-pane[data-socket-id="${data.id}"]`);
            }

            videoWindow.innerHTML = LZString.decompressFromUTF16(data.ascii);
        });

        socket.on('disconnect', (socketId) => {
            if (socketId in chatConnections) {
                delete chatConnections[socketId];
                var videoWindow = document.querySelector(`.video-pane[data-socket-id="${socketId}"]`);
                videoWindow.parentNode.parentNode.removeChild(videoWindow.parentNode);
            }
        });

        document.getElementById('play-webrtc').addEventListener('click', function() {
            webcamJscii.play();
        });
        document.getElementById('pause-webrtc').addEventListener('click', function() {
            webcamJscii.pause();
        });
    },

    createWebcamVideo: function (socket, userName) {
        return new Jscii({
            container: document.getElementById('ascii-container-webrtc'),
            el: document.getElementById('jscii-element-webrtc'),
            webrtc: true,
            interval: 333,
            fn: function (ascii) {
                let compressed = LZString.compressToUTF16(ascii);

                socket.emit('ascii video', {userName, ascii: compressed});
            }
        });
    },

    createChatItem: function (serverResponse, index = -1) {
        let data = JSON.parse(serverResponse),
            listItem = document.createElement('li');

        listItem.dataset.index = index;
        listItem.textContent = data.message;

        listItem.innerHTML = `
            <strong class="username">${data.user}:</strong>
            <small class="date">(${data.date})</small>
            <span class="message">${data.message}</span>`;

        return listItem;
    }
}
