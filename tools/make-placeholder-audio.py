#!/usr/bin/env python3
"""Writes the placeholder music in audio/: little chiptune loops, made with the
standard library only. Swap them for your own music by dropping files into
audio/ and editing AP.config.music in js/config.js.

Usage: python3 tools/make-placeholder-audio.py
"""
import math
import os
import random
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'audio')
NOTES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

random.seed(7)  # the same files every time
NOISE = [random.uniform(-1, 1) for _ in range(RATE)]


def freq(name):
    """'C5', 'F#3' or 'Bb4' -> Hz."""
    letter, accidental, octave = name[0], name[1:-1], int(name[-1])
    midi = 12 * (octave + 1) + NOTES[letter] + accidental.count('#') - accidental.count('b')
    return 440 * 2 ** ((midi - 69) / 12)


# Instruments: each takes (phase in cycles, seconds since the note started).
def soft_square(p, _):
    return sum(math.sin(2 * math.pi * n * p) / n for n in (1, 3, 5, 7)) * 0.8


def triangle(p, _):
    return 4 * abs(p % 1 - 0.5) - 1


def sine(p, _):
    return math.sin(2 * math.pi * p)


def bell(p, _):
    return math.sin(2 * math.pi * p) + 0.3 * math.sin(2 * math.pi * 3 * p)


class Track:
    def __init__(self, bpm, beats, loop=True, tail=0.0):
        self.beat = 60 / bpm
        self.length = int(beats * self.beat * RATE)
        self.loop = loop  # note tails wrap round to the start, so the loop is seamless
        self.buf = [0.0] * (self.length + (0 if loop else int(tail * RATE)))

    def add(self, i, value):
        if self.loop:
            i %= self.length
        if i < len(self.buf):
            self.buf[i] += value

    def note(self, start, beats, hz, wave_fn, gain, decay=3.0):
        """start and beats are in beats; the note fades out over its last 30ms."""
        n = int(beats * self.beat * RATE)
        i0 = int(start * self.beat * RATE)
        release = int(0.03 * RATE)
        for k in range(n):
            t = k / RATE
            env = min(1, t / 0.008) * math.exp(-t * decay) * min(1, (n - k) / release)
            self.add(i0 + k, gain * env * wave_fn(hz * t, t))

    def melody(self, start, tune, wave_fn, gain, decay=3.0, octave_up=0):
        """tune is 'C5:1 E5:.5 r:.5 ...' (note:beats; r is a rest; chords join with +)."""
        at = start
        for item in tune.split():
            name, beats = item.split(':')
            beats = float(beats)
            if name != 'r':
                for part in name.split('+'):
                    self.note(at, beats * 0.92, freq(part) * 2 ** octave_up, wave_fn, gain, decay)
            at += beats
        return at

    def kick(self, start, gain=0.9):
        i0 = int(start * self.beat * RATE)
        phase = 0.0
        for k in range(int(0.25 * RATE)):
            t = k / RATE
            phase += (45 + 75 * math.exp(-t * 30)) / RATE
            self.add(i0 + k, gain * math.exp(-t * 14) * math.sin(2 * math.pi * phase))

    def snare(self, start, gain=0.35):
        i0 = int(start * self.beat * RATE)
        for k in range(int(0.18 * RATE)):
            t = k / RATE
            body = 0.5 * math.sin(2 * math.pi * 185 * t) * math.exp(-t * 40)
            self.add(i0 + k, gain * (NOISE[k] * math.exp(-t * 22) + body))

    def hat(self, start, gain=0.12):
        i0 = int(start * self.beat * RATE)
        for k in range(int(0.05 * RATE)):
            t = k / RATE
            self.add(i0 + k, gain * (NOISE[k + 1] - NOISE[k]) * math.exp(-t * 70))

    def save(self, name, peak=0.8):
        top = max(abs(x) for x in self.buf) or 1
        frames = b''.join(struct.pack('<h', int(32767 * peak * x / top)) for x in self.buf)
        os.makedirs(OUT, exist_ok=True)
        with wave.open(os.path.join(OUT, name), 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(frames)
        print(f'{name}: {len(self.buf) / RATE:.1f}s')


def bass_bars(track, roots, gain, pattern):
    """pattern: (beat offset, beats, octave shift) repeated in each 4-beat bar."""
    for bar, root in enumerate(roots):
        for offset, beats, shift in pattern:
            track.note(bar * 4 + offset, beats * 0.9, freq(root) * 2 ** shift, triangle, gain, decay=2)


def main_theme():
    """Home screen: cheerful and bouncy, 8 bars of C Am F G."""
    t = Track(bpm=120, beats=32)
    t.melody(0, '''
        E5:.5 G5:.5 C6:1 G5:.5 E5:.5 G5:1
        A5:1 G5:.5 E5:.5 C5:1 r:1
        F5:.5 A5:.5 C6:1 A5:.5 F5:.5 A5:1
        G5:1.5 F5:.5 E5:1 D5:1
        E5:.5 G5:.5 C6:1 D6:.5 C6:.5 G5:1
        A5:.5 C6:.5 E6:1 D6:1 C6:1
        A5:1 F5:.5 A5:.5 G5:1 D5:1
        G5:1 F5:.5 E5:.5 D5:2''', soft_square, 0.22)
    bass_bars(t, ['C3', 'A2', 'F2', 'G2'] * 2, 0.35, [(0, 1, 0), (1, 1, 1), (2, 1, 0), (3, 1, 1)])
    for b in range(32):
        t.hat(b + 0.5)
    t.save('main-theme.wav')


def quiz_theme():
    """Under the questions: calm arpeggios, no tune to distract."""
    t = Track(bpm=88, beats=16)
    chords = [('C4', 'E4', 'G4'), ('A3', 'C4', 'E4'), ('F3', 'A3', 'C4'), ('G3', 'B3', 'D4')]
    for bar, (r, third, fifth) in enumerate(chords):
        for step, name in enumerate([r, third, fifth, third] * 2):
            t.note(bar * 4 + step * 0.5, 0.9, freq(name) * 2, bell, 0.16, decay=4)
        t.note(bar * 4, 3.8, freq(r) / 2, sine, 0.3, decay=0.6)
    t.save('quiz-theme.wav', peak=0.6)


def food_jingle():
    """Choosing a food: a quick 'ta-da'."""
    t = Track(bpm=150, beats=4, loop=False, tail=0.8)
    t.melody(0, 'C5:.25 E5:.25 G5:.25 C6:.25 E6:.5 r:.25 C6+E6+G6:2.25', bell, 0.3, decay=2.5)
    t.melody(1.5, 'C4+G4:2.5', triangle, 0.25, decay=1.5)
    t.save('food-jingle.wav')


def party_theme():
    """The party: drums, a busy bass and a bright tune, 8 bars of F G Em Am."""
    t = Track(bpm=132, beats=32)
    t.melody(0, '''
        C6:.5 A5:.5 C6:.5 A5:.5 F5:1 A5:1
        B5:.5 G5:.5 B5:.5 D6:.5 D6:1 r:1
        E6:.5 D6:.5 B5:.5 G5:.5 E5:1 G5:1
        A5:1 C6:.5 B5:.5 A5:2
        A5:.5 C6:.5 F6:1 E6:.5 D6:.5 C6:1
        B5:.5 D6:.5 G6:1 F6:.5 E6:.5 D6:1
        E6:.5 D6:.5 C6:.5 B5:.5 G5:1 B5:1
        A5:.5 B5:.5 C6:.5 D6:.5 E6:2''', soft_square, 0.2, decay=4)
    bass_bars(t, ['F2', 'G2', 'E2', 'A2'] * 2, 0.35, [(i * 0.5, 0.5, i % 2) for i in range(8)])
    for b in range(32):
        t.kick(b)
        t.hat(b + 0.5)
        if b % 2:
            t.snare(b)
    t.save('party-theme.wav')


if __name__ == '__main__':
    main_theme()
    quiz_theme()
    food_jingle()
    party_theme()
