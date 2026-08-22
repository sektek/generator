import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

import { choicesFor, defaultIndexFor, pendingSpecs } from './wizard-steps.js';
import type { OptionSpec } from './schema.js';

export type WizardProps = {
  schema: OptionSpec[];
  seed: Record<string, unknown>;
  onComplete: (answers: Record<string, unknown>) => void;
};

// Not unit-tested: ink TTY rendering is impractical to exercise outside a
// real terminal. The pure step-sequencing logic is unit-tested in
// wizard-steps.ts instead.

/**
 * Steps through a namespace's option schema one prompt at a time,
 * skipping any key already supplied through `seed`.
 *
 * @param props - Schema to walk, pre-filled answers, and the completion callback.
 * @param props.schema - The full option schema for the namespace being run.
 * @param props.seed - Option values already supplied (e.g. via CLI flags).
 * @param props.onComplete - Called once with the fully-resolved answers.
 * @returns The wizard's current prompt, or nothing once every step is answered.
 */
export function Wizard({ schema, seed, onComplete }: WizardProps) {
  const steps = pendingSpecs(schema, seed);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(seed);
  const [textValue, setTextValue] = useState('');

  const done = stepIndex >= steps.length;

  // answers/onComplete are in the deps to avoid a stale closure; the
  // `if (done)` guard makes every earlier re-invocation a no-op.
  useEffect(() => {
    if (done) {
      onComplete(answers);
    }
  }, [done, answers, onComplete]);

  if (done) {
    return null;
  }

  const spec = steps[stepIndex];

  const advance = (value: unknown) => {
    setAnswers(prev => ({ ...prev, [spec.key]: value }));
    setTextValue('');
    setStepIndex(prev => prev + 1);
  };

  return (
    <Box flexDirection="column">
      <Text>{spec.prompt}</Text>
      {renderInput(spec, textValue, setTextValue, advance)}
    </Box>
  );
}

/**
 * Renders `<TextInput>` for a `text` spec, `<SelectInput>` (pre-selected
 * at the schema's default) for `select`/`boolean`.
 *
 * @param spec - The option spec currently being prompted for.
 * @param textValue - The text input's current (uncommitted) value.
 * @param setTextValue - Updates the text input's current value.
 * @param advance - Records the answered value and moves to the next step.
 * @returns The input component for this step.
 */
function renderInput(
  spec: OptionSpec,
  textValue: string,
  setTextValue: (value: string) => void,
  advance: (value: unknown) => void,
) {
  if (spec.kind === 'text') {
    return (
      <TextInput
        value={textValue}
        onChange={setTextValue}
        onSubmit={value => advance(value === '' ? spec.default : value)}
      />
    );
  }

  const choices = choicesFor(spec);
  return (
    <SelectInput
      items={choices}
      initialIndex={defaultIndexFor(spec, choices)}
      onSelect={item => advance(item.value)}
    />
  );
}
