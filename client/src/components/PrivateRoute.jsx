import React from 'react'
import { Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth()
  return currentUser && !loading ? <Outlet/> : <Navigate to="/login"/>
}

export default PrivateRoute