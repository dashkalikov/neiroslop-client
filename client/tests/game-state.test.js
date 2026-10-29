import test from 'node:test';
import assert from 'node:assert/strict';
import { nextBet, parseWager, autoAction } from '../src/lib/game-state.js';

test('bet controls move through allowed amounts and stop at bounds', () => {
  assert.equal(nextBet(20, 1), 50);
  assert.equal(nextBet(20, -1), 10);
  assert.equal(nextBet(10000, 1), 10000);
  assert.equal(nextBet(1, -1), 1);
  assert.equal(nextBet(37, 1), 50);
  assert.equal(nextBet(37, -1), 20);
});

test('manual wagers accept whole coin amounts, not decimals, exponents or empty values', () => {
  assert.equal(parseWager('37'), 37);
  assert.equal(parseWager('1'), 1);
  assert.equal(parseWager('10000'), 10000);
  for (const value of ['', '0', '-1', '1.5', '1e2', 'coins', '10001']) assert.equal(parseWager(value), null);
});

test('auto-spin stops when a paid round is unaffordable, but still consumes free spins', () => {
  const state = {ready:true,paused:false,spinning:false,balance:5,bet:37,freeSpins:0};
  assert.equal(autoAction(state), 'funds');
  assert.equal(autoAction({...state,freeSpins:2}), 'spin');
  assert.equal(autoAction({...state,balance:37}), 'spin');
  assert.equal(autoAction({...state,bet:null}), 'invalid');
  assert.equal(autoAction({...state,spinning:true}), 'wait');
  assert.equal(autoAction({...state,paused:true}), 'wait');
});

test('pending and free-spin rounds keep the triggering bet locked', () => {
  assert.equal(nextBet(50, 1, true), 50);
  assert.equal(nextBet(50, -1, true), 50);
});
