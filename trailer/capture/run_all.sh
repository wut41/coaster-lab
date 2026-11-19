#!/bin/bash
# Record every clip, two browsers at a time.
cd "$(dirname "$0")"
run() { node footage.js "$1" > "logs/$1.log" 2>&1; echo "$1 exit $?"; }
mkdir -p logs
( run pov; run moon; run cine ) &
( run crash; run loop; node stills.js > logs/stills.log 2>&1; echo stills exit $? ) &
wait
echo ALL_DONE
