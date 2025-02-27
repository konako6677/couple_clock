const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./db');

// 初始化Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 导入Socket处理逻辑
require('./socket')(io, db);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 