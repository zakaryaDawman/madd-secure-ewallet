import { checkUnknownDevice } from '../src/rules/unknownDevice';

const PHONE = '11111111-1111-4111-8111-111111111111';
const OTHER_PHONE = '22222222-2222-4222-8222-222222222222';

describe('R3 checkUnknownDevice', () => {
  it('fires for a phone that is not trusted', () => {
    expect(checkUnknownDevice(OTHER_PHONE, [PHONE])).toEqual({
      fired: true,
      reason: 'This phone is not one of your trusted devices.',
      details: { deviceId: OTHER_PHONE, trustedDevices: 1 },
    });
  });

  it('does not fire for a trusted phone', () => {
    expect(checkUnknownDevice(PHONE, [PHONE, OTHER_PHONE]).fired).toBe(false);
  });

  it('on the limit: fires when the user has no trusted devices at all', () => {
    expect(checkUnknownDevice(PHONE, []).fired).toBe(true);
  });
});
