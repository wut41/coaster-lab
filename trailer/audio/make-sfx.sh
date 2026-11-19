#!/bin/bash
# Synthesizes the trailer's sound effects with ffmpeg (original sounds, no third-party samples).
# Freesound (the skill's default SFX source) refuses requests from this build machine, so every effect is
# generated here from noise and sine sources. Output: public/audio/sfx/*.wav (48 kHz, 16-bit).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/audio/sfx
mkdir -p "$OUT"
R=48000
gen() { # name duration expression [extra audio filters]
  local name=$1 dur=$2 expr=$3 af=${4:-anull}
  ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=exprs='$expr':s=$R:d=$dur" -af "$af,alimiter=limit=0.95" -c:a pcm_s16le "$OUT/$name.wav"
}
N='(random(0)*2-1)'   # white noise

# camera whoosh: noise swelling and fading, band swept by a moving filter
gen whoosh 0.7 "$N*sin(PI*t/0.7)^2" "highpass=f=250,lowpass=f=4500,equalizer=f=1200:t=q:w=1:g=6,volume=1.4"
# long wind for the first drop
gen wind 2.6 "$N*(min(t/1.2,1))*(1-max(0,(t-2.0)/0.6))" "highpass=f=120,lowpass=f=2200,volume=1.6"
# deep impact: sine boom 55 Hz with a pitch drop + short noise crack
gen impact 1.6 "0.9*sin(2*PI*(55+60*exp(-t*18))*t)*exp(-t*3.2)+0.6*$N*exp(-t*28)" "lowpass=f=6000,volume=1.2"
# riser: rising tone + noise building to a cut
gen riser 1.8 "(0.35*sin(2*PI*(200+900*(t/1.8)^2)*t)+0.25*$N)*(t/1.8)^2" "highpass=f=180,volume=1.6"
# sparkle: three bright decaying sine tones
gen sparkle 1.2 "0.3*sin(2*PI*2093*t)*exp(-t*5)+0.25*sin(2*PI*2637*(t-0.06))*exp(-max(0,t-0.06)*5)*gte(t,0.06)+0.22*sin(2*PI*3136*(t-0.12))*exp(-max(0,t-0.12)*5)*gte(t,0.12)" "volume=1.1"
# letter landing thud (wordmark): short low knock
gen thud 0.35 "0.9*sin(2*PI*(90+120*exp(-t*40))*t)*exp(-t*14)+0.25*$N*exp(-t*60)" "lowpass=f=2500,volume=1.3"
# UI click (switch press)
gen click 0.12 "$N*exp(-t*90)+0.5*sin(2*PI*1800*t)*exp(-t*120)" "highpass=f=900,volume=0.9"
# pop (icon springs in)
gen pop 0.2 "0.8*sin(2*PI*(900-500*t/0.2)*t)*exp(-t*18)" "volume=0.9"
# camera shutter (freeze-frame): two clicks
gen shutter 0.25 "$N*(exp(-t*120)+0.7*exp(-max(0,t-0.08)*120)*gte(t,0.08))" "highpass=f=1200,volume=1.0"
# marker scribble: band-passed noise, wobbling
gen marker 0.4 "$N*(0.6+0.4*sin(2*PI*14*t))*sin(PI*t/0.4)" "bandpass=f=3200:width_type=h:w=2500,volume=1.4"
# lift-hill chain: clack every 1/7 s
gen chain 2.4 "($N*exp(-mod(t,0.142)*70)+0.5*sin(2*PI*700*t)*exp(-mod(t,0.142)*90))*0.8" "highpass=f=300,lowpass=f=6000,volume=0.9"
# crash: impact + metal scrape + debris noise
gen crash 2.0 "0.8*sin(2*PI*(48+40*exp(-t*12))*t)*exp(-t*2.5)+0.5*$N*exp(-t*3)+0.25*sin(2*PI*1430*t)*sin(2*PI*1517*t)*exp(-t*2)" "lowpass=f=7000,volume=1.3"
# slide (segmented thumb)
gen slide 0.3 "$N*sin(PI*t/0.3)" "bandpass=f=1800:width_type=h:w=1200,volume=1.0"
ls -la "$OUT"
