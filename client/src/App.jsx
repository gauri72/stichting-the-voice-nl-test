import { Route, Routes } from "react-router-dom";
import Header from "./components/layout/Header";
import HomePage from "./components/home/HomePage";

function EmptyPage() {
  return null;
}

export default function App() {
  return (
    <main>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<EmptyPage />} />
        <Route path="/events" element={<EmptyPage />} />
        <Route path="/sponsorship" element={<EmptyPage />} />
        <Route path="/membership" element={<EmptyPage />} />
        <Route path="/donate" element={<EmptyPage />} />
        <Route path="/contact" element={<EmptyPage />} />
      </Routes>
    </main>
  );
}
