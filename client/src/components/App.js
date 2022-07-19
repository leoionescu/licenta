import '../App.css';
import Home from './Home';
import Room from './Room';
import LogIn from './LogIn';
import SignUp from './SignUp'; 
import { BrowserRouter as Router, Routes, Route, Switch} from 'react-router-dom'
import AuthProvider from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';
import ForgotPassword from './ForgotPassword';
import SocketProvider from '../context/SocketContext';


function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes> 
            <Route path="/login" exact element={<LogIn/>}></Route>
            <Route path="/signup" exact element={<SignUp />}></Route>
            <Route path="/forgot-password" exact element={<ForgotPassword />}></Route>
            <Route exact path='/' element={<PrivateRoute/>}>
              <Route path="/" exact element={<Home />}></Route>
            </Route>
            <Route path="/:id" exact element={<Room/>}></Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>  
    </Router>
  );
}

export default App;
