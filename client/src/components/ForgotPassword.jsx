import React, { useRef, useState} from 'react'
import {Form, Button, Card, Container, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const emailRef = useRef()
    const { resetPassword } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setMessage('')
            setError('')
            setLoading(true)
            await resetPassword(emailRef.current.value)
            setMessage('Password recovery email sent.')
        } catch (e) {
            setError('Failed to reset password')
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
                    <h2 className="text-center mb-4 yellow-text">Forgot Password</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {message && <Alert variant="success">{message}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group id="email" className="yellow-text w-100">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" ref={emailRef} required className="w-100" bsPrefix="input"></Form.Control>
                        </Form.Group>
                        <Button disabled={loading} className="w-100 mt-4" type="submit" variant="warning">Reset Password</Button>
                        </Form>
                        <div className="w-100 text-center mt-3 white-text">
                            <Link to="/login" className="white-text">Log In</Link>
                        </div>
                </Card.Body>
            </Card>
            <div className="w-100 text-center mt-3 yellow-text">
                Don't have an account? <Link to="/signup" className="white-text">Sign Up</Link>
            </div>
            </div>
            </Container>
        </div>
    )
}

export default ForgotPassword