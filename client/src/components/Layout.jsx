import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="navbar">
        <span className="brand">🩸 Sweety</span>
        <nav>
          <NavLink to="/readings">Readings</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </nav>
        <div className="user">
          <span>Hi, {user.name}</span>
          <button className="btn-link" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
