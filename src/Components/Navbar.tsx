import { Link } from "react-router-dom";
import { LogoFull } from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <LogoFull height={32} />
        </Link>
        <div className="nav-links">
          <Link to="/#technology" className="nav-link">Technology</Link>
          <Link to="/#solutions" className="nav-link">Solutions</Link>
          <Link to="/#about" className="nav-link">About</Link>
          <Link to="/#explore" className="nav-link">Explore</Link>
          <Link to="/whitepaper" className="nav-cta">Whitepaper</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
