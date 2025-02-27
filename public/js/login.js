document.addEventListener('DOMContentLoaded', function() {
    const boyfriendBtn = document.getElementById('boyfriend-btn');
    const girlfriendBtn = document.getElementById('girlfriend-btn');
    const bothBtn = document.getElementById('both-btn');
    
    // 连接Socket.io
    const socket = io();
    
    // 检查连接状态
    socket.on('connect', function() {
        console.log('已连接到服务器');
    });
    
    socket.on('connect_error', function(error) {
        console.error('连接错误:', error);
        alert('无法连接到服务器，请检查网络连接');
    });
    
    boyfriendBtn.addEventListener('click', function() {
        login('boyfriend');
    });
    
    girlfriendBtn.addEventListener('click', function() {
        login('girlfriend');
    });
    
    // 添加不透露性别按钮的处理
    if (bothBtn) {
        bothBtn.addEventListener('click', function() {
            // 可以随机选择一个角色或创建新的角色
            const roles = ['boyfriend', 'girlfriend'];
            const randomRole = roles[Math.floor(Math.random() * roles.length)];
            login(randomRole);
        });
    }
    
    function login(role) {
        console.log('尝试登录为:', role);
        
        // 检查 socket 是否已连接
        if (!socket.connected) {
            console.error('Socket 未连接');
            alert('未连接到服务器，请刷新页面重试');
            return;
        }
        
        // 发送登录请求到服务器
        socket.emit('login', { role: role });
        
        // 添加超时处理
        const loginTimeout = setTimeout(function() {
            console.error('登录请求超时');
            alert('登录请求超时，请检查网络连接并重试');
        }, 5000);
        
        // 监听登录结果
        socket.once('login_result', function(data) {
            clearTimeout(loginTimeout);
            console.log('登录结果:', data);
            
            if (data.success) {
                // 保存用户角色到本地存储
                localStorage.setItem('userRole', role);
                localStorage.setItem('userId', data.userId);
                
                console.log('准备跳转到闹钟页面');
                // 使用更直接的方式跳转
                document.location.href = '/alarm.html';
            } else {
                alert(data.message || '登录失败，请重试');
            }
        });
    }
}); 