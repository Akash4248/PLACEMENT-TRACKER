import React from "react";
import { Link } from "react-router-dom";
import logger from "../utils/logger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logger.error("React error boundary caught an error", {
      error,
      info,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-canvas p-6 text-center">
          <div className="max-w-md rounded-2xl border border-border bg-white p-8 shadow-card">
            <h1 className="text-2xl font-bold text-ink">Something went wrong.</h1>
            <p className="mt-2 text-sm text-muted">
              The page ran into an unexpected issue. Your data is safe.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
              <Link
                className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-ink"
                to="/dashboard"
              >
                Go Dashboard
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
