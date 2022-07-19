import React, { useRef, useState} from 'react'
import { Form, Button, Card, Container, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css'

const SignUp = () => {
    const navigate = useNavigate()
    const emailRef = useRef()
    const passwordRef = useRef()
    const passwordConfirmRef = useRef()
    const { signup } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match')
        }

        try {
            setError('')
            setLoading(true)
            let response = await signup(emailRef.current.value, passwordRef.current.value)
            if (response == 'success') {
                navigate('/')
            } else {
                setError(response)
            }
        } catch (e) {
            setError('Failed to create an account')
        }
        setLoading(false)
    }

    return (
        <div className="background overflow-hidden">
        <Container
        className="d-flex align-items-center justify-content-center"
        style={{minHeight: "100vh"}}
        >
        <div className="w-100" style={{maxWidth: "400px"}}>
            <Card className="border-2 border-warning">
                <Card.Body className="background-dark">
                    <h2 className="text-center mb-4 yellow-text">Sign Up</h2>
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
                        <Form.Group id="pasword-confirm" className="mt-3">
                            <Form.Label className="yellow-text w-100">Password Confirmation</Form.Label>
                            <Form.Control type="password" ref={passwordConfirmRef} required className="w-100" bsPrefix="input"></Form.Control>
                        </Form.Group>
                        <Button disabled={loading} className="w-100 mt-4 mb-2" type="submit" variant="warning">Sign Up</Button>
                    </Form>
                </Card.Body>
            </Card>
            <div className="w-100 text-center mt-2 yellow-text">
                Already have an account? <Link to="/login" className="white-text">Log In</Link>
            </div>
            </div>
    </Container>        
    </div>
    )
}

export default SignUp