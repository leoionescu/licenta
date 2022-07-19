import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client'
import { useNavigate, useParams } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import Peer from 'simple-peer'
import { useSocket } from '../context/SocketContext'
import '../styles/Room.css'
import { Button, Nav } from 'react-bootstrap';


const Room = () => {
    const { id } = useParams();
    const [stream, setStream] = useState({})
    const myVideo = useRef()
    
    const [sharingScreen, setSharingScreen] = useState(false)
    const [muted, setMuted] = useState(true)
    const [video, setVideo] = useState(true)

    const video1 = useRef()
    const video2 = useRef()
    const video3 = useRef()
    const video4 = useRef()
    const video5 = useRef()

    const [myName, setMyName] = useState("Me")
    const [name1, setName1] = useState("")
    const [name2, setName2] = useState("")
    const [name3, setName3] = useState("")
    const [name4, setName4] = useState("")
    const [name5, setName5] = useState("")

    const {setMyStream, joinRoom, streams, idsForStreams, leaveCall, replaceStream, peers, update, streamsMap, destroyPeers} = useSocket()
    
    useEffect(() => {
        let videoOptions = localStorage.getItem("video")
        let audioOptions = localStorage.getItem("audio")
        console.log('videoOptions: ' + videoOptions)
        audioOptions = (audioOptions === 'true')
        if (videoOptions == undefined) {
            videoOptions = "camera"
            localStorage.setItem("video", videoOptions)
        }
        if (audioOptions == undefined) {
            console.log('audioOptions undefined')
            audioOptions = false
            localStorage.setItem("audio", audioOptions)
        }
        setMuted(!audioOptions)
        console.log('set muted: ' + muted)
        if (videoOptions == 'camera') {
            setVideo(true)
            navigator.mediaDevices.getUserMedia({ video: true, audio: audioOptions }).then(newStream => {
                // setStream(s)
                console.log(newStream.getVideoTracks())
                console.log(newStream.getAudioTracks())
                setMyStream(newStream)
                myVideo.current.srcObject = newStream
                // video1.current.srcObject = newStream
                // video2.current.srcObject = newStream
                // video3.current.srcObject = newStream
                // video4.current.srcObject = newStream
                // video5.current.srcObject = newStream
                joinRoom(id, newStream)
            })
        } else if (videoOptions == 'screen') {
            setVideo(true)
            setSharingScreen(true)
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: audioOptions }).then(newStream => {
                setMyStream(newStream)
                myVideo.current.srcObject = newStream
                joinRoom(id, newStream)
            })
        } else if (videoOptions == 'no' && audioOptions) {
            setVideo(false)
            navigator.mediaDevices.getUserMedia({ video: false, audio: audioOptions }).then(newStream => {
                console.log(newStream.getVideoTracks())
                console.log(newStream.getAudioTracks())
                setMyStream(newStream)
                myVideo.current.srcObject = newStream
                joinRoom(id, newStream)
            })
        } else if (videoOptions == 'no') {
            console.log('videoOptions no')
            setVideo(false)
            let newStream = new MediaStream()
            setMyStream(newStream)
            myVideo.current.srcObject = newStream
            joinRoom(id, newStream)
        }
        updateStreams()
    }, [])

    
    const updateStreams = () => {
        try {
            console.log('update streams')
            let index = 0
            console.log('streams length: ' + streamsMap.size)
            console.log(streamsMap)
            for (let [key, stream] of streamsMap.entries()) {
                console.log('index: ' + index)
                console.log('key: ' + key)
                console.log(stream)
                if (index == 0) {
                    video1.current.srcObject = streamsMap.get(key)
                    setName1(key)
                }
                else if (index == 1) {
                    video2.current.srcObject = streamsMap.get(key)
                    setName2(key)
                }
                else if (index == 2) {
                    video3.current.srcObject = streamsMap.get(key)
                    setName3(key)
                }
                else if (index == 3) {
                    video4.current.srcObject = streamsMap.get(key)
                    setName4(key)
                }
                else if (index == 4) {
                    video5.current.srcObject = streamsMap.get(key)
                    setName5(key)
                }
                index++
            }
            console.log('actual value')
            console.log(video5.current.srcObject)
            for (let i = index; i < 5; i++) {
                console.log('index to set null: ' + i)
                if (index == 0) {
                    video1.current.srcObject = null
                    setName1('')
                }
                else if (index == 1) {
                    video2.current.srcObject = null
                    setName2('')
                }
                else if (index == 2) {
                    video3.current.srcObject = null
                    setName3('')
                }
                else if (index == 3) {
                    video4.current.srcObject = null
                    setName4('')
                }
                else if (index == 4) {
                    video5.current.srcObject = null
                    setName5('')
                }
            }
        } catch (e) {
            console.log('error: ')
            console.log(e)
        }
    }

    const showStreams = () => {
        for (let peer of peers) {
            console.log('streams: ')
            console.log(peer.streams)
            for (let stream of peer.streams) {
                console.log('tracks: ')
                console.log(stream.getVideoTracks())
            }
        }
    }
    
    useEffect(() => {
        updateStreams()
    }, [peers])

    const handleLeave = () => {
        leaveCall(id)
    }

    const handleShareScreen = () => {
        if (!sharingScreen) {
            localStorage.setItem("video", "screen")
            setSharingScreen(true)
            window.location.reload()
        } else if (sharingScreen) {
            localStorage.setItem("video", "camera")
            setSharingScreen(false)
            window.location.reload()
        }
        
        // navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(newStream => {
        //     setStream(newStream)
        //     // console.log(newStream)
        //     myVideo.current.srcObject = newStream
        //     // replaceStream(newStream, id)
        //     destroyPeers()
        //     joinRoom(id, newStream)
        // })
    }

    const handleMute = () => {
        if (muted) {
            setMuted(false);
            localStorage.setItem("audio", true)
            console.log('set audio true')
            window.location.reload()
        } else if (!muted) {
            setMuted(true)
            localStorage.setItem("audio", false)
            window.location.reload()
        }
    }

    const handleVideo = () => {
        if (video) {
            setVideo(false)
            localStorage.setItem("video", 'no')
            window.location.reload()
        } else if (!video) {
            setVideo(true)
            localStorage.setItem("video", 'camera')
            window.location.reload()
        }
    }
    
    return (
        <div className="full-height flex-container direction space-between-jc background">
            <div className="full-width max-width-vw">
                <div className="margin-10">
                    <div className="video-row">
                        <div className="video-card">
                            <video className="small-video" playsInline autoPlay ref={myVideo} ></video>
                            <p className="video-card-name-in-corner">{myName}</p>
                        </div>
                        
                        <div className="video-card">
                            <video className="small-video" playsInline autoPlay ref={video1}></video>
                            <p className="video-card-name-in-corner">{name1}</p>
                        </div>
                        <div className="video-card">
                            <video className="small-video" playsInline autoPlay ref={video2}></video>
                            <p className="video-card-name-in-corner">{name2}</p>
                        </div>
                    </div>
                    <div className="video-row margin-top-5">
                        <div className="video-card">
                            <video className="small-video" playsInline autoPlay ref={video3}></video>
                            <p className="video-card-name-in-corner">{name3}</p>
                        </div>
                        <div className="video-card">
                            <video className="small-video" playsInline autoPlay ref={video4}></video>
                            <p className="video-card-name-in-corner">{name4}</p>
                        </div>
                        <div className="video-card">
                            <video className="small-video" playsInline autoPlay ref={video5}></video>
                            <p className="video-card-name-in-corner">{name5}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            

            <Nav className="navbar">
                <Nav.Item className="width-300 flex-container">
                    <Button className="navButton" onClick={handleMute} variant={!muted ? 'danger' : 'primary'}>{!muted ? 'Mute' : 'Unmute'}</Button>
                    <Button className="navButton" onClick={handleVideo} variant={!video ? 'primary' : 'danger'}>{!video ? 'Start Video' : 'Stop Video'}</Button>
                </Nav.Item>
                <Nav.Item>
                    <Button className="navButton" onClick={handleShareScreen} variant={!sharingScreen ? 'success' : 'danger'}>{!sharingScreen ? 'Share Screen' : 'Stop Sharing'}</Button>
                </Nav.Item>
                <Nav.Item className="width-200 flex-container justify-content-end">
                    <Button className="navButton" onClick={handleLeave} variant="danger">Leave</Button>
                </Nav.Item>
            </Nav>

        </div>
    )
}

export default Room