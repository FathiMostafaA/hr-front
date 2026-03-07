import React from 'react';
import { AlertTriangle, RefreshCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import Button from './Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // You could also log the error to an error reporting service here
        console.error('Uncaught React Error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                    <Card className="w-full max-w-2xl border-none shadow-2xl overflow-hidden">
                        <div className="h-2 bg-red-500 w-full" />
                        <CardHeader className="text-center pt-8">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 animate-pulse">
                                <AlertTriangle size={40} />
                            </div>
                            <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">
                                Oops! A technical error occurred
                            </CardTitle>
                            <CardDescription className="text-lg text-slate-500 mt-2">
                                It seems the application encountered an unexpected problem.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                                <Button
                                    variant="accent"
                                    size="lg"
                                    className="w-full sm:w-auto gap-2 py-6 px-8 text-lg font-bold shadow-xl shadow-accent/20"
                                    onClick={() => window.location.reload()}
                                >
                                    <RefreshCcw size={20} />
                                    Reload Page
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="w-full sm:w-auto gap-2 py-6 px-8 text-lg font-bold"
                                    onClick={this.handleReset}
                                >
                                    <Home size={20} />
                                    Go to Home
                                </Button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors mx-auto"
                                >
                                    {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {this.state.showDetails ? 'Hide technical details' : 'Show technical details (for developers)'}
                                </button>

                                {this.state.showDetails && (
                                    <div className="mt-4 p-6 bg-slate-900 rounded-2xl overflow-x-auto border border-slate-800 shadow-inner">
                                        <p className="text-red-400 font-mono text-sm mb-4 font-bold">
                                            {this.state.error && this.state.error.toString()}
                                        </p>
                                        <pre className="text-slate-400 font-mono text-xs leading-relaxed opacity-80">
                                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            <p className="text-center text-slate-400 text-xs font-medium">
                                If the problem persists, please contact technical support.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
