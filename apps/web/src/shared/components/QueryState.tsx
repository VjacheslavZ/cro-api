import { ErrorAlert } from '@/components/ErrorAlert';
import { Spinner } from '@/components/Spinner';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
}

export function QueryState({ isLoading, isError }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8">
        <ErrorAlert />
      </div>
    );
  }

  return null;
}
