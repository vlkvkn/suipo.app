import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, EVENT_CONFIG_ID, CLOCK_ID } from '../config';
import { POAPEvent } from '../types/poap';

export interface POAP {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  eventId: string;
}

// Get user's POAPs
export async function getPOAPs(suiClient: any, address: string): Promise<POAP[]> {

  try {
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: {
        MatchAll: [
          { StructType: `${PACKAGE_ID}::nft::PoapNFT` },
        ],
      },
      options: {
        showContent: true,
      },
    });

    console.log('Raw objects response:', objects);

    if (!objects.data || objects.data.length === 0) {
      console.log('No POAP objects found for address:', address);
      return [];
    }

    const poaps = objects.data.map((obj: any) => {
      console.log('Processing object:', obj);
      const content = obj.data?.content as any;
      const fields = content?.fields || {};

      const poap = {
        id: obj.data?.objectId || '',
        name: fields.name || 'Unknown POAP',
        description: fields.description || 'No description',
        imageUrl: fields.img_url || '',
        eventId: fields.event_id || 'Unknown Event',
      };
      return poap;
    });
    return poaps;
  } catch (error) {
    console.error('Error in getPOAPs:', error);
    throw error;
  }
}

// Get events
export async function getEvents(suiClient: any): Promise<POAPEvent[]> {
  try {
    const eventConfig = await suiClient.getObject({
      id: EVENT_CONFIG_ID,
      options: { showContent: true },
    });

    if (!eventConfig.data?.objectId) {
      console.error('EventConfig not found or invalid');
      throw new Error('EventConfig not found');
    }

    const dynamicFields = await suiClient.getDynamicFields({
      parentId: eventConfig.data.objectId,
    });
    const eventsList = await Promise.all(
      dynamicFields.data.map(async (field: any, index: number) => {
        console.log(`Processing field ${index}:`, field);

        const event = await suiClient.getObject({
          id: field.objectId,
          options: { showContent: true },
        });
        const content = event.data?.content as any;
        const fields = content?.fields || {};
        const eventName = typeof field.name?.value === 'string' ? field.name.value : 'Unknown Event';

        const eventData = {
          id: event.data?.objectId || '',
          name: eventName,
          description: fields.description || 'No description',
          imageUrl: fields.img_url,
          eventId: eventName,
          poapName: fields.poap_name,
          poapDescription: fields.poap_description,
          poapImgPath: fields.poap_img_path,
          expiredAt: fields.expired_at || 0,
          visitors: fields.visitors || []
        };
        return eventData;
      })
    );
    return eventsList;
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
}

// Mint POAP (use with useSignAndExecuteTransactionBlock)
export function buildMintPoapTx(eventKey: string) {
  const tx = new Transaction();
  tx.setGasBudget(100000000);
  tx.moveCall({
    target: `${PACKAGE_ID}::issuer::mint`,
    arguments: [
      tx.object(EVENT_CONFIG_ID),
      tx.object(CLOCK_ID),
      tx.pure.string(eventKey),
    ],
  });
  return tx;
}

// Create event (use with useSignAndExecuteTransactionBlock)
export async function buildCreateEventTx(
  suiClient: any,
  eventKey: string,
  description: string,
  imgPath: string,
  poapName: string,
  poapDescription: string,
  poapImgPath: string,
  expiredAt: string
) {
  const eventConfig = await suiClient.getObject({
    id: EVENT_CONFIG_ID,
    options: { showContent: true },
  });
  if (!eventConfig.data?.objectId) throw new Error('EventConfig not found');
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::issuer::create_event`,
    arguments: [
      tx.object(eventConfig.data.objectId),
      tx.pure.string(eventKey),
      tx.pure.string(description),
      tx.pure.string(imgPath),
      tx.pure.string(poapName),
      tx.pure.string(poapDescription),
      tx.pure.string(poapImgPath),
      tx.pure.u64(expiredAt),
    ],
  });
  return tx;
}
