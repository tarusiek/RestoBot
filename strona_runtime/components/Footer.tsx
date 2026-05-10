export default function Footer() {
  return (
    <footer className="bg-background pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <a href="#" className="text-xl font-heading font-bold tracking-widest uppercase text-white mb-6 block">
              Bistro<span className="text-primary">Warszawa</span>
            </a>
            <p className="text-muted-foreground font-light text-sm leading-relaxed max-w-sm">
              Nowoczesna kuchnia w sercu Warszawy. Tworzymy miejsca z duszą, gdzie smak i design przenikają się nawzajem.
            </p>
          </div>

          <div>
            <h4 className="text-white font-heading tracking-wider mb-6">Kontakt</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-light">
              <li>Al. Jerozolimskie 47</li>
              <li>00-697 Warszawa</li>
              <li className="pt-2 text-primary">22 854 17 48</li>
              <li>rezerwacje@bistrowarszawa.pl</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-heading tracking-wider mb-6">Godziny Otwarcia</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-light">
              <li className="flex justify-between">
                <span>Pon - Czw</span>
                <span>12:00 - 22:00</span>
              </li>
              <li className="flex justify-between">
                <span>Pią - Sob</span>
                <span>12:00 - 23:00</span>
              </li>
              <li className="flex justify-between">
                <span>Niedziela</span>
                <span>12:00 - 21:00</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-heading tracking-wider mb-6">Social Media</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-light">
              <li>
                <a href="https://instagram.com/bistrowarszawacafe" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  TripAdvisor
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground tracking-wider">
            &copy; {new Date().getFullYear()} Bistro Warszawa Cafe. Wszelkie prawa zastrzeżone.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground tracking-wider">
            <a href="#" className="hover:text-white transition-colors">Polityka Prywatności</a>
            <a href="#" className="hover:text-white transition-colors">Regulamin</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
