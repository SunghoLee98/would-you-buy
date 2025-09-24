import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button } from '../styles/shared';

// Styled components for error UI
const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: ${theme.spacing.lg};
`;

const ErrorCard = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing['2xl']};
  max-width: 500px;
  width: 100%;
  text-align: center;

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.xl};
    margin: ${theme.spacing.md};
  }
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.danger};
`;

const ErrorTitle = styled.h2`
  color: ${theme.colors.gray[800]};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.md};
`;

const ErrorMessage = styled.p`
  color: ${theme.colors.gray[600]};
  font-size: ${theme.fontSizes.md};
  line-height: 1.6;
  margin-bottom: ${theme.spacing.xl};
`;

const ErrorDetails = styled.details`
  margin-top: ${theme.spacing.lg};
  text-align: left;

  summary {
    color: ${theme.colors.gray[500]};
    font-size: ${theme.fontSizes.sm};
    cursor: pointer;
    margin-bottom: ${theme.spacing.md};
  }

  pre {
    background: ${theme.colors.gray[100]};
    padding: ${theme.spacing.md};
    border-radius: ${theme.borderRadius.md};
    font-size: ${theme.fontSizes.xs};
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: center;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const RefreshButton = styled(Button)`
  min-width: 120px;
`;

const HomeButton = styled(Button)`
  min-width: 120px;
`;

/**
 * Error fallback component for the Dashboard
 */
function DashboardErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleHomeClick = () => {
    window.location.href = '/';
  };

  const handleRefreshClick = () => {
    resetErrorBoundary();
  };

  // Log error for debugging
  React.useEffect(() => {
    console.error('Dashboard Error Boundary caught an error:', error);
  }, [error]);

  return (
    <ErrorContainer role="alert">
      <ErrorCard>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>문제가 발생했습니다</ErrorTitle>

        <ErrorMessage>
          페이지를 표시하는 중에 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도하거나 페이지를 새로고침해주세요.
        </ErrorMessage>

        <ButtonGroup>
          <RefreshButton variant="primary" onClick={handleRefreshClick}>
            다시 시도
          </RefreshButton>
          <HomeButton variant="secondary" onClick={handleHomeClick}>
            홈으로 이동
          </HomeButton>
        </ButtonGroup>

        {isDevelopment && (
          <ErrorDetails>
            <summary>개발자 정보 (개발 환경에서만 표시)</summary>
            <pre>{error.message}</pre>
            {error.stack && <pre>{error.stack}</pre>}
          </ErrorDetails>
        )}
      </ErrorCard>
    </ErrorContainer>
  );
}

/**
 * Generic error fallback component
 */
function GenericErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Something went wrong</h3>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

/**
 * Dashboard-specific Error Boundary wrapper
 */
export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={DashboardErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Dashboard Error Boundary:', {
          error: error.message,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        });

        // Send error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error, { extra: errorInfo });
        }
      }}
      onReset={() => {
        // Clear any cached state that might be causing the error
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              if (name.includes('voting-data')) {
                caches.delete(name);
              }
            });
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Generic Error Boundary for components
 */
export function ComponentErrorBoundary({
  children,
  fallback
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={fallback || GenericErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Component Error Boundary:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<FallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ComponentErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to manually trigger error boundary
 */
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    throw error;
  }, []);
}

export default DashboardErrorBoundary;