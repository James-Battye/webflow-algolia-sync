import { WebflowClient } from 'webflow-api';
import { algoliasearch } from 'algoliasearch';
import { fetchAllCollections, fetchAllCollectionItems, filterPublishedItems, filterByStatusField } from './webflow.js';
import { transformItemsToAlgoliaRecords, syncToAlgoliaIndex } from './algolia.js';

async function syncCollectionToAlgolia(webflow, algoliaClient, collection, statusFieldName) {
  const collectionId = collection.id;
  const collectionName = collection.slug || collection.displayName;
  const algoliaIndexName = collectionName;

  console.log(`Syncing collection: ${collection.displayName} (${collectionId}) to index: ${algoliaIndexName}`);

  const items = await fetchAllCollectionItems(webflow, collectionId);
  console.log(`  Fetched ${items.length} items from collection`);

  const publishedItems = filterPublishedItems(items);
  console.log(`  Filtered to ${publishedItems.length} published items (excluded ${items.length - publishedItems.length} items)`);

  const statusFilteredItems = filterByStatusField(publishedItems, statusFieldName);
  if (statusFieldName && statusFieldName.trim() !== '') {
    console.log(`  Filtered by status field '${statusFieldName}': ${statusFilteredItems.length} items (excluded ${publishedItems.length - statusFilteredItems.length} items)`);
  }

  const algoliaRecords = transformItemsToAlgoliaRecords(statusFilteredItems);

  try {
    await syncToAlgoliaIndex(algoliaClient, algoliaIndexName, algoliaRecords);
  } catch (error) {
    console.error(`Error syncing to Algolia index ${algoliaIndexName}:`, error.message);
    throw error;
  }

  return {
    collectionName: collection.displayName,
    indexName: algoliaIndexName,
    itemsSynced: algoliaRecords.length
  };
}

export async function performSync(env) {
  console.log('Starting Webflow to Algolia sync...');

  const webflow = new WebflowClient({ accessToken: env.WEBFLOW_API_TOKEN });
  const algoliaClient = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_KEY);

  const siteId = env.WEBFLOW_SITE_ID;
  const statusFieldName = env.STATUS_FIELD || '';

  // Parse collections to sync from environment variable
  const collectionsToSync = env.COLLECTIONS_TO_SYNC
    ? env.COLLECTIONS_TO_SYNC.split(',').map(name => name.trim())
    : [];

  const allCollections = await fetchAllCollections(webflow, siteId);

  // Filter collections based on COLLECTIONS_TO_SYNC
  const collections = collectionsToSync.length > 0
    ? allCollections.filter(collection => {
        const slug = collection.slug || collection.displayName;
        return collectionsToSync.includes(slug);
      })
    : allCollections;

  if (collectionsToSync.length > 0) {
    console.log(`Syncing only specified collections: ${collectionsToSync.join(', ')}`);
  }
  if (statusFieldName && statusFieldName.trim() !== '') {
    console.log(`Using status field filter: '${statusFieldName}'`);
  }
  console.log(`Found ${collections.length} collection(s) to sync`);

  const syncResults = [];

  for (const collection of collections) {
    try {
      const result = await syncCollectionToAlgolia(webflow, algoliaClient, collection, statusFieldName);
      syncResults.push(result);
    } catch (error) {
      console.error(`Error syncing collection ${collection.displayName}:`, error);
      syncResults.push({
        collectionName: collection.displayName,
        error: error.message
      });
    }
  }

  const totalItemsSynced = syncResults.reduce((sum, result) => sum + (result.itemsSynced || 0), 0);

  console.log(`Sync complete. Total items synced: ${totalItemsSynced}`);

  return {
    success: true,
    collectionsProcessed: collections.length,
    totalItemsSynced: totalItemsSynced,
    results: syncResults,
    timestamp: new Date().toISOString()
  };
}
