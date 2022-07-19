import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { json } from 'express';
const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const { uuid } = require('uuidv4');
import { intitialize } from "./repository.mjs";
import routes from './routes.mjs';
const { Server } = require("socket.io");
// const io = require("socket.io")(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// })
const PORT = process.env.PORT || 5000

const io = new Server({
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
});
    
io.listen(5001)

let socketsMap = new Map([])

io.on("connection", (socket) => {
    console.log('new connection: ' + socket.id)
    socket.emit('me', socket.id)

    socket.on('email', async email => {
        if (email != null) {
            // console.log('email received: ' + email)
            await cleanSocketList(email)
            socketsMap.set(socket.id, email)
        } else {
            socket.disconnect()
        }
    })

    socket.on("join-room", async roomId => {
        socket.join(roomId)
        let sockets = await io.in(roomId).fetchSockets()
        // console.log('sockets: ' + sockets)
        let ids = []
        for (let s of sockets) {
            if(s.id != socket.id) ids.push(s.id)
        }
        // console.log('ids: ' + ids)
        // console.log(ids)
        let users = []
        for (let id of ids) {
            let email = await getEmailForId(id)
            while (email == undefined) {
                email = await getEmailForId(id)
                await timeout(100)
            }
            users.push({ id, email})
        }
        // console.log(users)
        io.to(socket.id).emit('usersInRoom', users)
        console.log('roomId: ' + roomId)    
    })

    socket.on('call', async data => {
        console.log('call')
        console.log('data.from : ' + data.from)
        let email = await getEmailForId(socket.id)
        while (email == undefined) {
            email = await getEmailForId(socket.id)
            await timeout(100)
        }
        console.log('email sent: ' + email)
        io.to(data.userToCall).emit("call", { signal: data.signalData, from: socket.id, email, info: data.info })
    })

    socket.on("answerCall", (data) => {
        console.log('answerCall to : ' + data.to)
		io.to(data.to).emit("callAccepted", data.signal)
	})

    socket.on("leaveRoom", async roomId => {
        let email = await getEmailForId(socket.id)
        socket.to(roomId).emit('leaveRoom', email)
        socket.leave(roomId)
    })

    socket.on("changedStream", roomId => {
        socket.to(roomId).emit('changedStream', socket.id)
        console.log('changedStream')
    })

    socket.on('callRequest', email => {
        for (let [key, value] of socketsMap) {
            if (value === email) {
                io.to(key).emit('callRequest', socketsMap.get(socket.id))
            }
        }
    }) 

    socket.on('callRequestAnswer', ({answer, email}) => {
        console.log('callRequestAnswer: ' + answer + ', ' + email)
        for (let [key, value] of socketsMap) {
            if (value === email) {
                io.to(key).emit('callRequestAnswer', answer)
            }
        }
    })

    socket.on('cancelCall', email => {
        for (let [key, value] of socketsMap) {
            if (value === email) {
                io.to(key).emit('cancelCall', socketsMap.get(socket.id))
            }
        }
    })

    socket.on('logout', () => {
        console.log('logout')
        socketsMap.set(socket.id, {})
    })

    // socket.on('peer1Signal', ({ data, userId }) => {
    //     console.log('peer1Signal to ' + userId)
    //     let peer1Id = socket.id
    //     io.to(userId).emit('peer1Signal', {data, peer1Id})
    // })

    // socket.on('peer2Signal', ({ data, peer1Id }) => {
    //     console.log('peer2Signal')
    //     io.to(peer1Id).emit("peer2Signal", data)
    // })
})

const getEmailForId = async (id) => {
    const sockets = await io.fetchSockets();
    console.log(socketsMap)
    console.log('id for getEmail: ' + id)
    return socketsMap.get(id)
}

const cleanSocketList = async (email) => {
    let newMap = new Map([])
    // console.log('cleanSocket: ' + email)
    console.log(socketsMap)
    const sockets = await io.fetchSockets();
    for (let socket of sockets) {
        // console.log('id: ' + socket.id + ', email: ' + socketsMap.get(socket.id))
        newMap.set(socket.id, socketsMap.get(socket.id))
    }
    socketsMap = newMap
}

export const isOnline = async (email) => {
    // console.log('isOnline: ', email)
    console.log(socketsMap)
    const sockets = await io.fetchSockets();
    for (let socket of sockets) {
        if (socketsMap.get(socket.id) == email) {
            return true
        }
    }
    return false
}

app.listen(PORT, async () => {
    try {
        await intitialize()
        console.log('intitialized')
    } catch (err) {
        console.error(err)
    }
})

app.use(json())
app.use(cors())

app.use('', routes)

export const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
