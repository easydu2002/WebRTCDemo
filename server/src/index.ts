import { SocketRecordData } from './socket-data';

import WebSocket from 'ws'
import qs from 'node:querystring'



const onlineUsers: Array<SocketRecordData> = []
const wss = new WebSocket.Server({port: 3000})

wss.on('connection', (ws, req) => {

    try {

        if(req.url) {
            let { username } = qs.parse(req.url.slice(req.url.indexOf('?') + 1))

            if(!username || findOnlineByUsername((username = username.toString().trim()))) {
                throw new Error()
            }

            onlineUsers.push({
                username: username,
                ws
            })
        
            sendAll({
                type: 'join',
                username,
                data: `${username}加入聊天!, 当前在线人数: ${onlineUsers.length}`
            })
        
            ws.on('message', (msg) => {

                const data = JSON.parse(msg.toString())
                
                if(data.target) {
                    sendToUser(username as string, data.target, data)
                }else {
                    sendAll(JSON.parse(msg.toString()), username as string)
                }
            })

            ws.on('close', () => {
                
                onlineUsers.splice(onlineUsers.findIndex(item => item.username === username), 1)
                sendAll({
                    type: 'leaved',
                    username,
                    data: `${username}退出了聊天!, 当前在线人数: ${onlineUsers.length}`
                })
            })
        }

    } catch (error) {
        console.log(error);
        
        ws.close()
    }

})

// function handleMessageData(data) {

//     switch(data.type) {
//         case 'chat-message':
//             sendAll(data)
//             break;
//     }
// }


function sendAll(data: Object, sendUser?: string) {

    onlineUsers.forEach(({ws, username}) => {

        // if(!sendUser || username !== sendUser) {
            
            ws.send(JSON.stringify({...data, username: sendUser}))
        // }
    })
}

function sendToUser(sendUser: string, target: string, data: Object) {

    const wsObj = findOnlineByUsername(target)
    wsObj?.ws.send(JSON.stringify({username: sendUser, ...data}))
}

function findOnlineByUsername(username: string) {

    return onlineUsers.find(item => item.username === username)
}