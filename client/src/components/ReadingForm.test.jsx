import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from './ReadingForm';
import { todayString } from '../utils';

// Fills in the form the way a user would
async function fillForm(user, { slot, value }) {
  if (slot) await user.selectOptions(screen.getByLabelText('Time slot'), slot);
  if (value !== undefined) await user.type(screen.getByLabelText('Glucose (mg/dl)'), value);
}

const submit = (user) => user.click(screen.getByRole('button', { name: 'Add reading' }));

describe('ReadingForm - adding a reading', () => {
  test('shows an error when the value is empty, and does not submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReadingForm onSubmit={onSubmit} />);

    await fillForm(user, { slot: 'after_lunch' });
    await submit(user);

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a glucose value.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test.each(['39', '601', '700', '120.5'])('rejects the value %s', async (value) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReadingForm onSubmit={onSubmit} />);

    await fillForm(user, { slot: 'after_lunch', value });
    await submit(user);

    expect(screen.getByRole('alert')).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('asks for a time slot', async () => {
    const user = userEvent.setup();
    render(<ReadingForm onSubmit={vi.fn()} />);

    await fillForm(user, { value: '120' });
    await submit(user);

    expect(screen.getByRole('alert')).toHaveTextContent('Please select a time slot.');
  });

  test('rejects a date in the future', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReadingForm onSubmit={onSubmit} />);

    // date inputs are easiest to set directly
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2999-01-01' } });
    await fillForm(user, { slot: 'after_lunch', value: '120' });
    await submit(user);

    expect(screen.getByRole('alert')).toHaveTextContent('Date cannot be in the future.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits a valid reading with a number value, then clears the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ReadingForm onSubmit={onSubmit} />);

    await fillForm(user, { slot: 'after_breakfast', value: '135' });
    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith({ date: todayString(), slot: 'after_breakfast', value: 135 });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Glucose (mg/dl)')).toHaveValue(null);
    expect(screen.getByLabelText('Time slot')).toHaveValue('');
  });

  test('shows the error message from the server (e.g. duplicate slot)', async () => {
    const user = userEvent.setup();
    const serverError = { response: { data: { error: 'You already have an After lunch reading for this date.' } } };
    const onSubmit = vi.fn().mockRejectedValue(serverError);
    render(<ReadingForm onSubmit={onSubmit} />);

    await fillForm(user, { slot: 'after_lunch', value: '150' });
    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have an After lunch reading for this date.'
    );
    // the values stay, so the user can fix them
    expect(screen.getByLabelText('Glucose (mg/dl)')).toHaveValue(150);
  });
});

describe('ReadingForm - editing a reading', () => {
  const reading = { id: 7, date: '2026-10-15', slot: 'after_dinner', value: 165 };

  test('is filled in with the reading and can be cancelled', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ReadingForm reading={reading} onSubmit={vi.fn()} onCancel={onCancel} />);

    expect(screen.getByRole('heading', { name: 'Edit reading' })).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-15');
    expect(screen.getByLabelText('Time slot')).toHaveValue('after_dinner');
    expect(screen.getByLabelText('Glucose (mg/dl)')).toHaveValue(165);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  test('saves the changed value', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ReadingForm reading={reading} onSubmit={onSubmit} onCancel={vi.fn()} />);

    const input = screen.getByLabelText('Glucose (mg/dl)');
    await user.clear(input);
    await user.type(input, '170');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith({ date: '2026-10-15', slot: 'after_dinner', value: 170 });
  });
});
