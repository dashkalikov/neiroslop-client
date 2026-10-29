"""Reproducible, original physical-model sounds; uses only the Python standard library."""
from array import array
from math import exp, pi, sin, tanh
from pathlib import Path
from random import Random
import wave

RATE = 22050
DESTINATION = Path(__file__).resolve().parents[1] / 'client/public/assets/audio'


def save(name: str, samples: list[float]) -> None:
    DESTINATION.mkdir(parents=True, exist_ok=True)
    peak = max(abs(value) for value in samples) or 1
    pcm = array('h', (round(tanh(value / peak * 1.3) * 29000) for value in samples))
    with wave.open(str(DESTINATION / name), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def coins() -> list[float]:
    rng = Random(729)
    samples = [0.0] * (RATE * 4)
    # Metal disks striking the tray, followed by smaller bouncing contacts.
    for hit in range(57):
        at = .06 + (hit / 57) ** .82 * 2.85 + rng.uniform(0, .05)
        frequency = rng.uniform(1700, 3300)
        amplitude = rng.uniform(.20, .55) * (1 - hit / 85)
        for bounce in range(3):
            start = int((at + bounce * .055) * RATE)
            for i in range(int(RATE * .35)):
                if start + i >= len(samples):
                    break
                t = i / RATE
                ring = sum(sin(2 * pi * frequency * ratio * t) * exp(-t * decay) * weight
                           for ratio, decay, weight in [(1, 27, 1), (1.49, 40, .5), (2.11, 68, .3)])
                impact = rng.uniform(-1, 1) * exp(-t * 480) * 1.4
                samples[start+i] += amplitude * (.47 ** bounce) * (ring + impact)
    # Soft short room reflections make it sound like a metal payout tray.
    original = samples[:]
    for delay, gain in [(0.031, .19), (.067, .1), (.113, .05)]:
        offset = int(delay * RATE)
        for i in range(offset, len(samples)):
            samples[i] += original[i-offset] * gain
    return samples


def reels() -> list[float]:
    rng = Random(85)
    samples = []
    smoothed = 0
    for i in range(RATE * 2):
        t = i / RATE
        noise = rng.uniform(-1, 1)
        smoothed = smoothed * .89 + noise * .11
        tooth = (t * 28) % 1
        ratchet = exp(-tooth * 29) * sin(2*pi*1900*t) * .23
        motor = .12*sin(2*pi*84*t) + .035*sin(2*pi*168*t)
        samples.append(smoothed * .65 + ratchet + motor)
    # Join the loop without a hard edge.
    fade = 500
    for i in range(fade):
        mix = i / fade
        samples[-fade+i] = samples[-fade+i]*(1-mix) + samples[i]*mix
    return samples


def lever() -> list[float]:
    rng = Random(4)
    return [(.45*rng.uniform(-1,1) + sin(2*pi*93*i/RATE)) * exp(-i/RATE*30)
            + (.4*sin(2*pi*210*i/RATE)*exp(-(i/RATE-.09)*50) if i/RATE>=.09 else 0)
            for i in range(int(RATE*.3))]


if __name__ == '__main__':
    save('coin-cascade.wav', coins())
    save('reel-mechanism.wav', reels())
    save('lever-clunk.wav', lever())
    print('Created three original slot sound effects in', DESTINATION)
