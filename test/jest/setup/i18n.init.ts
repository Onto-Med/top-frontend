import { config } from '@vue/test-utils'

const $t  = jest.fn();
const $tc = jest.fn();
config.global.mocks.$t  = $t;
config.global.mocks.$tc = $tc;
