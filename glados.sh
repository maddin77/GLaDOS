#!/bin/bash
while true
  do
   node . | tee log/`date +%Y%m%d-%N`_log.log
  sleep 1
done
