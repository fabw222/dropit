import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import MyVideos from "./pages/MyVideos";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/watch/:blobId" element={<Watch />} />
      <Route path="/my" element={<MyVideos />} />
    </Routes>
  );
}
