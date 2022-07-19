import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Form, Button, Card, Container, Alert, Modal, Toast, Row } from 'react-bootstrap'
import '../styles/Home.css'
import { timeout } from '../utils'
import { computeAddress } from 'ethers/lib/utils';


const Home = () => {
    const navigate = useNavigate()
    const { currentUser, logout, loading } = useAuth()
    const { logoutEvent, setEmail, sendCallRequest, callRequestFrom, setCallRequestFrom, answerCallRequest, callRejected, sendCancelCall } = useSocket()
    const [error, setError] = useState("")
    const [modalError, setModalError] = useState("")
    const [showAddContact, setShowAddContact] = useState(false);
    const [showUserOffline, setShowUserOffline] = useState(false)
    const [showCallingUser, setShowCallingUser] = useState(false)
    const [showJoinRoom, setShowJoinRoom] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [contactName, setContactName] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [contactId, setContactId] = useState("")
    const [contacts, setContacts] = useState([])
    const [filter, setFilter] = useState("alphabetical")

    const emailRef = useRef()
    const nameRef = useRef()
    const audioRef = useRef()
    const roomIdRef = useRef()
    const currentContactNameRef = useRef()


    const handleCloseModal = () => {
        setShowAddContact(false);
        setShowUserOffline(false);
        setShowCallingUser(false);
        setCallRequestFrom(false)
        setShowJoinRoom(false)
        setShowEdit(false)
        setModalError('')
    }


    const getContacts = async () => {
        // console.log('getContacts')
        try {
            let response = await fetch('/contacts/' + currentUser.email)
            if (response.status == 200) {
                response.json().then(async res => {
                    if (filter == 'alphabetical') {
                        res.sort((a, b) => a.name.localeCompare(b.name))
                    } else if (filter == 'recent') {
                        res.sort(function(a,b){
                            return new Date(b.createdAt) - new Date(a.createdAt);
                          });
                    }
                    setContacts(res)
                })
            }
        } catch (e) { }

    }

    const createRoom = async () => {
        let response = await fetch('/createRoom')
        console.log('got response')
        response = await response.json()
        let roomId = response.roomId
        localStorage.setItem("video", "camera")
        localStorage.setItem("audio", false)
        navigate(`/${roomId}`)
    }

    const createContact = async () => {
        let name = nameRef.current.value
        let email = emailRef.current.value
        try {
            let response = await fetch('/contacts/' + currentUser.email, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, name })
            })
            if (response.status === 204) {  setModalError('Contact created.') }
            else if (response.status == 404) {  setModalError('Internal error') }
            else if (response.status == 500) {  setModalError('Internal error') }
        } catch (e) {

        }
        getContacts()
    }

    const updateContact = async () => {
        let name
        try {
            name = currentContactNameRef.current.value
        } catch (e) {
            name = contactName
        }
        let email = contactEmail
        let id = contactId
        console.log('name: ' + name + ', email: ' + email + ', id: ' + id)
        try {
            await deleteContact({ id })
            let response = await fetch('/contacts/' + currentUser.email, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, name })
            })
            getContacts()
        } catch (e) {}
    }

    const deleteContact = async (contact) => {
        try {
            let response = await fetch('/contacts/' + contact.id, {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })
        } catch (e) { }
        getContacts()
    }

    const showAddContactModal = () => {
        setShowAddContact(true)
    }

    const handleLogout = async () => {
        setError('')

        try {
            await logout()
            logoutEvent()
            navigate('/login')
        } catch (e) {
            setError('Logout failed')
        }
    }
    
    useEffect(() => {
        setEmail()
        getContacts()
        let updateContacts = async () => {
            while (true) {
                await timeout(100)
                getContacts()
            }
        }
        // updateContacts()
    }, [currentUser])

    // let contacts = [
    //     {
    //         name: "Alex Jones",
    //         email: "alexjones@gmail.com"
    //     },
    //     {
    //         name: "Harry Maguire",
    //         email: "harrymaguire@gmail.com"
    //     },
    //     {
    //         name: "Phil Bell",
    //         email: "philbell@gmail.com"
    //     },
    //     {
    //         name: "Dan Johnson",
    //         email: "danjohnson@gmail.com"
    //     },
    //     {
    //         name: "Andrew Cruise",
    //         email: "andrewcruise@gmail.com"
    //     }
    // ]
    
    const callContact = (contact) => {
        setContactName(contact.name)
        setContactEmail(contact.email)
        setContactId(contact.id)
        localStorage.setItem("video", "camera")
        localStorage.setItem("audio", false)
        if (contact.isOnline == false) {
            setShowUserOffline(true)
        } else {
            setShowCallingUser(true)
            sendCallRequest(contact.email)
        }
    }

    const answerCall = async () => {
        handleCloseModal()
        let response = await fetch('/createRoom')
        console.log('got response')
        response = await response.json()
        let roomId = response.roomId
        await answerCallRequest(roomId, callRequestFrom)
        let f = async () => {
            await timeout(5000)
            window.location.reload()
        }
        f()
        navigate(`/${roomId}`)
    }

    const rejectCall = async () => {
        handleCloseModal()
        answerCallRequest('rejected', callRequestFrom)
    }

    const cancelCall = async () => {
        handleCloseModal()
        sendCancelCall(contactEmail)
    }

    const showJoinRoomModal = async () => {
        setShowJoinRoom(true)
    }

    const joinRoom = async () => {
        let roomId = roomIdRef.current.value
        navigate(`/${roomId}`)
    }

    const applyFilter = async (value) => {
        console.log('applyFilter')
        setFilter(value)
        if (value == 'alphabetical') {
            contacts.sort((a, b) => a.name.localeCompare(b.name))
        } else if (value == 'recent') {
            contacts.sort(function(a,b){
                return new Date(b.createdAt) - new Date(a.createdAt);
              });
        }
    }

    useEffect(() => {
        if (callRequestFrom == false) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
    }, [callRequestFrom])

    return (
        <Container className="background full-height d-flex flex-column align-items-center" bsPrefix="no-margin">
            <h1 className="text-warning mt-5 mb-5 title">Home</h1>
            <div className="">
                <Button onClick={createRoom} className="mx-3" variant="primary" size="lg">Create a Room</Button>  
                <Button onClick={showAddContactModal} className="mx-3" variant="warning" size="lg">Add contact</Button>  
                <Button onClick={showJoinRoomModal} className="mx-3" variant="success" size="lg">Join a Room</Button>  
            </div>    
            <h2 className="text-warning mt-5 mb-5 subtitle">Contacts</h2>
            
            {contacts.map((contact) => 
                <Container className="d-flex mb-3 px-2 w-75 justify-content-between" bsPrefix="contact" key={contact.name}>
                    <Container className="d-flex justify-content-start">
                        <Row className="" style={{width: '300px'}}><h3 className="text-center">{contact.name}</h3></Row>
                        <Row className="" style={{width: '400px'}}><h3 className="text-center">{contact.email}</h3></Row>
                        <Row className="" style={{width: '200px'}}><h3 className={contact.isOnline ? "text-success text-center" : "text-danger text-center"}>{contact.isOnline ? 'Online' : 'Offline'}</h3></Row>
                    </Container>
                    <div className="width-30 d-flex justify-content-end">
                        <Button className="contact-button" onClick={e => deleteContact(contact)} variant="danger">DELETE</Button>
                        <Button className="contact-button" onClick={e => {
                            setShowEdit(true)
                            setContactName(contact.name)
                            setContactEmail(contact.email)
                            setContactId(contact.id)
                            currentContactNameRef.current.value = contact.name
                        }}>EDIT</Button>
                        <Button className="contact-button" variant="success" onClick={e => callContact(contact)}>CALL</Button>
                    </div>
                </Container>
            )}
            <div className="mt-4">
                <Button onClick={e => applyFilter('alphabetical')} variant={filter == 'alphabetical' ? 'warning' : 'secondary'} className="mx-3" size="lg">Alphabetical</Button>
                <Button onClick={e => applyFilter('recent')} variant={filter == 'recent' ? 'warning' : 'secondary'} className="mx-3" size="lg">Recent</Button>
            </div>
            <div className="mt-4">
                <h3 className="text-secondary">Logged in as {currentUser.email}</h3>
            </div>
            <Button onClick={handleLogout} className="mx-5 mt-4 mb-4" variant="danger">Log Out</Button>
            {showAddContact &&
                <Modal show={showAddContact} onHide={handleCloseModal} centered>
                    <Modal.Header className="background-dark border-0" closeButton>
                    <Modal.Title className="yellow-text">New Contact</Modal.Title>
                    </Modal.Header>
                    <Modal.Body  className="background-dark border-0">
                        {modalError && <Alert variant={modalError == 'Contact created.' ? 'success' : 'danger'}>{modalError}</Alert>}
                        <Form.Label className="yellow-text w-100">Name</Form.Label>
                        <Form.Control type="email" ref={nameRef} required className="w-100" bsPrefix="input"></Form.Control>
                        <Form.Label className="yellow-text w-100 mt-4">Email</Form.Label>
                        <Form.Control type="email" ref={emailRef} required className="w-100" bsPrefix="input"></Form.Control>
                    </Modal.Body>
                    <Modal.Footer  className="background-dark border-0">
                        <Button variant="danger" onClick={handleCloseModal}>
                            Close
                        </Button>
                        <Button variant="warning" onClick={createContact}>
                            Create contact
                        </Button>
                    </Modal.Footer>
                </Modal>
            }

            {showUserOffline &&
                <Modal show={showUserOffline} onHide={handleCloseModal} centered>
                    <Modal.Header className="background-dark border-0" closeButton>
                    <Modal.Title className="yellow-text"></Modal.Title>
                    </Modal.Header>
                    <Modal.Body  className="background-dark border-0">
                        <h2 className="yellow-text w-100 text-center">{contactName != '' ? contactName : 'Contact'} is offline right now.</h2>
                    </Modal.Body>
                    <Modal.Footer  className="background-dark border-0 d-flex flex-column align-items-center">
                        <Button className="w-25 text-center" variant="danger" onClick={handleCloseModal}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            }

            {showCallingUser &&
                <Modal show={showCallingUser} onHide={handleCloseModal} centered>
                    <Modal.Header className="background-dark border-0" closeButton>
                    <Modal.Title className="yellow-text"></Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="background-dark border-0">
                        {!callRejected &&
                            <h2 className="yellow-text w-100 text-center">Calling {contactName}.</h2>
                        }
                        {callRejected && 
                            <h2 className="yellow-text w-100 text-center">Call rejected by {contactName}.</h2>
                        }
                    </Modal.Body>
                    <Modal.Footer  className="background-dark border-0 d-flex flex-column align-items-center">
                        <Button className="w-25 text-center mb-3" variant="danger" onClick={cancelCall}>
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal>
            }

            {callRequestFrom &&
                <Modal show={true} onHide={handleCloseModal} centered>
                    <Modal.Header className="background-dark border-0" closeButton>
                    <Modal.Title className="yellow-text"></Modal.Title>
                    </Modal.Header>
                    <Modal.Body  className="background-dark border-0">
                        <h2 className="yellow-text w-100 text-center">Incoming call from {callRequestFrom}.</h2>
                    </Modal.Body>
                    <Modal.Footer  className="background-dark border-0 d-flex justify-content-center">     
                        <Button className="w-25 text-center mx-4 mb-3" variant="success" onClick={answerCall}>
                            Answer
                        </Button>
                        <Button className="w-25 text-center mx-4 mb-3" variant="danger" onClick={rejectCall}>
                            Reject
                        </Button>
                    </Modal.Footer>
                </Modal>
            }

            {showJoinRoom &&
                <Modal show={showJoinRoom} onHide={handleCloseModal} centered>
                    <Modal.Header className="background-dark border-0" closeButton>
                    <Modal.Title className="yellow-text text-center">Join a Room</Modal.Title>
                    </Modal.Header>
                    <Modal.Body  className="background-dark border-0">
                        <Form.Label className="yellow-text w-100">Room ID</Form.Label>
                        <Form.Control type="email" ref={roomIdRef} required className="w-100" bsPrefix="input"></Form.Control>
                    </Modal.Body>
                    <Modal.Footer  className="background-dark border-0">
                        <Button variant="danger" onClick={handleCloseModal}>
                            Close
                        </Button>
                        <Button variant="warning" onClick={joinRoom}>
                            Join Room
                        </Button>
                    </Modal.Footer>
                </Modal>
            }

            {showEdit &&
                <Modal show={showEdit} onHide={handleCloseModal} centered>
                    <Modal.Header className="background-dark border-0" closeButton>
                        <Modal.Title className="yellow-text">Edit {contactName}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="background-dark border-0">
                    {modalError && <Alert variant={modalError == 'Contact updated.' ? 'success' : 'danger'}>{modalError}</Alert>}
                        <Form.Label className="yellow-text w-100">Name</Form.Label>
                        <Form.Control type="email" ref={currentContactNameRef} placeholder={contactName} required className="w-100" bsPrefix="input"></Form.Control>
                    </Modal.Body>
                    <Modal.Footer  className="background-dark border-0">
                        <Button variant="danger" onClick={handleCloseModal}>
                            Close
                        </Button>
                        <Button variant="warning" onClick={e => {
                            updateContact()
                            setModalError('Contact updated.')
                        }}>
                            Update contact
                        </Button>
                    </Modal.Footer>
                </Modal>
            }

            <audio ref={audioRef} id="myAudio" src="http://www.sousound.com/music/healing/healing_01.mp3" preload="auto"></audio>
        </Container>

        
    )
}

export default Home