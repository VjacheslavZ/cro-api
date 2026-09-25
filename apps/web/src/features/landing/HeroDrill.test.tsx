import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { HeroDrill } from './HeroDrill';
import { DRILL_ITEMS } from './drillItems';

describe('HeroDrill', () => {
  it('accepts a correct answer (case-insensitive, trimmed) and fills the case cell', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeroDrill />);

    await user.type(screen.getByRole('textbox'), `  ${DRILL_ITEMS[0].answer.toUpperCase()} `);
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByRole('status')).toHaveTextContent('Correct · +10 XP');
    expect(screen.getByText('10 XP')).toBeInTheDocument();
    const cells = screen.getAllByRole('listitem');
    expect(cells.find((c) => c.textContent === DRILL_ITEMS[0].caseKey)).toHaveAttribute(
      'data-state',
      'active',
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(cells.find((c) => c.textContent === DRILL_ITEMS[0].caseKey)).toHaveAttribute(
      'data-state',
      'done',
    );
    expect(screen.getByText('2 / 6')).toBeInTheDocument();
  });

  it('shows the right form after a wrong answer and awards no XP', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeroDrill />);

    await user.type(screen.getByRole('textbox'), 'grad{enter}');

    expect(screen.getByRole('status')).toHaveTextContent(`it's ${DRILL_ITEMS[0].answer}`);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('0 XP')).toBeInTheDocument();
  });

  it('ends with a sign-up link after the last item', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeroDrill />);

    for (const item of DRILL_ITEMS) {
      await user.type(screen.getByRole('textbox'), `${item.answer}{enter}`);
      await user.click(screen.getByRole('button', { name: /Next|Finish/ }));
    }

    expect(screen.getByRole('link', { name: 'Start 7 days free' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
