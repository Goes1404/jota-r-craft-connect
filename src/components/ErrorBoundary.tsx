import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-6" />
          <h1 className="text-2xl font-bold mb-3">Algo deu errado</h1>
          <p className="text-white/40 mb-8 max-w-sm">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary text-black font-bold px-8 rounded-full"
          >
            Recarregar Página
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
