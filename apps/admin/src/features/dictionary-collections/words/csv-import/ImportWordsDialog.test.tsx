import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { apiClient } from '../../../../api/client';
import { ImportWordsDialog } from './ImportWordsDialog';

jest.mock('../../../../api/client', () => ({
  apiClient: { post: jest.fn() },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const IMPORT_URL = '/admin/dictionary-collections/col1/words/import';

function csvFile(text: string) {
  const file = new File([text], 'words.csv', { type: 'text/csv' });
  // jsdom's File has no arrayBuffer(); the dialog reads the file through it.
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => new TextEncoder().encode(text).buffer,
  });
  return file;
}

function renderDialog(existingWords: string[] = []) {
  const onClose = jest.fn();
  const utils = renderWithProviders(
    <ImportWordsDialog open onClose={onClose} collectionId="col1" existingWords={existingWords} />,
  );
  return { ...utils, onClose };
}

async function upload(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.upload(screen.getByTestId('csv-file-input'), csvFile(text));
  await screen.findByText('words.csv');
}

describe('ImportWordsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('previews parsed rows and imports the ready ones', async () => {
    const user = userEvent.setup();
    mockedApiClient.post.mockResolvedValue({ data: { created: 2, skipped: 0 } });
    const { queryClient } = renderDialog(['mlijeko']);
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    await upload(
      user,
      'Hrvatski;Русский;Українська;English\nkruh;хлеб;хліб;bread\nvoda;вода;вода;water\nmlijeko;молоко;молоко;milk\n',
    );

    expect(screen.getByLabelText('Line 2 Hrvatski')).toHaveValue('kruh');
    expect(screen.getByText('2 ready')).toBeInTheDocument();
    expect(screen.getByText('Already in collection')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Import 2 words' }));

    expect(await screen.findByText(/Imported 2 words\. Skipped 1/)).toBeInTheDocument();
    expect(mockedApiClient.post).toHaveBeenCalledTimes(1);
    expect(mockedApiClient.post).toHaveBeenCalledWith(IMPORT_URL, {
      words: [
        { wordHr: 'kruh', translationRu: 'хлеб', translationUk: 'хліб', translationEn: 'bread' },
        { wordHr: 'voda', translationRu: 'вода', translationUk: 'вода', translationEn: 'water' },
      ],
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin-collection-words', 'col1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin-dictionary-collections'] });
  });

  it('blocks the import until an invalid row is fixed, and sends the edited value', async () => {
    const user = userEvent.setup();
    mockedApiClient.post.mockResolvedValue({ data: { created: 1, skipped: 0 } });
    renderDialog();

    await upload(user, 'kruh,хлеб,хліб,');

    expect(screen.getByText('1 with errors')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import 0 words' })).toBeDisabled();

    await user.type(screen.getByLabelText('Line 1 English'), 'bread');

    await user.click(screen.getByRole('button', { name: 'Import 1 word' }));
    await screen.findByText(/Imported 1 word\./);
    expect(mockedApiClient.post).toHaveBeenCalledWith(IMPORT_URL, {
      words: [
        { wordHr: 'kruh', translationRu: 'хлеб', translationUk: 'хліб', translationEn: 'bread' },
      ],
    });
  });

  it('removes a row from the preview', async () => {
    const user = userEvent.setup();
    renderDialog();

    await upload(user, 'kruh,хлеб,хліб,bread\nvoda,вода,вода,water');
    await user.click(screen.getByRole('button', { name: 'Remove line 1' }));

    expect(screen.queryByLabelText('Line 1 Hrvatski')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import 1 word' })).toBeEnabled();
  });

  it('sends large files in batches of 500 rows', async () => {
    const user = userEvent.setup();
    mockedApiClient.post.mockImplementation(async (_url, body) => ({
      data: { created: (body as { words: unknown[] }).words.length, skipped: 0 },
    }));
    renderDialog();

    const lines = Array.from({ length: 1201 }, (_, i) => `w${i},ru${i},uk${i},en${i}`);
    await upload(user, lines.join('\n'));
    await user.click(screen.getByRole('button', { name: 'Import 1201 words' }));

    await screen.findByText(/Imported 1201 words\./);
    const sizes = mockedApiClient.post.mock.calls.map(
      ([, body]) => (body as { words: unknown[] }).words.length,
    );
    expect(sizes).toEqual([500, 500, 201]);
  });

  it('reports how far a failed import got', async () => {
    const user = userEvent.setup();
    mockedApiClient.post
      .mockResolvedValueOnce({ data: { created: 500, skipped: 0 } })
      .mockRejectedValueOnce({ response: { data: { message: 'Collection not found' } } });
    renderDialog();

    const lines = Array.from({ length: 600 }, (_, i) => `w${i},ru${i},uk${i},en${i}`);
    await upload(user, lines.join('\n'));
    await user.click(screen.getByRole('button', { name: 'Import 600 words' }));

    expect(
      await screen.findByText(/Import stopped after 500 of 600 rows.*Collection not found/),
    ).toBeInTheDocument();
  });

  it('shows an error for an empty file', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.upload(screen.getByTestId('csv-file-input'), csvFile('\n\n'));

    expect(await screen.findByText('No rows found in the file.')).toBeInTheDocument();
  });

  it('filters the preview to rows with issues', async () => {
    const user = userEvent.setup();
    renderDialog(['voda']);

    await upload(user, 'kruh,хлеб,хліб,bread\nvoda,вода,вода,water');
    await user.click(screen.getByLabelText('Show only rows with issues'));

    const table = screen.getByRole('table');
    await waitFor(() =>
      expect(within(table).queryByLabelText('Line 1 Hrvatski')).not.toBeInTheDocument(),
    );
    expect(within(table).getByLabelText('Line 2 Hrvatski')).toHaveValue('voda');
  });
});
