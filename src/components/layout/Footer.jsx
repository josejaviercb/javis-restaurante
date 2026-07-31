import { Link } from 'react-router-dom';
import Icono from '../ui/Icono';

export default function Footer() {
  return (
    <footer className="w-full py-12 border-t-4 border-primary bg-surface-container-lowest">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col items-center md:items-start gap-3">
          <p className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface leading-none">
            SNAKKO
          </p>
          <p className="text-body-md text-tertiary text-center md:text-left">
            © {new Date().getFullYear()} Snakko. Como en casa, pero mejor.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-body-md">
          <Link to="/carta" className="text-tertiary hover:text-primary transition-colors">
            Carta
          </Link>
          <Link to="/reservas" className="text-tertiary hover:text-primary transition-colors">
            Reservas
          </Link>
          <a
            href="tel:+593991234567"
            className="text-tertiary hover:text-primary transition-colors"
          >
            Contacto
          </a>
        </nav>

        <div className="flex gap-4 text-primary">
          <Icono nombre="restaurante" className="w-8 h-8" />
          <Icono nombre="fuego" className="w-8 h-8" />
          <Icono nombre="lugar" className="w-8 h-8" />
        </div>
      </div>
    </footer>
  );
}
