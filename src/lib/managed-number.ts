import twilio from 'twilio';

function getManagedTwilioCredentials() {
  const accountSid = process.env.MANAGED_TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.MANAGED_TWILIO_AUTH_TOKEN || '';
  return { accountSid, authToken };
}

function isAutoProvisionEnabled() {
  return (process.env.MANAGED_AUTO_PROVISION_NUMBER || 'true').toLowerCase() !== 'false';
}

export async function tryProvisionManagedNumber(): Promise<string | null> {
  if (!isAutoProvisionEnabled()) {
    return null;
  }

  const { accountSid, authToken } = getManagedTwilioCredentials();
  if (!accountSid || !authToken) {
    return null;
  }

  const countryCode = (process.env.MANAGED_NUMBER_COUNTRY || 'US').toUpperCase();
  const areaCode = process.env.MANAGED_NUMBER_AREA_CODE || '';
  const contains = process.env.MANAGED_NUMBER_CONTAINS || '';

  const client = twilio(accountSid, authToken);

  try {
    const localOptions: Record<string, string | number | boolean> = {
      limit: 1,
      voiceEnabled: true,
      smsEnabled: true,
    };

    if (areaCode) {
      localOptions.areaCode = areaCode;
    }

    if (contains) {
      localOptions.contains = contains;
    }

    const availableLocal = await client.availablePhoneNumbers(countryCode).local.list(localOptions as any);

    if (availableLocal.length > 0) {
      const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: availableLocal[0].phoneNumber,
        friendlyName: 'Callware Managed Number',
      });
      return purchased.phoneNumber;
    }
  } catch (error) {
    console.error('Local number provisioning failed:', error);
  }

  try {
    const availableTollFree = await client.availablePhoneNumbers('US').tollFree.list({
      limit: 1,
      voiceEnabled: true,
    } as any);

    if (availableTollFree.length > 0) {
      const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: availableTollFree[0].phoneNumber,
        friendlyName: 'Callware Managed Number (Toll Free)',
      });
      return purchased.phoneNumber;
    }
  } catch (error) {
    console.error('Toll-free number provisioning failed:', error);
  }

  return null;
}
