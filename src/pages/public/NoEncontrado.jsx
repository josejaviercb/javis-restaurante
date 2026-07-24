import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-headline text-headline-xl text-primary-container leading-none mb-4">
          404
        </p>
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase mb-4">
          Página no encontrada
        </h1>
        <p className="text-body-lg text-tertiary mb-10">
          La página que buscas no existe o se ha movido.
        </p>
        <Link to="/" className="btn-primario">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
