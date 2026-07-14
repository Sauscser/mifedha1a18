export const resolveTransportOwnership = (transportRecord: any, fallbackEmail?: string) => {
  const ownerShipType = transportRecord?.ownerShipType || 'Individual';
  const transportOwnerAc = transportRecord?.transportOwnerAc || transportRecord?.owner || fallbackEmail || 'Unknown';

  return {
    ownerShipType,
    transportOwnerAc,
  };
};
