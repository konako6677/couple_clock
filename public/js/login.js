document.addEventListener('DOMContentLoaded', function() {
    const boyfriendBtn = document.getElementById('boyfriend-btn');
    const girlfriendBtn = document.getElementById('girlfriend-btn');
    
    // 连接Socket.io
    const socket = io();
    
    boyfriendBtn.addEventListener('click', function() {
        login('boyfriend');
    });
    
    girlfriendBtn.addEventListener('click', function() {
        login('girlfriend');
    });
    
    function login(role) {
        // 发送登录请求到服务器
        socket.emit('login', { role: role });
        
        // 监听登录结果
        socket.once('login_result', function(data) {
            if (data.success) {
                // 保存用户角色到本地存储
                localStorage.setItem('userRole', role);
                localStorage.setItem('userId', data.userId);
                
                // 跳转到闹钟页面
                window.location.href = '/alarm.html';
            } else {
                alert(data.message || '登录失败，请重试');
            }
        });
    }
}); 