module.exports = function(io, db) {
    // 检查闹钟的定时器
    setInterval(checkAlarms, 1000);
    
    io.on('connection', (socket) => {
        console.log('新连接:', socket.id);
        
        // 用户登录
        socket.on('login', (data) => {
            const { role } = data;
            
            // 验证角色
            if (role !== 'boyfriend' && role !== 'girlfriend') {
                socket.emit('login_result', {
                    success: false,
                    message: '无效的用户角色'
                });
                return;
            }
            
            // 检查用户是否已在线
            if (db.users[role].online) {
                socket.emit('login_result', {
                    success: false,
                    message: '该用户已登录'
                });
                return;
            }
            
            // 登录成功
            socket.emit('login_result', {
                success: true,
                userId: role
            });
        });
        
        // 用户连接
        socket.on('user_connected', (data) => {
            const { userId, role } = data;
            
            // 验证用户
            if (!db.users[userId]) {
                return;
            }
            
            // 更新用户状态
            db.users[userId].online = true;
            db.userSockets[userId] = socket.id;
            
            // 通知伴侣用户上线
            const partnerId = db.users[userId].partnerId;
            if (db.userSockets[partnerId]) {
                io.to(db.userSockets[partnerId]).emit('partner_status', {
                    online: true
                });
            }
            
            // 发送伴侣状态给当前用户
            socket.emit('partner_status', {
                online: db.users[partnerId] ? db.users[partnerId].online : false
            });
            
            // 断开连接时的处理
            socket.on('disconnect', () => {
                if (db.users[userId]) {
                    db.users[userId].online = false;
                    delete db.userSockets[userId];
                    
                    // 通知伴侣用户下线
                    if (db.userSockets[partnerId]) {
                        io.to(db.userSockets[partnerId]).emit('partner_status', {
                            online: false
                        });
                    }
                }
            });
        });
        
        // 设置闹钟
        socket.on('set_alarm', (data) => {
            const { userId, time } = data;
            
            // 验证用户
            if (!db.users[userId]) {
                return;
            }
            
            // 创建闹钟
            const alarmId = Date.now().toString();
            const newAlarm = {
                id: alarmId,
                time: time,
                active: true,
                createdBy: userId
            };
            
            db.alarms.push(newAlarm);
            
            // 通知双方闹钟已设置
            const userIds = [userId, db.users[userId].partnerId];
            userIds.forEach(id => {
                if (db.userSockets[id]) {
                    io.to(db.userSockets[id]).emit('alarm_set', {
                        alarms: db.alarms.filter(a => a.active)
                    });
                }
            });
        });
        
        // 获取闹钟列表
        socket.on('get_alarms', (data) => {
            const { userId } = data;
            
            // 验证用户
            if (!db.users[userId]) {
                return;
            }
            
            // 发送闹钟列表
            socket.emit('alarm_set', {
                alarms: db.alarms.filter(a => a.active)
            });
        });
        
        // 删除闹钟
        socket.on('delete_alarm', (data) => {
            const { userId, alarmId } = data;
            
            // 验证用户
            if (!db.users[userId]) {
                return;
            }
            
            // 查找并删除闹钟
            const alarmIndex = db.alarms.findIndex(a => a.id === alarmId);
            if (alarmIndex !== -1) {
                db.alarms[alarmIndex].active = false;
                
                // 通知双方闹钟已删除
                const userIds = [userId, db.users[userId].partnerId];
                userIds.forEach(id => {
                    if (db.userSockets[id]) {
                        io.to(db.userSockets[id]).emit('alarm_set', {
                            alarms: db.alarms.filter(a => a.active)
                        });
                    }
                });
            }
        });
        
        // 关闭闹钟
        socket.on('dismiss_alarm', (data) => {
            const { userId } = data;
            
            // 验证用户
            if (!db.users[userId]) {
                return;
            }
            
            // 通知伴侣闹钟已关闭
            const partnerId = db.users[userId].partnerId;
            if (db.userSockets[partnerId]) {
                io.to(db.userSockets[partnerId]).emit('partner_alarm_status', {
                    dismissed: true
                });
            }
        });
        
        // 语音消息
        socket.on('voice_message', (data) => {
            const { userId, audio } = data;
            
            // 验证用户
            if (!db.users[userId]) {
                return;
            }
            
            // 发送语音消息给伴侣
            const partnerId = db.users[userId].partnerId;
            if (db.userSockets[partnerId]) {
                io.to(db.userSockets[partnerId]).emit('receive_voice', {
                    audio: audio
                });
            }
        });
    });
    
    // 检查闹钟是否应该触发
    function checkAlarms() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // 格式化当前时间为HH:MM格式
        const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        
        // 检查每个活跃的闹钟
        db.alarms.forEach(alarm => {
            if (!alarm.active) return;
            
            // 如果闹钟时间与当前时间匹配
            if (alarm.time === currentTime && !alarm.triggered) {
                alarm.triggered = true;
                
                // 通知双方闹钟触发
                const creatorId = alarm.createdBy;
                const partnerId = db.users[creatorId].partnerId;
                
                [creatorId, partnerId].forEach(userId => {
                    if (db.userSockets[userId]) {
                        io.to(db.userSockets[userId]).emit('alarm_triggered', {
                            time: alarm.time
                        });
                    }
                });
                
                // 5分钟后重置闹钟状态，以便下次触发
                setTimeout(() => {
                    alarm.triggered = false;
                }, 5 * 60 * 1000);
            }
        });
    }
};
