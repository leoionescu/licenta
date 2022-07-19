import React, { useContext, useState, useEffect } from 'react'
import { auth } from '../firebase'
import { timeout } from '../utils'

const AuthContext = React.createContext()

export const useAuth = () => {
    return useContext(AuthContext)
}

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState({})
    // let currentUser = {}
    const [loading, setLoading] = useState()

    const signup = async (email, password) => {
        try {
            let response = await fetch('/users', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            })
            if (response.status === 201) {
                auth.createUserWithEmailAndPassword(email, password)
                return 'success'
            } else {
                if (response.status == 500) {
                    let message = await response.json()
                    if (message == 'email must be unique') message = 'Email already used by another account'
                    return message
                }
            }
        } catch (error) {
            console.log('error: ' + error.message)
            return 'error'
        }
    }

    const login = (email, password) => {
        return auth.signInWithEmailAndPassword(email, password)
    }

    const logout = () => {
        return auth.signOut()
    }

    const resetPassword = (email) => {
        return auth.sendPasswordResetEmail(email)
    }
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
            // console.log('user updated')
            setCurrentUser(user)
            // currentUser = user
            setLoading(false)
        })
    }, [])

    const value = { currentUser, login, signup, logout, resetPassword }

  return (
      <AuthContext.Provider value={value}>
          {!loading && children}
      </AuthContext.Provider>
  )
}

export default AuthProvider