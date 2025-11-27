import Navbar from "../components/Navbar.jsx";
import WelcomeHero from "../components/WelcomeHero.jsx";
import HomeSections from "../components/HomeSections.jsx";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <WelcomeHero />

      <div id="how-it-works"></div>
      <HomeSections />
    </main>
  );
}
