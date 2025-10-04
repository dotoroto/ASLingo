// src/components/Login.jsx
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

function Login() {
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
