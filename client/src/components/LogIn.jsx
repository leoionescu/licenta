import React, { useRef, useState} from 'react'
import {Form, Button, Card, Container, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css'

const LogIn = () => {
    const navigate = useNavigate()
    const emailRef = useRef()
    const passwordRef = useRef()
    const { login } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setError('')
            setLoading(true)
            await login(emailRef.current.value, passwordRef.current.value)
            navigate('/')
        } catch (e) {
            setError('Failed to sign in')
        }   
        setLoading(false)
    }

    return (
    <div className="background">
        <Container
        className="d-flex align-items-center justify-content-center"
        style={{minHeight: "100vh"}}
        >
        <div className="w-100" style={{maxWidth: "400px"}}>
            <Card className="border-2 border-warning">
                <Card.Body className="background-dark">
                    <h2 className="text-center mb-4 yellow-text">Log In</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}> 
                        <Form.Group id="email">
                            <Form.Label className="yellow-text w-100">Email</Form.Label>
                            <Form.Control type="email" ref={emailRef} required className="w-100" bsPrefix="input"></Form.Control>
                        </Form.Group>
                        <Form.Group id="pasword" className="mt-3">
                            <Form.Label className="yellow-text w-100">Password</Form.Label>
                            <Form.Control type="password" ref={passwordRef} required className="w-100" bsPrefix="input"></Form.Control>
                        </Form.Group>
                        <Button disabled={loading} className="w-100 mt-4" type="submit" variant="warning">Log In</Button>
                        </Form>
                        <div className="w-100 text-center mt-3">
                            <Link to="/forgot-password" className="white-text">Forgot Passwod</Link>
                        </div>
                </Card.Body>
            </Card>
            <div className="w-100 text-center mt-2 yellow-text">
                Don't have an account? <Link to="/signup" className="white-text">Sign Up</Link>
            </div>
            </div>
            </Container>
            </div>
    )
}

export default LogIn