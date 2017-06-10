let tumbo = window.tumbo || {};

tumbo = {
    elements: {
        chatForm: document.getElementById('chat-form'),
        chatMessageTextarea: document.getElementById('chat-message'),
        chatMessageSubmit: document.getElementById('chat-submit'),
        chatThread: document.getElementById('chat-thread'),
        currentUserName: document.getElementById('current-user'),
        videoWrapper: document.getElementById('video-windows')
    },

    init () {
        const chatConnections = {},
            userName = this.username = prompt('Enter username'),
            socket = this.socket = io();

        this.elements.currentUserName.textContent = userName;
        this.webcamJscii = this.createWebcamVideo(socket, userName);

        this.elements.chatMessageSubmit.onclick = this.submitChatForm.bind(this);
        this.elements.chatMessageTextarea.addEventListener('keypress', event => {
            event = event || window.event;

            let keyCode = event.keyCode || event.which;

            if (keyCode !== 13) {
                return;
            }

            this.submitChatForm();
        });

        this.elements.chatForm.addEventListener('submit', (event) => {
            event.preventDefault();

            let message = this.elements.chatMessageTextarea,
                data = JSON.stringify({
                    user: userName,
                    message: message.value,
                    date: this.timestamp
                });

            socket.emit('chat message', data);

            setTimeout(() => {
                message.value = '';
            }, 1);

            return false;
        });

        socket.on('chat message', msg => {
            this.elements.chatThread.appendChild(this.createChatItem(msg));
            this.elements.chatThread.scrollTop = this.elements.chatThread.scrollHeight; // scroll to bottom of chat
        });

        socket.on('ascii video', (data) => {
            let videoWindow;

            if (!(data.id in chatConnections)) {
                let row = document.createElement('div'),
                    col = document.createElement('div'),
                    displayWrapper = document.createElement('div');

                chatConnections[data.id] = socket;

                row.classList.add('row');
                col.classList.add('col-md-12');
                displayWrapper.classList.add('video-wrapper');

                videoWindow = document.createElement('pre');

                videoWindow.setAttribute('data-socket-id', data.id);
                videoWindow.classList.add('video-pane');

                displayWrapper.appendChild(videoWindow);
                col.appendChild(displayWrapper);
                row.appendChild(col);

                this.elements.videoWrapper.appendChild(row);
            }
            else {
                videoWindow = document.querySelector(`.video-pane[data-socket-id="${data.id}"]`);
            }

            videoWindow.innerHTML = LZString.decompressFromUTF16(data.ascii);
        });

        socket.on('disconnect', (socketId) => {
            if (socketId in chatConnections) {
                delete chatConnections[socketId];

                let videoWindow = document.querySelector(`.video-pane[data-socket-id="${socketId}"]`),
                    disconnectData = JSON.stringify({
                        user: 'tumbo',
                        message: `User ${socketId} has disconnected.`,
                        date: this.timestamp
                    });

                try {
                    videoWindow.parentNode.parentNode.removeChild(videoWindow.parentNode);
                }
                catch (ex) {
                    console.warn(ex);
                }

                this.elements.chatThread.appendChild(this.createChatItem(disconnectData));
            }
        });

        document.getElementById('play-webrtc').addEventListener('click', () => {
            this.webcamJscii.play();
        });
        document.getElementById('pause-webrtc').addEventListener('click', () => {
            this.webcamJscii.pause();
        });
    },

    createWebcamVideo (socket, userName) {
        return new Jscii({
            container: document.getElementById('ascii-container-webrtc'),
            el: document.getElementById('jscii-element-webrtc'),
            webrtc: true,
            interval: 200,
            fn: (ascii) => {
                let compressed = LZString.compressToUTF16(ascii);

                socket.emit('ascii video', {userName, ascii: compressed});
            }
        });
    },

    createChatItem (serverResponse, index = -1) {
        let data = JSON.parse(serverResponse),
            {user, date, message} = data,
            listItem = document.createElement('li');

        listItem.classList.add('chat-item');
        listItem.dataset.index = index;
        listItem.textContent = data.message;

        listItem.innerHTML = `
            <strong class="username">${user}</strong>
            <small class="date text-muted">${date}</small>
            <span class="message">${message}</span>`;

        return listItem;
    },

    formatChatTextarea () {
        this.elements.chatForm.style.maxWidth = `${this.elements.chatThread.offsetWidth}px`;
    },

    submitChatForm () {
        if (!this.elements.chatMessageTextarea.value.length) {
            return alert('You cannot submit an empty message.');
        }

        let submit = new Event('submit');

        this.elements.chatForm.dispatchEvent(submit);
    },

    get timestamp () {
        return moment().format('h:mm a');
    }
}
