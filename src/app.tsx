import "./app.css";
import { Route, Routes } from "react-router-dom";
import { NotFound } from "./pages/not-found";
import { Home } from "./pages/home";

export const App = () => {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />
      <Route path="/" element={<Home />} />
      {/* <Route path="/about" element={<About />} /> */}
      {/* <Route path="/settings" element={<Settings />} /> */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};
