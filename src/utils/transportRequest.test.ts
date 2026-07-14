import { resolveTransportOwnership } from './transportRequest';

describe('resolveTransportOwnership', () => {
  it('uses Individual when the transport record has no ownership type', () => {
    expect(resolveTransportOwnership({ owner: 'owner-1' }, 'buyer@example.com')).toEqual({
      ownerShipType: 'Individual',
      transportOwnerAc: 'owner-1',
    });
  });

  it('preserves company ownership data when present', () => {
    expect(resolveTransportOwnership({ ownerShipType: 'Company', transportOwnerAc: 'BizAc-123' }, 'buyer@example.com')).toEqual({
      ownerShipType: 'Company',
      transportOwnerAc: 'BizAc-123',
    });
  });
});
