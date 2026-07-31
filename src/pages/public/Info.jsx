export default function Info() {
  return (
    <div>
      <header className="bg-surface-container-lowest mb-12">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-24 pb-16">
          <span className="inline-flex items-center gap-2 text-label-bold uppercase tracking-widest text-primary mb-4">
            <span className="w-8 h-px bg-primary" aria-hidden="true" />
            Info
          </span>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-xl uppercase leading-none mb-6 text-on-surface">
            Acerca de Snakko
          </h1>
        </div>
      </header>

      <div className="px-margin-mobile md:px-margin-desktop pb-24 max-w-container-max mx-auto">
        <div className="max-w-3xl mx-auto flex flex-col gap-10">
          <p className="text-body-lg text-on-surface/80">
            Snakko es un proyecto de comida rápida enfocado en ofrecer hamburguesas,
            pollo broster, papas fritas y otras opciones de nuestro menú, con especial
            atención a la rapidez del servicio, el sabor y una buena experiencia para
            quien nos visita.
          </p>

          <div>
            <h2 className="font-headline text-headline-md uppercase leading-none mb-4 text-on-surface">
              Qué puedes hacer en la app
            </h2>
            <ul className="flex flex-col gap-3 text-body-md text-tertiary">
              <li>
                Explorar la carta completa organizada por categorías (entradas,
                hamburguesas, pollo broster, papas fritas, postres y bebidas).
              </li>
              <li>
                Consultar cada plato con su descripción, precio e imagen antes de
                decidir.
              </li>
              <li>
                Crear una cuenta y reservar una mesa eligiendo la fecha y la franja
                horaria que prefieras.
              </li>
              <li>
                Gestionar tus propias reservas: consultarlas o cancelarlas cuando lo
                necesites.
              </li>
            </ul>
          </div>

          <p className="text-body-lg text-on-surface/80">
            El objetivo de este proyecto es ofrecer una experiencia digital simple,
            rápida y atractiva para descubrir nuestra carta y reservar tu mesa,
            combinando un buen diseño de interfaz con una navegación intuitiva.
          </p>

          <p className="text-body-md text-tertiary border-t border-surface-variant pt-8">
            Desarrollado por{' '}
            <a
              href="https://javiercb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:brightness-125 transition-all font-bold"
            >
              Javier Contreras
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
