import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInAnonymously, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css'; // Import the specific CSS for the login page

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error logging in: ', error);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error with anonymous login: ', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error with Google login: ', error);
    }
  };

  return (
    <div className="login-page">
      <div className="heading">Sign in</div>
      <div className="form-group">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      </div>
      <div className="form-group">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      </div>
      <div className="forgot-password">Forgot password?</div>
      <button className="btn" onClick={handleLogin}>Sign In</button>
      <div className="social-login">
        <div className="divider"><span>or</span></div>
        <button className="google" onClick={handleGoogleLogin}>Sign in with Google</button>
        <button className="anonymous" onClick={handleAnonymousLogin}>Sign in Anonymously</button>
      </div>
      <div className="new-account">New to BookHub? <button className="join-now" onClick={() => {}} style={{ color: '#0073b1', border: 'none', background: 'none', cursor: 'pointer' }}>Join now</button></div>
    </div>
  );
};

export default Login;
