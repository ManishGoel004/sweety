import { useState } from 'react';
import { SLOTS, MIN_VALUE, MAX_VALUE } from '../constants';
import { todayString } from '../utils';
import { validateReading } from '../validation';
import { getErrorMessage } from '../api';

/**
 * Form to add a new reading, or edit one when `reading` is passed.
 * onSubmit({ date, slot, value }) should save it; if it throws,
 * the server's error message is shown in the form.
 */
export default function ReadingForm({ reading, onSubmit, onCancel }) {
  const isEditing = Boolean(reading);
  const [date, setDate] = useState(reading?.date || todayString());
  const [slot, setSlot] = useState(reading?.slot || '');
  const [value, setValue] = useState(reading ? String(reading.value) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const message = validateReading({ date, slot, value });
    setError(message);
    if (message) return;

    setSaving(true);
    try {
      await onSubmit({ date, slot, value: Number(value) });
      if (!isEditing) {
        // ready for the next reading on the same date
        setSlot('');
        setValue('');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate aria-label="Reading form">
      <h2>{isEditing ? 'Edit reading' : 'Add a reading'}</h2>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="form-row">
        <div>
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} max={todayString()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="slot">Time slot</label>
          <select id="slot" value={slot} onChange={(e) => setSlot(e.target.value)}>
            <option value="">Select a time slot</option>
            {Object.entries(SLOTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="value">Glucose (mg/dl)</label>
          <input
            id="value"
            type="number"
            inputMode="numeric"
            min={MIN_VALUE}
            max={MAX_VALUE}
            step="1"
            placeholder="e.g. 110"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add reading'}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
