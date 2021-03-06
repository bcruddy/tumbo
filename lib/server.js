const express = require('express'),
    app = express(),
    noSlash = require('no-slash'),
    urlCleaner = require('express-url-cleaner'),
    http = require('http').Server(app),
    io = require('socket.io')(http);

app.use(urlCleaner());
app.use(noSlash());

app.use('/assets', express.static('src',  {root: `${__dirname}/../`}));

app.get('/', (req, res) => {
    res.sendFile('views/index.html', {root: `${__dirname}/../`});
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', data => {
        io.emit('chat message', data);
    });

    socket.on('ascii video', data => {
        io.emit('ascii video', {
            id: socket.id,
            ascii: data.ascii,
            userName: data.userName
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        io.emit('disconnect', socket.id);
    });
});

http.listen(6900, () => {
    console.log('listening on *:6900');
});
