let tumbo = window.tumbo || {};

tumbo = {
    init: function () {
        const userName = prompt('Enter username');

        document.getElementById('current-user').textContent = userName;

        const socket = io(),
            chatForm = document.getElementById('chat-form'),
            responseList = document.getElementById('server-response'),
            createResponseItem = (res, index = -1) => {
                let data = JSON.parse(res),
                    listItem = document.createElement('li');

                listItem.dataset.index = index;
                listItem.textContent = data.message;

                listItem.innerHTML = `
                    <strong class="username">${data.user}:</strong>
                    <small class="date">(${data.date})</small>
                    <span class="message">${data.message}</span>`;

                return listItem;
            };

        chatForm.addEventListener('submit', (event) => {
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
            responseList.appendChild(createResponseItem(msg));
            responseList.scrollTop = responseList.scrollHeight; // scroll to bottom of chat
        });

        var webcamJscii = new Jscii({
            container: document.getElementById('ascii-container-webrtc'),
            el: document.getElementById('jscii-element-webrtc'),
            webrtc: true,
            interval: 333,
            fn: function (ascii) {
                socket.emit('ascii video', {userName, ascii});
            }
        });

        const chatConnections = {},
            videoWrapper = document.getElementById('video-windows');

        socket.on('ascii video', function (data) {
            var videoWindow;
            if (Object.keys(chatConnections).indexOf(data.id) === -1) {
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

                videoWrapper.appendChild(row);
            } else {
                videoWindow = document.querySelector(`.video-pane[data-socket-id="${data.id}"]`);
            }

            // check to see if socket id is already being displayed
            // if not, create a new display
            videoWindow.innerHTML = data.ascii;
        });

        socket.on('disconnect', function (socketId) {
            if (socketId in chatConnections) {
                delete chatConnections[socketId];
                var videoWindow = document.querySelector(`.video-pane[data-socket-id="${socketId}"]`);
                videoWrapper.emoveChild(videoWindow.parentNode);
            }
        });

        document.getElementById('play-webrtc').addEventListener('click', function() {
            webcamJscii.play();
        });
        document.getElementById('pause-webrtc').addEventListener('click', function() {
            webcamJscii.pause();
        });
    }
}
