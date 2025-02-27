// 简单的内存数据库，实际项目中应使用MongoDB等数据库
const db = {
    users: {
        boyfriend: {
            id: 'boyfriend',
            role: 'boyfriend',
            online: false,
            partnerId: 'girlfriend'
        },
        girlfriend: {
            id: 'girlfriend',
            role: 'girlfriend',
            online: false,
            partnerId: 'boyfriend'
        }
    },
    alarms: [],
    userSockets: {}
};

module.exports = db; 