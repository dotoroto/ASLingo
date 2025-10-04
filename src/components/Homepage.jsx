import React from "react";
import { useNavigate } from "react-router-dom";

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to ASLingo</h1>
      <button
        onClick={() => navigate("/login")}
        style={{ marginRight: "10px", padding: "10px 20px" }}
      >
        Login
      </button>
      <button
        onClick={() => navigate("/signup")}
        style={{ padding: "10px 20px" }}
      >
        Sign Up
      </button>
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