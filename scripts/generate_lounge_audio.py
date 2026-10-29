"""Original looping lounge composition and physical coin-rain effects. Standard library only."""
from array import array
from math import exp, pi, sin, sqrt, tanh
from pathlib import Path
from random import Random
import wave

RATE=22050
OUT=Path(__file__).resolve().parents[1]/'client/public/assets/audio'


def save(name: str,left: list[float],right: list[float]) -> None:
    OUT.mkdir(parents=True,exist_ok=True)
    peak=max(max(map(abs,left)),max(map(abs,right)),.0001)
    data=array('h')
    for l,r in zip(left,right):
        data.append(round(tanh(l/peak*1.05)*30000))
        data.append(round(tanh(r/peak*1.05)*30000))
    with wave.open(str(OUT/name),'wb') as file:
        file.setnchannels(2);file.setsampwidth(2);file.setframerate(RATE)
        file.writeframes(data.tobytes())


def note(left: list[float],right: list[float],at: float,duration: float,midi: int,
         gain: float,pan: float=0,voice: str='keys',circular: bool=False) -> None:
    frequency=440*2**((midi-69)/12)
    start=round(at*RATE);count=round(duration*RATE)
    lg=sqrt((1-pan)/2)*gain;rg=sqrt((1+pan)/2)*gain
    for i in range(count):
        t=i/RATE
        if voice=='pad':
            envelope=min(1,t/.7)*min(1,(duration-t)/.9)
            sample=(sin(2*pi*frequency*t)+.19*sin(2*pi*frequency*2.001*t)+.07*sin(2*pi*frequency*3*t))*envelope
        elif voice=='bass':
            sample=(sin(2*pi*frequency*t)+.17*sin(2*pi*frequency*2*t))*(1-exp(-t*24))*exp(-t*1.3)*min(1,(duration-t)/.1)
        else:
            sample=(sin(2*pi*frequency*t)+.28*sin(2*pi*frequency*2*t)*exp(-t*3.5)
                    +.08*sin(2*pi*frequency*3*t)*exp(-t*5))
            sample*=(1-exp(-t*95))*exp(-t*2.1)*min(1,(duration-t)/.05)
        index=(start+i)%len(left) if circular else start+i
        if index>=len(left):break
        left[index]+=sample*lg;right[index]+=sample*rg


def soundtrack() -> None:
    beat=60/72
    bar=beat*4
    length=round(bar*24*RATE)
    left=[0.0]*length;right=[0.0]*length
    # Cmaj9 / Am9 / Fmaj9 / G13 / Em7 / Am9 / Dm9 / G13.
    chords=[(36,[48,55,59,62,64]),(33,[45,52,55,59,60]),(29,[41,48,52,55,57]),(31,[43,50,53,57,64]),
            (28,[40,47,50,55,59]),(33,[45,52,55,59,60]),(26,[38,45,48,52,53]),(31,[43,50,53,57,64])]
    melodies=[[(0,76,1.5),(2,74,.8),(3,72,1)],[(0,72,1),(1.5,71,1),(3,69,1)],
              [(0,69,1.4),(2,72,1),(3,76,1)],[(0,74,2),(2.5,71,.8)],
              [(0,71,1.3),(2,74,1),(3,76,1)],[(0,72,1.8),(2.5,69,1)],
              [(0,69,1.2),(1.5,72,1),(3,74,1)],[(0,71,1.5),(2,67,1.5)]]
    for b in range(24):
        root,voicing=chords[b%8];at=b*bar
        for j,pitch in enumerate(voicing):
            note(left,right,at,bar+1.6,pitch,.027,(j-2)*.21,'pad',True)
        note(left,right,at,2.7,root,.13,-.08,'bass',True)
        note(left,right,at+beat*2,1.5,root+12,.045,.08,'bass',True)
        for j in range(8):
            pitch=voicing[[0,2,3,1,2,4,3,2][j]]+12
            note(left,right,at+j*beat/2,1.6,pitch,.052,(-1 if j%2 else 1)*.3,circular=True)
        for when,pitch,duration in melodies[b%8]:
            if b//8==1 and when==3:continue
            note(left,right,at+when*beat,duration*beat+.5,pitch,.105,.08*sin(b),circular=True)
    # Circular stereo reflections preserve tails through the loop boundary.
    dry_l=left[:];dry_r=right[:]
    for delay,level in [(.17,.16),(.31,.11),(.53,.075),(.83,.035)]:
        offset=round(delay*RATE)
        for i in range(length):
            left[i]+=dry_r[(i-offset)%length]*level
            right[i]+=dry_l[(i-offset)%length]*level
    save('lounge-soundtrack.wav',left,right)


def coin_rain() -> None:
    rng=Random(7731)
    left=[0.0]*round(RATE*4.2);right=left[:]
    at=.015
    for hit in range(165):
        at+=rng.uniform(.009,.026) if hit<145 else rng.uniform(.025,.045)
        base=rng.uniform(2100,4900);pan=rng.uniform(-.85,.85)
        strength=rng.uniform(.17,.48)*(1 if hit<130 else .65)
        for bounce in range(rng.randint(2,4)):
            start=round((at+bounce*rng.uniform(.024,.042))*RATE)
            last_noise=0.0
            for i in range(round(RATE*.16)):
                if start+i>=len(left):break
                t=i/RATE;noise=rng.uniform(-1,1)
                impact=(noise-last_noise)*exp(-t*700)*.8;last_noise=noise
                ring=(sin(2*pi*base*t)*exp(-t*42)+.42*sin(2*pi*base*1.413*t)*exp(-t*74)
                      +.22*sin(2*pi*base*1.917*t)*exp(-t*100))
                body=.15*sin(2*pi*base*.37*t)*exp(-t*100)
                sample=(impact+ring+body)*strength*(.48**bounce)
                left[start+i]+=sample*sqrt((1-pan)/2)
                right[start+i]+=sample*sqrt((1+pan)/2)
    dry_l=left[:];dry_r=right[:]
    for delay,gain in [(.017,.17),(.043,.12),(.079,.065)]:
        offset=round(delay*RATE)
        for i in range(offset,len(left)):
            left[i]+=dry_r[i-offset]*gain;right[i]+=dry_l[i-offset]*gain
    save('coin-rain.wav',left,right)


def cues() -> None:
    for filename,pitches in [('cell-landing.wav',[72]),('cell-special.wav',[76,79]),
                             ('cell-bonus.wav',[79,84]),('win-chord.wav',[60,64,67,74])]:
        length=.18 if filename.startswith('cell') else 1.5
        left=[0.0]*round(RATE*length);right=left[:]
        for i,pitch in enumerate(pitches):
            note(left,right,i*.025,length-i*.025,pitch,.3,(-.2 if i%2 else .2))
        save(filename,left,right)


if __name__=='__main__':
    soundtrack();coin_rain();cues()
    print('Generated 80-second original lounge soundtrack, stereo coin rain and cell landing cues.')
