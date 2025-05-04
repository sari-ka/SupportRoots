import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Individual_header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('individualUser');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    // Check auth on initial load
    checkAuth();

    // Set up listener for storage changes
    window.addEventListener('storage', checkAuth);

    // Clean up listener
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('individualUser');
    setUser(null);
    navigate('/individual/login');
  };

  return (
    <div className="mt-3 ms-3">
      <ul className="nav d-flex justify-content-between align-items-center">
        <p className="display-6">SupportRoots</p>
        <div className="d-flex align-items-center">
          {/* Always show these links */}
          <li className="nav-item">
            <Link className="nav-link fs-5" to="villages">Villages</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link fs-5" to="trusts">Trusts</Link>
          </li>
          
          {/* Conditional links */}
          {user ? (
            <>
              <li className="nav-item">
                <Link className="nav-link fs-5" to={`profile/${user.username}`}>Profile</Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-outline-danger ms-3" onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <Link className="nav-link fs-5" to="login">Login</Link>
            </li>
          )}
        </div>
      </ul>
      <Outlet />
    </div>
  );
}

export default Individual_header;