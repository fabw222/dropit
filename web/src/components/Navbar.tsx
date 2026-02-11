import { ConnectButton } from "@mysten/dapp-kit";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">DropIt</Link>
      <div className="navbar-links">
        <Link to="/my">My Videos</Link>
        <ConnectButton />
      </div>
    </nav>
  );
}
