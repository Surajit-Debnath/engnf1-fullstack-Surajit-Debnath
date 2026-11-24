import { useState } from 'react';
import type { ChangeEvent } from 'react';

import axios from 'axios';

import { Upload, X, FileJson, AlertCircle, CircleCheck } from 'lucide-react';

import { Button } from '../ui/Button';

import { importTickets } from '../../services/ticketService';

import type { ImportTicket, ImportTicketResponse } from '../../types/ticket';

interface TicketImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const example = JSON.stringify(
  {
    tickets: [
      {
        externalId: 'TKT-001',
        subject: 'Unable to login',
        body: 'I cannot access my account.',
      },
    ],
  },
  null,
  2
);

// Validate the same fields as the backend Zod schema

function parseTickets(json: string): ImportTicket[] {
  const parsed = JSON.parse(json);

  // Accept either an array or { tickets: [...] }
  const tickets = Array.isArray(parsed) ? parsed : parsed?.tickets;

  if (!Array.isArray(tickets)) {
    throw new Error('JSON must contain a "tickets" array.');
  }

  if (tickets.length < 1 || tickets.length > 500) {
    throw new Error('You must import between 1 and 500 tickets.');
  }

  return tickets.map((ticket, index) => {
    if (
      !ticket ||
      typeof ticket.externalId !== 'string' ||
      !ticket.externalId.trim()
    ) {
      throw new Error(`Ticket ${index + 1}: External ID is required.`);
    }

    if (
      typeof ticket.subject !== 'string' ||
      ticket.subject.trim().length < 3 ||
      ticket.subject.trim().length > 150
    ) {
      throw new Error(
        `Ticket ${index + 1}: Subject must contain 3–150 characters.`
      );
    }

    if (
      typeof ticket.body !== 'string' ||
      ticket.body.trim().length < 5 ||
      ticket.body.trim().length > 2000
    ) {
      throw new Error(
        `Ticket ${index + 1}: Body must contain 5–2000 characters.`
      );
    }

    return {
      externalId: ticket.externalId.trim(),
      subject: ticket.subject.trim(),
      body: ticket.body.trim(),
    };
  });
}

export default function TicketImportModal({
  onClose,
  onSuccess,
}: TicketImportModalProps) {
  const [json, setJson] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [result, setResult] = useState<ImportTicketResponse | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError('');

    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please select a JSON file.');
      return;
    }

    try {
      const content = await file.text();

      setJson(content);
      setFileName(file.name);
    } catch {
      setError('Unable to read the selected file.');
    }
  }

  async function handleImport() {
    if (loading) return;

    setError('');

    try {
      const tickets = parseTickets(json);

      setLoading(true);

      const response = await importTickets(tickets);

      setResult(response);
      onSuccess();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format.');
      } else if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          typeof message === 'string' ? message : 'Unable to import tickets.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Upload size={26} />
            </div>

            <div>
              <h2
                id="import-title"
                className="text-xl font-bold text-slate-900"
              >
                Import Tickets
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Import and automatically classify support tickets.
              </p>
            </div>
          </div>

          <button
            aria-label="Close import dialog"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
          >
            <X size={22} />
          </button>
        </div>

        {/* Success State */}

        {result ? (
          <div className="space-y-6 p-6">
            <div className="text-center">
              <CircleCheck
                size={52}
                className="mx-auto mb-4 text-emerald-500"
              />

              <h3 className="text-xl font-bold text-slate-900">
                Import Completed
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Processed {result.total} ticket records.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Imported</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {result.importedCount}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-700">Updated</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {result.updatedCount}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-sm text-indigo-700">Overrides Protected</p>
                <p className="mt-2 text-3xl font-bold text-indigo-700">
                  {result.skippedOverrideCount}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Protected tickets may also be counted as updated when their
              subject or body changes.
            </p>

            <Button
              variant="primary"
              size="fullWidth"
              text="Done"
              onClick={onClose}
            />
          </div>
        ) : (
          <>
            <div className="space-y-5 p-6">
              {/* Error */}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* File Upload */}

              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-8 transition hover:bg-indigo-50">
                <FileJson size={40} className="text-indigo-500" />

                <p className="text-sm font-semibold text-indigo-600">
                  {fileName || 'Choose a JSON file'}
                </p>

                <p className="text-xs text-slate-500">
                  Maximum 500 tickets per import
                </p>

                <input
                  type="file"
                  accept=".json,application/json"
                  disabled={loading}
                  onChange={handleFile}
                  className="sr-only"
                />
              </label>

              {/* JSON Input */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="ticket-json"
                    className="text-sm font-medium text-slate-700"
                  >
                    Or paste JSON data
                  </label>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setJson(example);
                      setFileName('');
                      setError('');
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Load Example
                  </button>
                </div>

                <textarea
                  id="ticket-json"
                  rows={10}
                  value={json}
                  disabled={loading}
                  onChange={(event) => {
                    setJson(event.target.value);
                    setFileName('');
                  }}
                  placeholder={example}
                  spellCheck={false}
                  className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Footer */}

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-6">
              <Button
                variant="secondary"
                size="md"
                text="Cancel"
                disabled={loading}
                onClick={onClose}
              />

              <Button
                variant="primary"
                size="md"
                text="Import Tickets"
                startIcon={<Upload size={18} />}
                loading={loading}
                disabled={!json.trim()}
                onClick={handleImport}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
