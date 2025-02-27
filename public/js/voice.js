document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const recordBtn = document.getElementById('record-btn');
    const recordingTimer = document.getElementById('recording-timer');
    const voiceMessageList = document.getElementById('voice-message-list');
    const alertRecordBtn = document.getElementById('alert-record-btn');
    const alertRecordingTimer = document.getElementById('alert-recording-timer');
    
    // 从本地存储获取用户信息
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // 连接Socket.io (使用alarm.js中已创建的连接)
    const socket = io();
    
    // 语音录制变量
    let mediaRecorder;
    let audioChunks = [];
    let recordingInterval;
    let recordingSeconds = 0;
    let isRecording = false;
    
    // 初始化语音录制
    async function initVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = function(event) {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = function() {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                sendVoiceMessage(audioBlob);
                audioChunks = [];
            };
            
            return true;
        } catch (error) {
            console.error('无法访问麦克风:', error);
            alert('无法访问麦克风，请确保已授予麦克风权限');
            return false;
        }
    }
    
    // 开始录音
    function startRecording(timerElement) {
        if (!mediaRecorder) return;
        
        isRecording = true;
        audioChunks = [];
        recordingSeconds = 0;
        
        mediaRecorder.start();
        timerElement.classList.remove('hidden');
        timerElement.textContent = '00:00';
        
        recordingInterval = setInterval(function() {
            recordingSeconds++;
            
            // 限制录音时间为15秒
            if (recordingSeconds >= 15) {
                stopRecording();
                return;
            }
            
            const seconds = String(recordingSeconds % 60).padStart(2, '0');
            const minutes = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
            timerElement.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    // 停止录音
    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        clearInterval(recordingInterval);
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        
        recordingTimer.classList.add('hidden');
        alertRecordingTimer.classList.add('hidden');
    }
    
    // 发送语音消息
    function sendVoiceMessage(audioBlob) {
        // 将音频Blob转换为Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        
        reader.onloadend = function() {
            const base64Audio = reader.result;
            
            // 发送语音消息到服务器
            socket.emit('voice_message', {
                userId: userId,
                audio: base64Audio
            });
        };
    }
    
    // 接收语音消息
    socket.on('receive_voice', function(data) {
        playVoiceMessage(data.audio);
        addVoiceMessageToList(data.audio);
    });
    
    // 播放语音消息
    function playVoiceMessage(base64Audio) {
        const audio = new Audio(base64Audio);
        audio.play();
    }
    
    // 添加语音消息到列表
    function addVoiceMessageToList(base64Audio) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'voice-message';
        
        const audioEl = document.createElement('audio');
        audioEl.controls = true;
        audioEl.src = base64Audio;
        
        const timeDiv = document.createElement('div');
        const now = new Date();
        timeDiv.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        timeDiv.className = 'message-time';
        
        messageDiv.appendChild(audioEl);
        messageDiv.appendChild(timeDiv);
        
        voiceMessageList.prepend(messageDiv);
    }
    
    // 初始化语音录制
    initVoiceRecording().then(function(success) {
        if (!success) return;
        
        // 主页面录音按钮事件
        recordBtn.addEventListener('mousedown', function() {
            startRecording(recordingTimer);
        });
        
        recordBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startRecording(recordingTimer);
        });
        
        recordBtn.addEventListener('mouseup', stopRecording);
        recordBtn.addEventListener('touchend', stopRecording);
        
        // 闹钟弹窗录音按钮事件
        alertRecordBtn.addEventListener('mousedown', function() {
            startRecording(alertRecordingTimer);
        });
        
        alertRecordBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startRecording(alertRecordingTimer);
        });
        
        alertRecordBtn.addEventListener('mouseup', stopRecording);
        alertRecordBtn.addEventListener('touchend', stopRecording);
    });
}); 