#!/usr/bin/env node
console.log('process.env.FORCE_DEPLOY', process.env.FORCE_DEPLOY);
console.log('process.env.CI_PULL_REQUEST', process.env.CI_PULL_REQUEST);
console.log('process.env.CIRCLE_PULL_REQUEST', process.env.CIRCLE_PULL_REQUEST);
