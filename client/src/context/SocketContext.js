import React, { useContext, useState, useEffect } from 'react'
import Peer from 'simple-peer'
import { io, Socket } from 'socket.io-client'
import { timeout } from '../utils'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

const SocketContext = React.createContext()

const socket = io(':5001')

export const useSocket = () => {
    return useContext(SocketContext)
}

const SocketProvider = ({ children }) => {
    const { currentUser } = useAuth() 
    const [me, setMe] = useState('')
    const [myStream, setMyStream] = useState({})
    const [streams, setStreams] = useState([])
    const [idsForStreams, setIdsForStreams] = useState([])
    const [peers, setPeers] = useState([])
    const [update, setUpdate] = useState(0)
    const [callRequestFrom, setCallRequestFrom] = useState(false)
    const [callRejected, setCallRejected] = useState(false)
    const [streamsMap, setStreamsMap] = useState(new Map())
    let roomId = ''

    const navigate = useNavigate()

    useEffect(() => {
        socket.on('me', async id => {
            setMe(id)
            console.log('me: ' + id)
            console.log('email: ' + currentUser.email)
        })

        socket.on('callRequest', email => {
            socket.once('cancelCall', email => {
                console.log('cancel call')
                setCallRequestFrom(false)
            })
            console.log('callRequest from: ' + email)
            setCallRequestFrom(email)
        })
    }, [])

    useEffect(() => {
        setEmail()
    }, [currentUser])

    const setEmail = async () => {
        while (me == '') await timeout(1000)
        while(currentUser == undefined) await timeout(100)
        socket.emit('email', currentUser.email)
        console.log('email set for: ' + currentUser.email)
    }
   
    const call = (id, email, stream, info) => {
        const peer = new Peer({
            initiator: true,
            tricklet: false,
            stream: stream,
            // config: {
            //     iceServers:
            //         [
                        // {
                        //     urls: '23.21.150.121:3478'
                        // },
                        // {
                        //     urls: 'stun:stun.l.google.com:19302'
                        // },
                        // {
                        //     urls: 'stun:global.stun.twilio.com:3478?transport=udp'
                        // }
                    // ]
            // }
        })

        peer.once('signal', data => {
            socket.emit('call', {
                userToCall: id,
                signalData: data,
                from: me,
                info
            })
        })

        peer.on('stream', (stream) => {
            // console.log('stream received id: ' + stream.id)
            // setIdsForStreams(idsForStreams => [...idsForStreams, id])
            // console.log(stream)
            // setStreams(streams => [...streams, stream])
            setStreamsMap(new Map(streamsMap.set(email, stream)))
            // streamsMap.set(id, stream)
            console.log('added stream')
            console.log(streamsMap)
            setPeers(peers => [...peers, peer])
        })

        socket.on('callAccepted', signal => {
            peer.signal(signal)
        })
    }

    const answerCall = (id, signal, stream, info, email) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        })

        peer.once('signal', data => {
            socket.emit("answerCall", {signal: data, to: id, from: me})
        })

        peer.on('stream', stream => {
            // console.log('stream received id: ' + stream.id)
            // setIdsForStreams(idsForStreams => [...idsForStreams, id])
            // setStreams(streams => [...streams, stream])
            setStreamsMap(new Map(streamsMap.set(email, stream)))
            // streamsMap.set(id, stream)
            console.log('added stream')
            console.log(streamsMap)
            setPeers(peers => [...peers, peer])
        })

        peer.signal(signal)
    }

    const joinRoom = (id, stream) => {
        setStreamsMap(new Map())
        roomId = id
        console.log('roomId set to : ' + roomId)
        socket.emit('join-room', id)

        socket.on('call', data => {
            answerCall(data.from, data.signal, stream, data.info, data.email)
        })

        socket.on('leaveRoom', email => {
            console.log('leaveRoom: ' + email)
            console.log(streamsMap)
            let copyMap = streamsMap
            copyMap.delete(email)
            setStreamsMap(new Map(copyMap))
            console.log(streamsMap)
            setPeers(peers => [...peers, {}])
            localStorage.setItem("video", "camera")
            localStorage.setItem("audio", false)
        })

        socket.on('usersInRoom', async users => {
            // console.log('usersInRoom')
            // console.log(users)
            for (let user of users) {
                call(user.id, user.email, stream, { name: "name" })
                await timeout(1000)
            }
        })

        socket.on('changedStream', id => {
            console.log('changedStream received')
            if (id != me) {
                // for (let peer of peers) {
                //     for (let stream of peer.streams) {
                //         console.log('stream id: ' + stream.id)
                //     }
                // }
                // window.location.reload()
                // console.log('roomId: ' + roomId)
                // navigate(`/${roomId}`)
            }
        })
    }

    const destroyPeers = () => {
        console.log('destroyPeers')
        // for (let peer of peers) {
        //     if (peer != {} || peer != undefined) { 
        //         try {
        //             peer.destroy()
        //         } catch (e) {}
        //     }
        // }
    }

    const leaveCall = (id) => {
        console.log('leaveCall')
        setStreamsMap(new Map())
        localStorage.setItem("video", "camera")
        localStorage.setItem("audio", false)
        for (let peer of peers) {
            console.log('destroyed peer')
            peer.destroy()
        }
        socket.emit('leaveRoom', id)
        navigate('/')
        window.location.reload()
    }

    function replaceStream(newStream, roomId) {

        socket.emit('changedStream', roomId)
        // setStreams([])
        console.log('changed stream')
    }

    const logoutEvent = async () => {
        socket.emit('logout', {})
    }

    const sendCallRequest = async (email) => {
        let f = async () => {
            await timeout(100)
            window.location.reload()
        }
        setCallRejected(false)
        socket.emit('callRequest', email)
        socket.once('callRequestAnswer', answer => {
            console.log('callRequestAnswer: ' + answer)
            if (answer == 'rejected') {
                console.log('rejected')
                setCallRejected(true)
            } else {
                f()
                navigate(`/${answer}`)
            }
        })
    }

    const answerCallRequest = async (answer, email) => {
        console.log('callRequestAnswer: ' + answer + ', ' + email)
        socket.emit('callRequestAnswer', { answer, email })
    }

    const sendCancelCall = async (email) => {
        socket.emit('cancelCall', email)
    }

    const value = {call, answerCall, me, joinRoom, myStream, setMyStream, streams, idsForStreams, leaveCall, replaceStream, peers, update, logoutEvent, setEmail, sendCallRequest, callRequestFrom, setCallRequestFrom, answerCallRequest, callRejected, sendCancelCall, streamsMap, destroyPeers}
    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    )
}

export default SocketProvider
