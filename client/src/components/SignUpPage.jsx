import React from 'react'
import SignUp from './SignUp'
import { Container } from 'react-bootstrap'

const SignUpPage = () => {
    return (
    <Container
    className="d-flex align-items-center justify-content-center"
    style={{minHeight: "100vh"}}
    >
        <SignUp />   
    </Container>        
  )
}

export default SignUpPage