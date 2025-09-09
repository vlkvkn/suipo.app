import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { PACKAGE_ID, EVENT_CONFIG_ID, CLOCK_ID,ASSETS_URL } from '../config';
import { POAPEvent } from '../types/poap';

export interface POAP {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  eventKey: string;
  createdAt: Date;
}

// Get user's POAPs
export async function getPOAPs(suiClient: SuiClient, address: string): Promise<POAP[]> {

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

    if (!objects.data || objects.data.length === 0) {
      console.log('No POAP objects found for address:', address);
      return [];
    }

    const poaps = objects.data.map((obj: any) => {
      const content = obj.data?.content as any;
      const fields = content?.fields || {};

      const poap = {
        id: obj.data?.objectId || '',
        name: fields.name || 'Unknown POAP',
        description: fields.description || 'No description',
        imageUrl: ASSETS_URL+"/"+fields.image_path || '',
        eventKey: fields.event_key || 'Unknown Event',
        createdAt: new Date(Number(fields.created_at)),
      };
      return poap;
    });
    poaps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return poaps;
  } catch (error) {
    console.error('Error in getPOAPs:', error);
    throw error;
  }
}

// Get events
export async function getEvents(suiClient: any, creatorAddress?: string): Promise<POAPEvent[]> {
  try {
    const eventConfig = await suiClient.getObject({
      id: EVENT_CONFIG_ID,
      options: { showContent: true },
    });

    if (!eventConfig.data?.objectId) {
      console.error('EventConfig not found or invalid');
      throw new Error('EventConfig not found');
    }

    // Get creator from EventConfig
    const configContent = eventConfig.data?.content as any;
    const configFields = configContent?.fields || {};
    const creator = configFields.creator || '';

    const dynamicFields = await suiClient.getDynamicFields({
      parentId: eventConfig.data.objectId,
    });
    const eventsList = await Promise.all(
      dynamicFields.data.map(async (field: any) => {

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
          visitors: fields.visitors || [],
          creator: creator
        };
        return eventData;
      })
    );

    // Filter events by creator if creatorAddress is provided
    if (creatorAddress) {
      return eventsList.filter(event => event.creator === creatorAddress);
    }

    return eventsList;
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
}

// Mint POAP transaction
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
  eventName: string,
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
      tx.pure.string(eventName),
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
