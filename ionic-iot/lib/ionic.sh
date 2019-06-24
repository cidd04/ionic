#!/bin/bash


export NODE_OPTIONS="--no-warnings"


if [[ $1 = "register-network" ]]; then
   ../node_modules/ts-node/dist/bin.js register-network.ts
elif [[ $1 = "register-hub" ]]; then
  ../node_modules/ts-node/dist/bin.js register-hub.ts
elif [[ $1 = "upgrade-software" ]]; then
  ../node_modules/ts-node/dist/bin.js upgrade-software.ts
else
    echo ""
    echo "Usage: $0 register-network"
    echo "   or: $0 register-hub"
    echo "   or: $0 upgrade-software"
    echo ""
    echo "Description: "
    echo ""
    echo "register-network    Register the device to the ION Network."
    echo "register-hub        Request for Hub access."
    echo "upgrade-software    Update Software."
    echo ""
fi
