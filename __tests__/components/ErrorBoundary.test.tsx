import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ErrorBoundary } from '../../src/app/ErrorBoundary';

const GoodComponent = () => <Text>All systems nominal</Text>;

const ProblemChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test explosion occurred!');
  }
  return <Text>Recovered child component</Text>;
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error during expected error throwing tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('1a: renders children when no error', async () => {
    const { getByText, queryByTestId } = await render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );

    expect(getByText('All systems nominal')).toBeTruthy();
    expect(queryByTestId('error-boundary-fallback')).toBeNull();
  });

  test('1b: renders error screen when child throws', async () => {
    const { getByTestId, queryByText } = await render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByTestId('error-boundary-title')).toBeTruthy();
    expect(queryByText('Recovered child component')).toBeNull();
  });

  test('1c: shows error message text', async () => {
    const { getByTestId, getByText } = await render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByTestId('error-boundary-message')).toBeTruthy();
    expect(getByText('Test explosion occurred!')).toBeTruthy();
  });

  test('1d: Try Again button calls reset and restores component tree', async () => {
    let shouldFail = true;

    const DynamicChild = () => {
      if (shouldFail) {
        throw new Error('Intermittent error');
      }
      return <Text>Working fine after reset</Text>;
    };

    const { getByTestId, getByText, queryByTestId } = await render(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>,
    );

    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('Intermittent error')).toBeTruthy();

    // Fix the issue
    shouldFail = false;

    // Press Try Again
    const retryBtn = getByTestId('button-try-again');
    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(queryByTestId('error-boundary-fallback')).toBeNull();
    expect(getByText('Working fine after reset')).toBeTruthy();
  });
});
