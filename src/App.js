import React, { useState, useEffect } from 'react';
import EditableTable from './components/EditableTable';
import Login from './components/Login';
import { auth } from './firebase';
import './styles.css';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="header">
        <div className="logo">BookHub</div>
        <div className="tagline">Discover, Explore, and Connect with the World of Books</div>
      </div>
      {!user ? (
        <div className="container">
          <Login setUser={setUser} />
        </div>
      ) : (
        <div className="container">
          <EditableTable />
        </div>
      )}
    </div>
  );
};

export default App;