export async function fetchAllCollectionItems(webflow, collectionId) {
  let allItems = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      // Always use listItemsLive to get only published items
      const response = await webflow.collections.items.listItemsLive(collectionId, {
        offset: offset,
        limit: limit
      });

      if (response.items && response.items.length > 0) {
        allItems = allItems.concat(response.items);
        offset += limit;

        if (response.items.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching items at offset ${offset}:`, error.message);
      throw error;
    }
  }

  return allItems;
}

export async function fetchAllCollections(webflow, siteId) {
  console.log(`Fetching all collections from Webflow site: ${siteId}`);

  const collectionsResponse = await webflow.collections.list(siteId);
  const collections = collectionsResponse.collections || [];

  console.log(`Found ${collections.length} collections to sync`);

  return collections;
}

export function filterPublishedItems(items) {
  return items.filter(item => {
    // Only include items in "Published" state:
    // - lastPublished must exist
    // - isDraft must be false
    // - isArchived must be false
    if (!item.lastPublished) return false;
    if (item.isDraft === true) return false;
    if (item.isArchived === true) return false;

    return true;
  });
}

export function filterByStatusField(items, statusFieldName) {
  // If no status field is specified, return all items
  if (!statusFieldName || statusFieldName.trim() === '') {
    return items;
  }

  return items.filter(item => {
    // Get the field data from the item
    const fieldData = item.fieldData;

    if (!fieldData) {
      // If no fieldData, include the item (blank = include everything)
      return true;
    }

    const statusValue = fieldData[statusFieldName];

    // If the field doesn't exist or is blank/null/undefined, include the item
    if (statusValue === undefined || statusValue === null || statusValue === '') {
      return true;
    }

    // If the field is explicitly set to true, include the item
    if (statusValue === true) {
      return true;
    }

    // If the field is explicitly set to false, exclude the item
    if (statusValue === false) {
      return false;
    }

    // For any other value, include the item by default
    return true;
  });
}
