import { Providers } from './Providers.tsx';
import { AppRouter } from './AppRouter.tsx';

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
