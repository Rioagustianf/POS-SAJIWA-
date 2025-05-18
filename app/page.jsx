import Link from "next/link";
import Login from "./login/page";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Login />
    </div>
  );
}
