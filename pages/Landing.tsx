import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, MessageSquare, ArrowRight } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            
            {/* Separador diagonal para vista de escritorio */}
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Mejora tu entorno,</span>{' '}
                  <span className="block text-blue-600 xl:inline">reporta y participa.</span>
                </h1>
                <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  TuBarrio es la plataforma que conecta a ciudadanos con las soluciones. Reporta baches, alumbrado, seguridad y más. Juntos hacemos una mejor ciudad.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link to="/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                      Comenzar
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to="/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10">
                      Ver reportes
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1920&q=80"
            alt="Ciudad"
          />
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <p className="text-base text-blue-600 font-semibold tracking-wide uppercase">Cómo funciona</p>
            <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Participación ciudadana simplificada
            </h3>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-lg leading-6 font-medium text-slate-900">1. Identifica</h4>
                <p className="mt-2 text-base text-slate-500">
                  Encuentra un problema en tu barrio: baches, basura, falta de luz o inseguridad.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                  <MessageSquare size={24} />
                </div>
                <h4 className="text-lg leading-6 font-medium text-slate-900">2. Reporta</h4>
                <p className="mt-2 text-base text-slate-500">
                  Sube una foto, describe el problema y ubícalo en el mapa desde la app.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                  <Users size={24} />
                </div>
                <h4 className="text-lg leading-6 font-medium text-slate-900">3. Soluciona</h4>
                <p className="mt-2 text-base text-slate-500">
                  Las autoridades y vecinos dan seguimiento hasta que el problema se resuelve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;