const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./db');

// 初始化Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 添加路由日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 添加错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).send('服务器错误');
});

// 确保静态文件路径正确
console.log('静态文件路径:', path.join(__dirname, '../public'));
app.use(express.static(path.join(__dirname, '../public')));

// 添加一个测试路由
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: '服务器正常运行' });
});

// 确保可以直接访问 alarm.html
app.get('/alarm.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/alarm.html'));
});

// 导入Socket处理逻辑
require('./socket')(io, db);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 