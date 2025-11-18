import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light p-0">
        <div className="container">
          <Link to="/" className="navbar-brand">AI Challenge</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsMain" aria-controls="navbarsMain" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarsMain">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item p-1"><Link to="/day5" className="nav-link">Day5</Link></li>
              <li className="nav-item p-1"><Link to="/day4" className="nav-link">Day4</Link></li>
              <li className="nav-item dropdown p-1">
                <a className="nav-link dropdown-toggle" href="#" id="otherDaysDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Other days
                </a>
                <ul className="dropdown-menu" aria-labelledby="otherDaysDropdown">
                  <li><Link to="/day3" className="dropdown-item">Day3</Link></li>
                  <li><Link to="/day2" className="dropdown-item">Day2</Link></li>
                  <li><Link to="/day1" className="dropdown-item">Day1</Link></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        {children}
      </main>
    </>
  );
}

export default Layout;
