function stripToPlainText(value) {
  if (typeof value !== 'string') return value;

  let text = value;

  // Remove script and style tags with their content
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#039;/g, "'");

  // Collapse whitespace and trim
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export function transformItemsToAlgoliaRecords(items) {
  return items.map(item => {
    const record = {
      objectID: item.id,
      ...item.fieldData
    };

    // Strip all HTML/styling from string fields
    Object.keys(record).forEach(key => {
      if (typeof record[key] === 'string') {
        record[key] = stripToPlainText(record[key]);
      }
    });

    if (item.createdOn) {
      record.createdOn = item.createdOn;
    }
    if (item.updatedOn) {
      record.updatedOn = item.updatedOn;
    }
    if (item.publishedOn) {
      record.publishedOn = item.publishedOn;
    }
    if (item.isDraft !== undefined) {
      record.isDraft = item.isDraft;
    }
    if (item.isArchived !== undefined) {
      record.isArchived = item.isArchived;
    }

    return record;
  });
}

export async function syncToAlgoliaIndex(algoliaClient, indexName, records) {
  console.log(`  Syncing ${records.length} records to Algolia`);

  await algoliaClient.replaceAllObjects({
    indexName: indexName,
    objects: records
  });

  console.log(`  Successfully synced ${records.length} records to Algolia`);
  console.log(`  ✓ Index ${indexName} now contains ${records.length} records`);
}
