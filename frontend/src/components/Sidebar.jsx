import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li>
            <NavLink to="/day1" className={({ isActive }) => isActive ? 'active' : ''}>
              Day 1
            </NavLink>
          </li>
          <li>
            <NavLink to="/day2" className={({ isActive }) => isActive ? 'active' : ''}>
              Day 2
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
