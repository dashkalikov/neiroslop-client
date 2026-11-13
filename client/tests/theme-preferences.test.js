import test from 'node:test';
import assert from 'node:assert/strict';
import * as appearance from '../src/lib/appearance.js';

function memoryStorage(entries) {
  const values = new Map(entries);
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('Liquid Glass remains selected while the color mode changes', () => {
  const storage = memoryStorage([['lounge-theme', 'dark']]);
  assert.deepEqual(appearance.readAppearance(storage), { theme: 'dark', style: 'standard' });
  appearance.writeAppearance({ theme: 'dark', style: 'glass' }, storage);
  assert.deepEqual(appearance.readAppearance(storage), { theme: 'dark', style: 'glass' });
  appearance.writeAppearance({ ...appearance.readAppearance(storage), theme: 'light' }, storage);
  assert.deepEqual(appearance.readAppearance(storage), { theme: 'light', style: 'glass' });
  appearance.writeAppearance({ ...appearance.readAppearance(storage), style: 'standard' }, storage);
  assert.deepEqual(appearance.readAppearance(storage), { theme: 'light', style: 'standard' });
});

test('a saved legacy Liquid Glass theme becomes Dark with Liquid Glass', () => {
  const storage = memoryStorage([['lounge-theme', 'glass']]);
  const saved = appearance.readAppearance(storage);
  assert.deepEqual(saved, { theme: 'dark', style: 'glass' });
  appearance.writeAppearance(saved, storage);
  assert.equal(storage.getItem('lounge-theme'), 'dark');
  assert.equal(storage.getItem('lounge-style'), 'glass');
  assert.deepEqual(appearance.readAppearance(storage), saved);
});

test('legacy light mode stays light and unsupported settings fall back independently', () => {
  const storage = memoryStorage([['lounge-theme', 'light']]);
  assert.deepEqual(appearance.readAppearance(storage), { theme: 'light', style: 'standard' });
  appearance.writeAppearance({ theme: 'invalid', style: 'glass' }, storage);
  assert.deepEqual(appearance.readAppearance(storage), { theme: 'dark', style: 'glass' });
  appearance.writeAppearance({ theme: 'light', style: 'invalid' }, storage);
  assert.deepEqual(appearance.readAppearance(storage), { theme: 'light', style: 'standard' });
});
