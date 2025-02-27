document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const currentTimeEl = document.getElementById('current-time');
    const userRoleEl = document.getElementById('user-role');
    const partnerStatusEl = document.getElementById('partner-status');
    const alarmTimeInput = document.getElementById('alarm-time');
    const setAlarmBtn = document.getElementById('set-alarm-btn');
    const alarmsList = document.getElementById('alarms-list');
    const alarmAlert = document.getElementById('alarm-alert');
    const alertTime = document.getElementById('alert-time');
    const alertPartnerStatus = document.getElementById('alert-partner-status');
    const sliderThumb = document.getElementById('slider-thumb');
    
    // 从本地存储获取用户角色
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    if (!userRole || !userId) {
        // 未登录，重定向到登录页面
        window.location.href = '/index.html';
        return;
    }
    
    // 显示用户角色
    userRoleEl.textContent = userRole === 'boyfriend' ? '男生' : '女生';
    
    // 连接Socket.io
    const socket = io();
    
    // 发送用户连接信息
    socket.emit('user_connected', {
        userId: userId,
        role: userRole
    });
    
    // 更新当前时间
    function updateCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        currentTimeEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    // 每秒更新一次时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 设置闹钟
    setAlarmBtn.addEventListener('click', function() {
        const alarmTime = alarmTimeInput.value;
        
        if (!alarmTime) {
            alert('请选择闹钟时间');
            return;
        }
        
        // 发送闹钟设置请求到服务器
        socket.emit('set_alarm', {
            userId: userId,
            time: alarmTime
        });
    });
    
    // 监听闹钟设置结果
    socket.on('alarm_set', function(data) {
        // 更新闹钟列表
        updateAlarmsList(data.alarms);
    });
    
    // 监听伴侣状态更新
    socket.on('partner_status', function(data) {
        partnerStatusEl.textContent = `对方状态: ${data.online ? '在线' : '离线'}`;
    });
    
    // 监听闹钟触发
    socket.on('alarm_triggered', function(data) {
        // 显示闹钟弹窗
        alarmAlert.classList.remove('hidden');
        alertTime.textContent = data.time;
        
        // 播放闹钟声音
        playAlarmSound();
    });
    
    // 监听伴侣闹钟状态
    socket.on('partner_alarm_status', function(data) {
        alertPartnerStatus.textContent = `对方状态: ${data.dismissed ? '已起床' : '未起床'}`;
    });
    
    // 滑动关闭闹钟
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    
    sliderThumb.addEventListener('mousedown', startDrag);
    sliderThumb.addEventListener('touchstart', startDrag);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    
    function startDrag(e) {
        isDragging = true;
        startX = e.clientX || e.touches[0].clientX;
        sliderThumb.style.transition = 'none';
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const x = e.clientX || e.touches[0].clientX;
        const deltaX = x - startX;
        const containerWidth = sliderThumb.parentElement.offsetWidth;
        const maxDrag = containerWidth - sliderThumb.offsetWidth;
        
        currentX = Math.max(0, Math.min(maxDrag, deltaX));
        sliderThumb.style.transform = `translateX(${currentX}px)`;
        
        // 如果拖动到最右边，关闭闹钟
        if (currentX >= maxDrag * 0.9) {
            dismissAlarm();
        }
    }
    
    function endDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        sliderThumb.style.transition = 'transform 0.3s';
        sliderThumb.style.transform = 'translateX(0)';
    }
    
    function dismissAlarm() {
        // 停止闹钟声音
        stopAlarmSound();
        
        // 隐藏闹钟弹窗
        alarmAlert.classList.add('hidden');
        
        // 发送闹钟关闭信息到服务器
        socket.emit('dismiss_alarm', {
            userId: userId
        });
    }
    
    // 更新闹钟列表
    function updateAlarmsList(alarms) {
        alarmsList.innerHTML = '';
        
        if (alarms.length === 0) {
            const li = document.createElement('li');
            li.textContent = '暂无闹钟';
            alarmsList.appendChild(li);
            return;
        }
        
        alarms.forEach(function(alarm) {
            const li = document.createElement('li');
            
            const timeSpan = document.createElement('span');
            timeSpan.textContent = alarm.time;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.className = 'btn';
            deleteBtn.addEventListener('click', function() {
                deleteAlarm(alarm.id);
            });
            
            li.appendChild(timeSpan);
            li.appendChild(deleteBtn);
            alarmsList.appendChild(li);
        });
    }
    
    // 删除闹钟
    function deleteAlarm(alarmId) {
        socket.emit('delete_alarm', {
            userId: userId,
            alarmId: alarmId
        });
    }
    
    // 播放闹钟声音
    let alarmSound;
    
    function playAlarmSound() {
        alarmSound = new Audio('/sounds/alarm.mp3');
        alarmSound.loop = true;
        alarmSound.play();
    }
    
    function stopAlarmSound() {
        if (alarmSound) {
            alarmSound.pause();
            alarmSound.currentTime = 0;
        }
    }
    
    // 获取初始闹钟列表
    socket.emit('get_alarms', { userId: userId });
}); 