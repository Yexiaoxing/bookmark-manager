import { NavLink, Route, Routes } from "react-router-dom";
import Detail from "./pages/Detail";
import Home from "./pages/Home";
import Tags from "./pages/Tags";

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `font-medium ${isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"}`
            }
            end
          >
            Bookmarks
          </NavLink>
          <NavLink
            to="/tags"
            className={({ isActive }) =>
              `font-medium ${isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"}`
            }
          >
            Tags
          </NavLink>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/b/:id" element={<Detail />} />
          <Route path="/tags" element={<Tags />} />
        </Routes>
      </main>
    </div>
  );
}
