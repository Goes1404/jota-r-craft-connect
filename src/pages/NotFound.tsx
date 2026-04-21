import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="text-center space-y-6 max-w-lg mx-auto px-4">
          <div className="space-y-2">
            <h1 className="text-6xl font-serif font-bold text-foreground">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Página não encontrada</h2>
          </div>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Ops! A página que você está procurando não existe. 
            Que tal explorar nossa coleção de acessórios únicos?
          </p>
          
          <div className="space-y-3">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8">
                Voltar ao Início
              </Button>
            </Link>
            <Link to="/produtos">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium px-8">
                Ver Acessórios
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
