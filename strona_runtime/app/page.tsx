import Header from "../components/Header";
import Hero from "../components/Hero";
import About from "../components/About";
import Menu from "../components/Menu";
import Gallery from "../components/Gallery";
import Testimonials from "../components/Testimonials";
import ReservationCTA from "../components/ReservationCTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header />
      <Hero />
      <About />
      <Menu />
      <Gallery />
      <Testimonials />
      <ReservationCTA />
      <Footer />
    </main>
  );
}
