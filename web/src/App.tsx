import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import MyVideos from "./pages/MyVideos";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:blobId" element={<Watch />} />
          <Route path="/my" element={<MyVideos />} />
        </Routes>
      </main>
    </div>
  );
}
