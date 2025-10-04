import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import homebg from "../assets/homepagebg.png";

export default function Homepage() {
  const navigate = useNavigate();

  return (
    
    <div
      className="homepage-wrapper"
      style={{
        backgroundImage: `url(${homebg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh"
      }}
    >
    {/* Logo */}
    <img src={logo} alt="ASLingo Logo" className="logo" />

    {/* Centered buttons */}
    <div className="homepage-container">
      <div className="centered-title">
        <h1>WANT TO LEARN ASL?</h1>
      </div>
      <div className="centered-text">
        <p>Jump into <strong>ASLingo</strong>, the gamified way to learn <br />
        <strong>American Sign Language!</strong> Get instant feedback, crush mini-games, <br />
        and level up your skills. <strong>No matter your level, this is your all-in-one ASL platform.</strong></p>
      </div>
      <div className="homepage-buttons">
         <button className="frontpage-btn" onClick={() => navigate("/login")}>Login</button>
         <button className="frontpage-btn" onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </div>
  </div>

  );
}


/*// src/components/Login.jsx
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

function Homepage() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  // Optional: Sync user with MongoDB when logged in
  useEffect(() => {
    const syncUser = async () => {
      if (!isAuthenticated) return;

      const token = await getAccessTokenSilently();

      const res = await fetch("http://localhost:4000/api/sync-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Synced user:", data);
    };

    syncUser();
  }, [isAuthenticated, getAccessTokenSilently]);

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="app">
      <h1>ASLingo</h1>

      {!isAuthenticated ? (
        <>
          <button onClick={() => loginWithRedirect()}>Log In</button>
          <button
            onClick={() =>
              loginWithRedirect({
                authorizationParams: {
                  screen_hint: "signup",
                },
              })
            }
          >
            Sign Up
          </button>
        </>
      ) : (
        <>
          <p>Welcome, {user?.name}!</p>
          <img src={user?.picture} alt={user?.name} style={{ borderRadius: "50px" }} />
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Log Out
          </button>
        </>
      )}
    </div>
  );
}

export default Login;
*/