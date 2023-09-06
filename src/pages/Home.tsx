import avatar from "../assets/avatar.jpg";
import { Link } from "../components/Link";

export const Home = () => {
  return (
    <div className="app" role="main">
      <header className="app-header">
        {/* <SideBar /> */}
        <img src={avatar} className="app-logo rounded-full" alt="logo" />
        <br />
        <p>
          Now Sasha's gonna edit <code>src/app.tsx</code>...
        </p>
        <p>
          Sasha is building it using{" "}
          {Link(new URL("https://reactjs.org"), "React")},{" "}
          {Link(new URL("https://tailwindcss.com/"), "Tailwind CSS")}, and{" "}
          {Link(new URL("https://www.typescriptlang.org/"), "TypeScript")}.
        </p>
      </header>
    </div>
  );
};
